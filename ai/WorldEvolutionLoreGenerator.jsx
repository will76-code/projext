import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";

export default function WorldEvolutionLoreGenerator({ worldId }) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [emergentLore, setEmergentLore] = useState(null);

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const { data: world } = useQuery({
    queryKey: ['world', worldId],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ id: worldId });
      return worlds[0];
    },
    enabled: !!worldId
  });

  const updateEvolutionMutation = useMutation({
    mutationFn: async (data) => {
      if (worldEvolution) {
        return base44.entities.WorldEvolution.update(worldEvolution.id, data);
      } else {
        return base44.entities.WorldEvolution.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worldEvolution', worldId] });
      toast.success('Lore generated and saved!');
    }
  });

  const generateEmergentLore = async () => {
    setIsGenerating(true);
    try {
      const lore = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate emergent lore from world evolution data:

World: ${world?.name} (${world?.rulebook_franchise})
Genre: ${world?.genre}
Game System: ${world?.game_system}

Current World State:
${JSON.stringify(worldEvolution?.world_state || {})}

Recent Simulated Events:
${JSON.stringify(worldEvolution?.simulated_events?.slice(0, 5) || [])}

Campaign Impacts:
${JSON.stringify(worldEvolution?.campaign_states?.slice(0, 3) || [])}

Generate emergent lore that:
1. Emerges naturally from world state changes
2. Connects to simulated events and campaign outcomes
3. Feels organic to the world's franchise/genre
4. Creates hooks for future storylines`,
        response_json_schema: {
          type: "object",
          properties: {
            lore_pieces: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  lore_type: {
                    type: "string",
                    enum: ["prophecy", "historical_event", "faction_shift", "character_arc", "mystery"]
                  },
                  content: { type: "string" },
                  triggered_by: { type: "string" },
                  narrative_weight: { type: "string", enum: ["minor", "major", "legendary"] }
                }
              }
            },
            interconnections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  lore1: { type: "string" },
                  lore2: { type: "string" },
                  connection: { type: "string" }
                }
              }
            }
          }
        }
      });

      setEmergentLore(lore);

      // Auto-save to WorldEvolution
      if (lore.lore_pieces?.length > 0) {
        const newLoreItems = lore.lore_pieces.map(piece => ({
          lore_type: piece.lore_type,
          content: piece.content,
          triggered_by: piece.triggered_by,
          created_date: new Date().toISOString()
        }));

        await updateEvolutionMutation.mutateAsync({
          world_id: worldId,
          emergent_lore: [
            ...(worldEvolution?.emergent_lore || []),
            ...newLoreItems
          ]
        });
      }
    } catch (error) {
      toast.error('Failed to generate lore');
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          World Evolution Lore Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateEmergentLore}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Emergent Lore
        </Button>

        {emergentLore && (
          <div className="space-y-4">
            {emergentLore.lore_pieces?.map((piece, i) => (
              <div key={i} className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-600">{piece.lore_type}</Badge>
                  <Badge variant="outline" className={
                    piece.narrative_weight === 'legendary' ? 'border-yellow-500/50 text-yellow-400' :
                    piece.narrative_weight === 'major' ? 'border-orange-500/50 text-orange-400' :
                    'border-blue-500/50 text-blue-400'
                  }>
                    {piece.narrative_weight}
                  </Badge>
                </div>

                <p className="text-sm text-purple-200">{piece.content}</p>

                {piece.triggered_by && (
                  <div className="bg-slate-800/50 rounded p-2 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">Triggered by: {piece.triggered_by}</span>
                  </div>
                )}
              </div>
            ))}

            {emergentLore.interconnections?.length > 0 && (
              <div className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
                <h5 className="font-semibold text-slate-300 text-sm">🔗 Lore Interconnections</h5>
                <div className="space-y-2">
                  {emergentLore.interconnections.map((inter, i) => (
                    <div key={i} className="text-xs text-slate-400">
                      <p><span className="text-purple-400 font-semibold">{inter.lore1}</span> ↔ <span className="text-purple-400 font-semibold">{inter.lore2}</span></p>
                      <p className="text-slate-500 ml-2">→ {inter.connection}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}