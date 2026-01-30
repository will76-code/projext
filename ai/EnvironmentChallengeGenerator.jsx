import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mountain, Wind } from "lucide-react";
import { toast } from "sonner";

export default function EnvironmentChallengeGenerator({ character, location, world, messages }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [challenges, setChallenges] = useState(null);

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', world?.id],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: world?.id });
      return evolution[0];
    },
    enabled: !!world?.id
  });

  const generateChallenges = async () => {
    if (!location) {
      toast.error('Location required');
      return;
    }

    setIsGenerating(true);
    try {
      const recentNarrative = messages?.slice(-15).map(m => m.content).join('\n') || '';

      const generated = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate dynamic, world-state-aware environment challenges:

Location: ${location}
Character: ${character?.name} (Level ${character?.level} ${character?.class_role})
World: ${world?.name} (${world?.genre})
Game System: ${world?.game_system}
Campaign Tones: ${campaign?.campaign_tones?.join(', ') || 'Epic Adventure'}

Current World State:
- Political: ${worldEvolution?.world_state?.political_landscape}
- Power Shifts: ${JSON.stringify(worldEvolution?.world_state?.power_shifts || [])}
- Resources: ${JSON.stringify(worldEvolution?.world_state?.resources_status || {})}
- Environment: ${JSON.stringify(worldEvolution?.world_state?.environmental_challenges || [])}

Recent Simulated Events:
${JSON.stringify(worldEvolution?.simulated_events?.slice(0, 3) || [])}

Recent Narrative:
${recentNarrative.slice(0, 400)}

Create environmental challenges that:
1. Are dynamically influenced by current world state and simulated events
2. Reflect location hazards that have changed due to recent world shifts
3. Include consequences of recent power dynamics or environmental events
4. Scale appropriately to character level with meaningful difficulty
5. Adapt to character's class and known abilities
6. Feature interactive/dynamic elements that evolve during encounter
7. Incorporate campaign tone (${campaign?.campaign_tones?.join(', ')}) into atmospheric design
8. Create lasting impact on world state through resolution`,
        response_json_schema: {
          type: "object",
          properties: {
            location_atmosphere: { type: "string" },
            environment_description: { type: "string" },
            hazards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  dc_or_effect: { type: "string" },
                  interaction_opportunities: { type: "array", items: { type: "string" } }
                }
              }
            },
            dynamic_elements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  element: { type: "string" },
                  trigger: { type: "string" },
                  effect: { type: "string" }
                }
              }
            },
            discovery_opportunities: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setChallenges(generated);
      toast.success('Environment generated!');
    } catch (error) {
      toast.error('Failed to generate challenges');
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Mountain className="w-5 h-5" />
          Environment Challenge Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateChallenges}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wind className="w-4 h-4 mr-2" />}
          Generate Environment: {location || 'Location'}
        </Button>

        {challenges && (
          <div className="space-y-4">
            {/* Atmosphere */}
            {challenges.location_atmosphere && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-400 mb-1">🎭 Atmosphere:</p>
                <p className="text-xs text-green-200 italic">{challenges.location_atmosphere}</p>
              </div>
            )}

            {/* Description */}
            {challenges.environment_description && (
              <div className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3">
                <p className="text-sm text-slate-200 leading-relaxed">{challenges.environment_description}</p>
              </div>
            )}

            {/* Hazards */}
            {challenges.hazards?.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-orange-300 text-sm">⚠️ Environmental Hazards:</h5>
                {challenges.hazards.map((hazard, i) => (
                  <div key={i} className="bg-orange-900/20 border border-orange-500/30 rounded p-2 space-y-1">
                    <p className="font-semibold text-orange-300 text-sm">{hazard.name}</p>
                    <p className="text-xs text-orange-200">{hazard.description}</p>
                    <p className="text-xs text-yellow-300">📊 {hazard.dc_or_effect}</p>
                    {hazard.interaction_opportunities?.length > 0 && (
                      <div className="text-xs text-green-400 mt-1">
                        <p className="font-semibold mb-1">🔍 Ways to Interact:</p>
                        <ul className="ml-2 list-disc">
                          {hazard.interaction_opportunities.map((opp, j) => (
                            <li key={j}>{opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic Elements */}
            {challenges.dynamic_elements?.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-blue-300 text-sm">⚡ Dynamic Elements:</h5>
                {challenges.dynamic_elements.map((elem, i) => (
                  <div key={i} className="bg-blue-900/20 border border-blue-500/30 rounded p-2 space-y-1">
                    <p className="font-semibold text-blue-300 text-xs">{elem.element}</p>
                    <p className="text-xs text-blue-200">Trigger: {elem.trigger}</p>
                    <p className="text-xs text-blue-200">Effect: {elem.effect}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Discovery Opportunities */}
            {challenges.discovery_opportunities?.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-purple-300 text-sm">🗺️ Discovery Opportunities:</h5>
                <ul className="ml-3 text-xs text-purple-300 list-disc space-y-1">
                  {challenges.discovery_opportunities.map((opp, i) => (
                    <li key={i}>{opp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}