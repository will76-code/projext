import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Sword, BookOpen, Users, Map } from "lucide-react";
import { toast } from "sonner";

export default function AIDungeonMaster({ character, campaign, world, messages = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tacticalAdvice, setTacticalAdvice] = useState(null);
  const [loreExplanation, setLoreExplanation] = useState(null);
  const [plotHooks, setPlotHooks] = useState([]);
  const [npcMotivations, setNpcMotivations] = useState(null);

  const generateTacticalAdvice = async () => {
    setIsGenerating(true);
    try {
      const recentContext = messages.slice(-5).map(m => m.content).join('\n');
      
      const { data: worldEvolution } = await base44.entities.WorldEvolution.filter({ world_id: world.id }).catch(() => ({ data: [] }));
      
      const advice = await base44.integrations.Core.InvokeLLM({
        prompt: `As an AI Dungeon Master, provide tactical combat advice:

Character: ${character.name} (${character.class_role}, Level ${character.level})
Abilities: ${JSON.stringify(character.skills)}
Resources: HP ${character.resources?.hp_current}/${character.resources?.hp_max}

Recent Scene: ${recentContext}

Suggest 3 tactical options with pros/cons. Be specific to their abilities.`,
        response_json_schema: {
          type: "object",
          properties: {
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  pros: { type: "string" },
                  cons: { type: "string" },
                  success_chance: { type: "string" }
                }
              }
            }
          }
        }
      });

      setTacticalAdvice(advice);
      toast.success("Tactical advice ready!");
    } catch (error) {
      toast.error("Failed to generate advice");
    }
    setIsGenerating(false);
  };

  const explainLore = async () => {
    setIsGenerating(true);
    try {
      const recentContext = messages.slice(-3).map(m => m.content).join('\n');

      const explanation = await base44.integrations.Core.InvokeLLM({
        prompt: `Explain the lore context of this scene:

World: ${world.name} (${world.genre})
Recent Events: ${recentContext}

Provide historical context, cultural significance, and relevant world lore.`,
        add_context_from_internet: false
      });

      setLoreExplanation(explanation);
      toast.success("Lore explained!");
    } catch (error) {
      toast.error("Failed to explain lore");
    }
    setIsGenerating(false);
  };

  const generatePlotHooks = async () => {
    setIsGenerating(true);
    try {
      const { data: worldEvolution } = await base44.entities.WorldEvolution.filter({ world_id: world.id }).catch(() => ({ data: [] }));
      const evolutionContext = worldEvolution[0] ? JSON.stringify(worldEvolution[0].emergent_lore?.slice(0, 3)) : '';

      const hooks = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 dynamic plot hooks based on player actions:

Character: ${character.name}
Recent Actions: ${messages.slice(-5).map(m => m.content).join('\n')}
World Evolution: ${evolutionContext}

Create hooks that feel like natural consequences of player choices.`,
        response_json_schema: {
          type: "object",
          properties: {
            hooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  urgency: { type: "string" },
                  reward_hint: { type: "string" }
                }
              }
            }
          }
        }
      });

      setPlotHooks(hooks.hooks);
      toast.success("Plot hooks generated!");
    } catch (error) {
      toast.error("Failed to generate hooks");
    }
    setIsGenerating(false);
  };

  const analyzeNPCMotivations = async () => {
    setIsGenerating(true);
    try {
      const npcs = campaign.npcs || [];
      const recentContext = messages.slice(-5).map(m => m.content).join('\n');

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze NPC motivations in current scene:

NPCs Present: ${JSON.stringify(npcs)}
Recent Interactions: ${recentContext}

Reveal hidden motivations, potential betrayals, and true goals.`,
        add_context_from_internet: false
      });

      setNpcMotivations(analysis);
      toast.success("NPC motivations revealed!");
    } catch (error) {
      toast.error("Failed to analyze NPCs");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Dungeon Master
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tactical" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
            <TabsTrigger value="tactical">Tactics</TabsTrigger>
            <TabsTrigger value="lore">Lore</TabsTrigger>
            <TabsTrigger value="hooks">Hooks</TabsTrigger>
            <TabsTrigger value="npcs">NPCs</TabsTrigger>
          </TabsList>

          <TabsContent value="tactical" className="space-y-3 mt-4">
            <Button
              onClick={generateTacticalAdvice}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sword className="w-4 h-4 mr-2" />}
              Get Tactical Advice
            </Button>

            {tacticalAdvice?.options?.map((option, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                <h5 className="font-semibold text-purple-300 mb-2">{option.action}</h5>
                <div className="text-xs space-y-1">
                  <p className="text-green-400">✓ {option.pros}</p>
                  <p className="text-red-400">✗ {option.cons}</p>
                  <p className="text-yellow-400">Success: {option.success_chance}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="lore" className="space-y-3 mt-4">
            <Button
              onClick={explainLore}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
              Explain Lore
            </Button>

            {loreExplanation && (
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3">
                <p className="text-sm text-white whitespace-pre-wrap">{loreExplanation}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="hooks" className="space-y-3 mt-4">
            <Button
              onClick={generatePlotHooks}
              disabled={isGenerating}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Map className="w-4 h-4 mr-2" />}
              Generate Plot Hooks
            </Button>

            {plotHooks.map((hook, i) => (
              <div key={i} className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-3">
                <h5 className="font-semibold text-pink-300">{hook.title}</h5>
                <p className="text-sm text-white mt-1">{hook.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-yellow-600 px-2 py-1 rounded">{hook.urgency}</span>
                  <span className="text-xs text-yellow-300">{hook.reward_hint}</span>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="npcs" className="space-y-3 mt-4">
            <Button
              onClick={analyzeNPCMotivations}
              disabled={isGenerating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Analyze NPCs
            </Button>

            {npcMotivations && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-white whitespace-pre-wrap">{npcMotivations}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}