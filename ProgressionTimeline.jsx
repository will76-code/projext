import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, Loader2, MapPin, Crown, Zap } from "lucide-react";
import { toast } from "sonner";

export default function ProgressionTimeline({ character, campaignId }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressionPath, setProgressionPath] = useState(null);

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', character?.world_id],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: character.world_id });
      return evolution[0];
    },
    enabled: !!character?.world_id
  });

  const { data: world } = useQuery({
    queryKey: ['world', character?.world_id],
    queryFn: () => base44.entities.World.filter({ id: character.world_id }).then(w => w[0]),
    enabled: !!character?.world_id
  });

  const generateProgressionPath = async () => {
    setIsGenerating(true);
    try {
      const path = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a visual character progression path for ${character.name} (Level ${character.level} ${character.race} ${character.class_role}):

World: ${world?.name} (${world?.rulebook_franchise})
World Events: ${JSON.stringify(worldEvolution?.simulated_events?.slice(0, 5) || [])}
Emergent Lore: ${JSON.stringify(worldEvolution?.emergent_lore?.slice(0, 5) || [])}
World State: ${JSON.stringify(worldEvolution?.world_state || {})}

Generate a progression timeline with:
1. Current milestone (where they are now)
2. 3-5 future milestones tied to WorldEvolution events
3. Unique customization unlocks (tied to factions, events, lore)
4. Franchise-appropriate power progression

Each milestone should feel earned and narratively significant.`,
        response_json_schema: {
          type: "object",
          properties: {
            current_milestone: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                level: { type: "number" }
              }
            },
            future_milestones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  level: { type: "number" },
                  world_event_trigger: { type: "string" },
                  unlocks: { type: "array", items: { type: "string" } }
                }
              }
            },
            faction_paths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  faction_name: { type: "string" },
                  allegiance_level: { type: "string" },
                  unique_abilities: { type: "array", items: { type: "string" } },
                  story_implications: { type: "string" }
                }
              }
            }
          }
        }
      });

      setProgressionPath(path);
      toast.success("Progression path generated!");
    } catch (error) {
      toast.error("Failed to generate progression path");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Character Progression Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateProgressionPath}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Progression Path
        </Button>

        {progressionPath && (
          <div className="space-y-6">
            {/* Current Milestone */}
            <div className="relative pl-8 pb-6 border-l-2 border-purple-500">
              <div className="absolute -left-3 top-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="bg-purple-900/30 border border-purple-500/40 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-purple-600">Level {progressionPath.current_milestone.level}</Badge>
                  <span className="text-sm text-purple-300 font-semibold">Current Position</span>
                </div>
                <h5 className="font-semibold text-purple-200 mb-2">{progressionPath.current_milestone.title}</h5>
                <p className="text-sm text-purple-300">{progressionPath.current_milestone.description}</p>
              </div>
            </div>

            {/* Future Milestones */}
            {progressionPath.future_milestones?.map((milestone, i) => (
              <div key={i} className="relative pl-8 pb-6 border-l-2 border-slate-600 border-dashed">
                <div className="absolute -left-3 top-0 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center border-2 border-purple-500/50">
                  <Zap className="w-3 h-3 text-purple-400" />
                </div>
                <div className="bg-slate-700/30 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="border-purple-500/50 text-purple-300">Level {milestone.level}</Badge>
                  </div>
                  <h5 className="font-semibold text-purple-200 mb-2">{milestone.title}</h5>
                  <p className="text-sm text-purple-300 mb-3">{milestone.description}</p>
                  
                  {milestone.world_event_trigger && (
                    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-2 mb-2">
                      <p className="text-xs text-indigo-400 flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Triggered by: {milestone.world_event_trigger}
                      </p>
                    </div>
                  )}

                  {milestone.unlocks?.length > 0 && (
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">Unlocks:</p>
                      <ul className="ml-3 text-xs text-yellow-300">
                        {milestone.unlocks.map((unlock, j) => (
                          <li key={j}>• {unlock}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Faction Paths */}
            {progressionPath.faction_paths?.length > 0 && (
              <div className="mt-6 space-y-3">
                <h5 className="font-semibold text-purple-300 text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Faction Allegiance Paths
                </h5>
                {progressionPath.faction_paths.map((faction, i) => (
                  <div key={i} className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-semibold text-pink-300">{faction.faction_name}</h6>
                      <Badge className="bg-pink-600">{faction.allegiance_level}</Badge>
                    </div>
                    <p className="text-xs text-pink-300 mb-2 italic">{faction.story_implications}</p>
                    <div>
                      <p className="text-xs text-yellow-400 mb-1">Unique Abilities:</p>
                      <ul className="ml-3 text-xs text-yellow-300">
                        {faction.unique_abilities.map((ability, j) => (
                          <li key={j}>• {ability}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}