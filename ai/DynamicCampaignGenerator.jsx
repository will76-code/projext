import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, MapPin, Users, Target, BookMarked } from "lucide-react";
import { toast } from "sonner";

export default function DynamicCampaignGenerator({ world, existingCampaigns = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignScenario, setCampaignScenario] = useState(null);

  const generateScenario = async () => {
    setIsGenerating(true);
    try {
      // Fetch world evolution data
      const evolutionData = await base44.entities.WorldEvolution.filter({ world_id: world.id });
      const worldContext = evolutionData.length > 0 ? evolutionData[0] : null;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a DYNAMIC, MULTI-STAGE campaign scenario for ${world.name}:

World: ${world.name}
Genre: ${world.genre}
Game System: ${world.game_system}
Description: ${world.description}

${worldContext ? `
WORLD EVOLUTION CONTEXT:
Previous Campaign Events: ${JSON.stringify(worldContext.campaign_states?.slice(0, 3))}
Emergent Lore: ${JSON.stringify(worldContext.emergent_lore?.slice(0, 5))}
Current World State: ${JSON.stringify(worldContext.world_state)}

CRITICAL: Use this context to create scenarios that EVOLVE from previous campaigns. Reference past events, changed power dynamics, and emergent lore to make this feel like a living, breathing world.
` : 'This is the FIRST campaign in this world. Create foundational scenarios.'}

Generate:
1. Main Campaign Arc (5 stages with branching paths)
2. 5 Side Quests (each with multiple solutions)
3. Overarching Plot (with 3 possible endings)
4. Dynamic Events (triggered by player choices)
5. Faction Involvement (how player actions affect factions)
6. Adaptation Points (where AI adjusts narrative)

Make scenarios NON-PREDICTABLE with genuine player agency and emergent storytelling.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            main_arc: {
              type: "object",
              properties: {
                stages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      stage_number: { type: "number" },
                      title: { type: "string" },
                      description: { type: "string" },
                      key_locations: { type: "array", items: { type: "string" } },
                      major_npcs: { type: "array", items: { type: "string" } },
                      branching_paths: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            choice: { type: "string" },
                            consequence: { type: "string" },
                            leads_to: { type: "string" }
                          }
                        }
                      },
                      adaptation_trigger: { type: "string" }
                    }
                  }
                }
              }
            },
            side_quests: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  solutions: { type: "array", items: { type: "string" } },
                  rewards: { type: "string" },
                  connects_to_main: { type: "string" }
                }
              }
            },
            overarching_plot: {
              type: "object",
              properties: {
                mystery: { type: "string" },
                true_villain: { type: "string" },
                possible_endings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      ending_name: { type: "string" },
                      requirements: { type: "string" },
                      outcome: { type: "string" },
                      world_impact: { type: "string" }
                    }
                  }
                }
              }
            },
            dynamic_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event: { type: "string" },
                  trigger: { type: "string" },
                  variations: { type: "array", items: { type: "string" } }
                }
              }
            },
            faction_dynamics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  faction: { type: "string" },
                  initial_stance: { type: "string" },
                  player_influence: { type: "string" },
                  consequences: { type: "string" }
                }
              }
            }
          }
        }
      });

      setCampaignScenario(response);
      toast.success("Campaign scenario generated!");
    } catch (error) {
      toast.error("Failed to generate scenario");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BookMarked className="w-5 h-5" />
          Dynamic Campaign Generator
        </CardTitle>
        <p className="text-xs text-purple-400 mt-1">
          AI-driven scenarios that adapt to player choices and world evolution
        </p>
      </CardHeader>
      <CardContent>
        <Button
          onClick={generateScenario}
          disabled={isGenerating}
          className="w-full bg-purple-600 hover:bg-purple-700 mb-4"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Campaign Scenario
        </Button>

        {campaignScenario && (
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-700/50">
              <TabsTrigger value="main">Main Arc</TabsTrigger>
              <TabsTrigger value="side">Side Quests</TabsTrigger>
              <TabsTrigger value="plot">Plot</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="factions">Factions</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 mb-3">
                <h5 className="font-semibold text-purple-300">{campaignScenario.title}</h5>
                <p className="text-sm text-white mt-2">{campaignScenario.hook}</p>
              </div>

              {campaignScenario.main_arc?.stages?.map((stage, i) => (
                <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-600">Stage {stage.stage_number}</Badge>
                    <h5 className="font-semibold text-purple-300">{stage.title}</h5>
                  </div>
                  <p className="text-sm text-white mb-2">{stage.description}</p>
                  
                  {stage.branching_paths?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-purple-400 font-semibold">Branching Paths:</p>
                      {stage.branching_paths.map((path, j) => (
                        <div key={j} className="text-xs bg-purple-950/30 rounded p-2">
                          <p className="text-purple-300">→ {path.choice}</p>
                          <p className="text-white ml-3">• {path.consequence}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="side" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
              {campaignScenario.side_quests?.map((quest, i) => (
                <div key={i} className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3">
                  <h5 className="font-semibold text-indigo-300">{quest.title}</h5>
                  <p className="text-sm text-white my-2">{quest.description}</p>
                  <div className="text-xs space-y-1">
                    <p className="text-indigo-400">Solutions:</p>
                    <ul className="ml-3 space-y-1">
                      {quest.solutions?.map((sol, j) => (
                        <li key={j}>• {sol}</li>
                      ))}
                    </ul>
                    <p className="text-indigo-400 mt-2">Connection: {quest.connects_to_main}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="plot" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
              <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-3">
                <h5 className="font-semibold text-pink-300 mb-2">The Mystery</h5>
                <p className="text-sm text-white">{campaignScenario.overarching_plot?.mystery}</p>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <h5 className="font-semibold text-red-300 mb-2">True Villain</h5>
                <p className="text-sm text-white">{campaignScenario.overarching_plot?.true_villain}</p>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-purple-300">Possible Endings</h5>
                {campaignScenario.overarching_plot?.possible_endings?.map((ending, i) => (
                  <div key={i} className="bg-purple-950/30 rounded p-2 text-xs">
                    <p className="font-semibold text-purple-300">{ending.ending_name}</p>
                    <p className="text-white mt-1">{ending.outcome}</p>
                    <p className="text-purple-400 mt-1">Impact: {ending.world_impact}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
              {campaignScenario.dynamic_events?.map((event, i) => (
                <div key={i} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                  <h5 className="font-semibold text-yellow-300">{event.event}</h5>
                  <p className="text-xs text-yellow-400 mt-1">Trigger: {event.trigger}</p>
                  <div className="mt-2 text-xs">
                    <p className="text-yellow-400">Variations:</p>
                    <ul className="ml-3 space-y-1 text-white">
                      {event.variations?.map((v, j) => (
                        <li key={j}>• {v}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="factions" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
              {campaignScenario.faction_dynamics?.map((faction, i) => (
                <div key={i} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                  <h5 className="font-semibold text-green-300">{faction.faction}</h5>
                  <div className="text-xs mt-2 space-y-1 text-white">
                    <p><span className="text-green-400">Initial Stance:</span> {faction.initial_stance}</p>
                    <p><span className="text-green-400">Player Influence:</span> {faction.player_influence}</p>
                    <p><span className="text-green-400">Consequences:</span> {faction.consequences}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}