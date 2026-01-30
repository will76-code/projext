import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Swords, Music } from "lucide-react";
import { toast } from "sonner";

export default function DynamicEncounterGenerator({ campaignId, worldId, characterLevel = 5 }) {
  const [encounter, setEncounter] = useState(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      try {
        return await base44.entities.Campaign.filter({ id: campaignId }).then(r => r[0]);
      } catch {
        return null;
      }
    },
    enabled: !!campaignId
  });

  const generateEncounter = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a D&D encounter generator. Create a ${difficulty} encounter for a party of level ${characterLevel} adventurers in this setting: ${campaign?.story_summary || 'A fantasy world'}.

Include:
1. Encounter Name and Description (2-3 sentences of atmospheric narrative)
2. Enemy Stat Blocks (2-3 enemies with AC, HP, main attacks, abilities)
3. Environmental Features (3-4 interactive elements)
4. Tactical Suggestions (how enemies should fight, positioning)
5. Loot Table (what enemies drop if defeated)
6. Escape Routes (how party can flee if needed)
7. Difficulty Notes (what makes this ${difficulty})

Format as JSON with these exact keys: name, description, enemies, environment, tactics, loot, escapeRoutes, difficultyNotes`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            enemies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  ac: { type: "number" },
                  hp: { type: "number" },
                  attacks: { type: "array", items: { type: "string" } },
                  abilities: { type: "array", items: { type: "string" } }
                }
              }
            },
            environment: { type: "array", items: { type: "string" } },
            tactics: { type: "string" },
            loot: { type: "array", items: { type: "string" } },
            escapeRoutes: { type: "array", items: { type: "string" } },
            difficultyNotes: { type: "string" }
          }
        }
      });
      setEncounter(result);
      toast.success('Encounter generated!');
    } catch (error) {
      toast.error('Failed to generate encounter');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-red-500/30">
      <CardHeader>
        <CardTitle className="text-red-300 flex items-center gap-2">
          <Swords className="w-5 h-5" />
          Dynamic Encounter Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!encounter ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-700/50 border border-red-500/30 rounded px-3 py-2 text-sm text-slate-200"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="deadly">Deadly</option>
              </select>
            </div>

            <Button
              onClick={generateEncounter}
              disabled={isGenerating}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Swords className="w-4 h-4 mr-2" />}
              Generate {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Encounter
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div>
                <h5 className="font-semibold text-red-300">{encounter.name}</h5>
                <p className="text-sm text-slate-300 mt-1">{encounter.description}</p>
              </div>

              <div className="border-t border-slate-600 pt-3 space-y-2">
                <h6 className="font-semibold text-slate-300 text-sm">Enemies</h6>
                {encounter.enemies?.map((enemy, i) => (
                  <div key={i} className="bg-slate-700/30 rounded p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">{enemy.name}</span>
                      <div className="flex gap-1">
                        <Badge className="bg-red-900 text-xs">AC {enemy.ac}</Badge>
                        <Badge className="bg-red-900 text-xs">{enemy.hp} HP</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      <strong>Attacks:</strong> {enemy.attacks?.join(', ')}
                    </p>
                    {enemy.abilities?.length > 0 && (
                      <p className="text-xs text-slate-400">
                        <strong>Abilities:</strong> {enemy.abilities.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-600 pt-3 space-y-2">
                <h6 className="font-semibold text-slate-300 text-sm">Environment</h6>
                <ul className="text-xs text-slate-300 space-y-1">
                  {encounter.environment?.map((feature, i) => (
                    <li key={i}>• {feature}</li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-600 pt-3">
                <h6 className="font-semibold text-slate-300 text-sm mb-1">Tactics</h6>
                <p className="text-xs text-slate-300">{encounter.tactics}</p>
              </div>

              <div className="border-t border-slate-600 pt-3 space-y-2">
                <h6 className="font-semibold text-slate-300 text-sm">Loot</h6>
                <div className="flex flex-wrap gap-1">
                  {encounter.loot?.map((item, i) => (
                    <Badge key={i} className="bg-yellow-900 text-xs">{item}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={() => setEncounter(null)} variant="outline" className="w-full border-red-500/50">
              Generate New Encounter
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}