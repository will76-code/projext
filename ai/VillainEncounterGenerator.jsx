import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Skull, Swords, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import NPCConversation from "./NPCConversation";
import { toast } from "sonner";

export default function VillainEncounterGenerator({ world, character, campaignContext = "" }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [villain, setVillain] = useState(null);
  const [encounter, setEncounter] = useState(null);

  const generateVillain = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a compelling villain for this world and character:

World: ${world.name} (${world.genre})
Character Level: ${character.level}
Character Class: ${character.class_role}

Generate a memorable villain with:
- Unique personality and motivation
- Dark backstory with connection to hero
- Complete stat block and abilities
- Signature moves and tactics
- Racial traits and attributes
- Weaknesses and fears
- Long-term plans

Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            race: { type: "string" },
            appearance: { type: "string" },
            personality: { type: "string" },
            motivation: { type: "string" },
            backstory: { type: "string" },
            connection_to_hero: { type: "string" },
            stats: {
              type: "object",
              properties: {
                level: { type: "number" },
                hp: { type: "number" },
                ac: { type: "number" },
                attributes: { type: "object" }
              }
            },
            racial_traits: { type: "array", items: { type: "string" } },
            abilities: { type: "array", items: { type: "string" } },
            signature_moves: { type: "array", items: { type: "string" } },
            tactics: { type: "string" },
            weaknesses: { type: "array", items: { type: "string" } },
            long_term_plans: { type: "string" }
          }
        }
      });

      setVillain(response);
      toast.success("Villain created!");
    } catch (error) {
      toast.error("Failed to generate villain");
    }
    setIsGenerating(false);
  };

  const generateEncounter = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Design a dynamic encounter:

World: ${world.name}
Party Level: ${character.level}

Create an encounter with:
- Multiple enemy types with varied abilities
- Environmental hazards and terrain
- Tactical complexity
- Multiple win/loss conditions
- Surprise elements
- Loot and rewards

Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            difficulty: { type: "string" },
            enemies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  count: { type: "number" },
                  stats: { type: "object" },
                  tactics: { type: "string" }
                }
              }
            },
            environment: { type: "string" },
            hazards: { type: "array", items: { type: "string" } },
            objectives: { type: "array", items: { type: "string" } },
            twists: { type: "array", items: { type: "string" } },
            rewards: { type: "array", items: { type: "string" } }
          }
        }
      });

      setEncounter(response);
      toast.success("Encounter designed!");
    } catch (error) {
      toast.error("Failed to generate encounter");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-red-500/30">
      <CardHeader>
        <CardTitle className="text-red-300 flex items-center gap-2">
          <Skull className="w-5 h-5" />
          Villain & Encounter Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="villain" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
            <TabsTrigger value="villain">Villain</TabsTrigger>
            <TabsTrigger value="encounter">Encounter</TabsTrigger>
          </TabsList>

          <TabsContent value="villain" className="space-y-3 mt-4">
            <Button
              onClick={generateVillain}
              disabled={isGenerating}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Skull className="w-4 h-4 mr-2" />}
              Generate Villain
            </Button>

            {villain && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <h5 className="font-semibold text-red-300 text-lg mb-1">{villain.name}</h5>
                <p className="text-sm text-red-400 italic mb-3">{villain.title}</p>
                
                <div className="space-y-3 text-sm">
                  <div><span className="text-red-400 font-semibold">Race:</span> <span className="text-white">{villain.race}</span></div>
                  <div><span className="text-red-400 font-semibold">Appearance:</span> <span className="text-white">{villain.appearance}</span></div>
                  <div><span className="text-red-400 font-semibold">Motivation:</span> <span className="text-white">{villain.motivation}</span></div>
                  <div><span className="text-purple-400 font-semibold">Connection to Hero:</span> <span className="text-white">{villain.connection_to_hero}</span></div>
                  
                  <div className="bg-slate-800/50 rounded p-3">
                    <p className="text-red-400 font-semibold mb-2">Stats</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>Lvl: {villain.stats?.level}</div>
                      <div>HP: {villain.stats?.hp}</div>
                      <div>AC: {villain.stats?.ac}</div>
                    </div>
                  </div>

                  {villain.racial_traits?.length > 0 && (
                    <div>
                      <p className="text-orange-400 font-semibold mb-1">Racial Traits:</p>
                      <ul className="text-xs space-y-1">
                        {villain.racial_traits.map((trait, i) => (
                          <li key={i}>• {trait}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {villain.signature_moves?.length > 0 && (
                    <div>
                      <p className="text-red-400 font-semibold mb-1">Signature Moves:</p>
                      <ul className="text-xs space-y-1">
                        {villain.signature_moves.map((move, i) => (
                          <li key={i} className="text-red-300">⚔ {move}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {villain.weaknesses?.length > 0 && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                      <p className="text-green-400 font-semibold text-xs mb-1">Weaknesses:</p>
                      <ul className="text-xs space-y-1">
                        {villain.weaknesses.map((weak, i) => (
                          <li key={i}>• {weak}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {villain && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Talk to {villain.name}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-slate-900 border-purple-500/30">
                      <NPCConversation 
                        npc={{...villain, role: villain.title, description: villain.backstory}}
                        world={world}
                        campaignContext={campaignContext}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="encounter" className="space-y-3 mt-4">
            <Button
              onClick={generateEncounter}
              disabled={isGenerating}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Swords className="w-4 h-4 mr-2" />}
              Generate Encounter
            </Button>

            {encounter && (
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-semibold text-orange-300 text-lg">{encounter.title}</h5>
                  <span className="text-xs bg-orange-600 px-2 py-1 rounded">{encounter.difficulty}</span>
                </div>
                <p className="text-sm text-white mb-4">{encounter.description}</p>

                <div className="space-y-3">
                  <div>
                    <p className="text-orange-400 font-semibold text-sm mb-2">Enemies:</p>
                    <div className="space-y-2">
                      {encounter.enemies?.map((enemy, i) => (
                        <div key={i} className="bg-slate-800/50 rounded p-2">
                          <p className="text-orange-300 font-semibold text-sm">{enemy.count}x {enemy.name}</p>
                          <p className="text-xs text-white mt-1">{enemy.tactics}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-yellow-400 font-semibold text-sm">Environment:</p>
                    <p className="text-xs text-white">{encounter.environment}</p>
                  </div>

                  {encounter.hazards?.length > 0 && (
                    <div>
                      <p className="text-red-400 font-semibold text-sm mb-1">Hazards:</p>
                      <ul className="text-xs space-y-1">
                        {encounter.hazards.map((hazard, i) => (
                          <li key={i}>⚠ {hazard}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {encounter.twists?.length > 0 && (
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded p-2">
                      <p className="text-purple-400 font-semibold text-xs mb-1">Twists:</p>
                      <ul className="text-xs space-y-1">
                        {encounter.twists.map((twist, i) => (
                          <li key={i}>• {twist}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}