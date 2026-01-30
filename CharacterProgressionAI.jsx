import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Zap, BookOpen, Sword } from "lucide-react";
import { toast } from "sonner";

export default function CharacterProgressionAI({ character, campaignId }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => base44.entities.Campaign.filter({ id: campaignId }).then(c => c[0]),
    enabled: !!campaignId
  });

  const { data: world } = useQuery({
    queryKey: ['world', character?.world_id],
    queryFn: () => base44.entities.World.filter({ id: character.world_id }).then(w => w[0]),
    enabled: !!character?.world_id
  });

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const worldEvolution = await base44.entities.WorldEvolution.filter({ world_id: character.world_id }).catch(() => []);
      const evolutionContext = worldEvolution[0] ? {
        emergent_lore: worldEvolution[0].emergent_lore?.slice(0, 5) || [],
        world_state: worldEvolution[0].world_state || {}
      } : null;

      const campaignMessages = campaign?.story_summary || "";

      const progressionData = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest character progression for ${character.name} (Level ${character.level} ${character.race} ${character.class_role}):

World: ${world?.name} (${world?.game_system}, Franchise: ${world?.rulebook_franchise})
Current Build: ${JSON.stringify(character.attributes)}
Skills: ${JSON.stringify(character.skills)}
Campaign Narrative: ${campaignMessages}
World Evolution: ${JSON.stringify(evolutionContext)}

Generate contextually relevant progression options:
1. New abilities/spells tied to world lore and franchise themes
2. Feats that reflect campaign experiences
3. Skill upgrades aligned with character development
4. World-specific power upgrades from WorldEvolution events

Make suggestions feel earned and narratively appropriate.`,
        response_json_schema: {
          type: "object",
          properties: {
            abilities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  narrative_justification: { type: "string" },
                  mechanical_effect: { type: "string" }
                }
              }
            },
            feats: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  prerequisites: { type: "string" },
                  benefit: { type: "string" }
                }
              }
            },
            skill_upgrades: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  upgrade_path: { type: "string" },
                  synergies: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(progressionData);
      toast.success("Progression suggestions ready!");
    } catch (error) {
      toast.error("Failed to generate suggestions");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Character Progression AI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={generateSuggestions}
          disabled={isGenerating}
          className="w-full bg-purple-600 hover:bg-purple-700 mb-4"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
          Generate Progression Options
        </Button>

        {suggestions && (
          <Tabs defaultValue="abilities" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
              <TabsTrigger value="abilities">Abilities</TabsTrigger>
              <TabsTrigger value="feats">Feats</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="abilities" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
              {suggestions.abilities?.map((ability, i) => (
                <div key={i} className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                  <h5 className="font-semibold text-purple-300 flex items-center gap-2">
                    <Sword className="w-4 h-4" />
                    {ability.name}
                  </h5>
                  <p className="text-sm text-white mt-2">{ability.description}</p>
                  <div className="text-xs mt-2 space-y-1">
                    <p className="text-yellow-400">⚡ {ability.mechanical_effect}</p>
                    <p className="text-purple-400 italic">📖 {ability.narrative_justification}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="feats" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
              {suggestions.feats?.map((feat, i) => (
                <div key={i} className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3">
                  <h5 className="font-semibold text-indigo-300">{feat.name}</h5>
                  <p className="text-sm text-white mt-2">{feat.description}</p>
                  <div className="text-xs mt-2 space-y-1">
                    <p className="text-yellow-400">Prerequisites: {feat.prerequisites}</p>
                    <p className="text-indigo-400">✓ {feat.benefit}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="skills" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
              {suggestions.skill_upgrades?.map((skill, i) => (
                <div key={i} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                  <h5 className="font-semibold text-green-300">{skill.skill}</h5>
                  <p className="text-sm text-white mt-2">{skill.upgrade_path}</p>
                  <p className="text-xs text-green-400 mt-2">Synergies: {skill.synergies}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}