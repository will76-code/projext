import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function NPCStatBlockAdjuster({ character, npcName, world, messages }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adjustedStats, setAdjustedStats] = useState(null);

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', world?.id],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: world?.id });
      return evolution[0];
    },
    enabled: !!world?.id
  });

  const generateAdjustedStats = async () => {
    if (!npcName) {
      toast.error('NPC name required');
      return;
    }

    setIsGenerating(true);
    try {
      const recentNarrative = messages?.slice(-15).map(m => m.content).join('\n') || '';

      const stats = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate nuanced NPC stat block exploiting specific character synergies and weaknesses:

NPC Name: ${npcName}
Player Character: ${character?.name} (Level ${character?.level} ${character?.race} ${character?.class_role})
Character Build Analysis:
- Special Traits: ${JSON.stringify(character?.special_things || [])}
- Skills: ${JSON.stringify(Object.keys(character?.skills || {}).join(', '))}
- Resources: HP ${character?.resources?.hp_current}/${character?.resources?.hp_max}, Mana ${character?.resources?.mana_current}/${character?.resources?.mana_max}
- Equipment: ${character?.inventory?.slice(0, 3).join(', ') || 'Unknown'}

Character Synergies: Identify combat synergies, preferred tactics, skill combinations
Character Weaknesses: Identify gaps in defense, resource management issues, tactical blind spots

World Context: ${world?.name}
Campaign Tones: ${campaign?.campaign_tones?.join(', ') || 'Epic Adventure'}

World State:
${JSON.stringify(worldEvolution?.world_state || {})}

Generate NPC stats that:
1. Are calibrated to challenge without being overwhelming
2. Specifically exploit identified character weaknesses (use their blind spots)
3. Counter their known strengths intelligently (test their synergies)
4. Include combo abilities that work well together
5. Have tactical depth reflecting campaign tone
6. Create dramatic narrative moments through combat design
7. Offer meaningful tactical choices during encounter`,
        response_json_schema: {
          type: "object",
          properties: {
            npc_name: { type: "string" },
            archetype: { type: "string" },
            level_or_cr: { type: "string" },
            core_stats: {
              type: "object",
              properties: {
                hp: { type: "string" },
                ac: { type: "string" },
                primary_attributes: { type: "object" }
              }
            },
            abilities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  synergy_note: { type: "string" }
                }
              }
            },
            weaknesses: {
              type: "array",
              items: { type: "string" }
            },
            adjustments_reason: { type: "string" },
            tactical_notes: { type: "string" }
          }
        }
      });

      setAdjustedStats(stats);
      toast.success('NPC stats generated!');
    } catch (error) {
      toast.error('Failed to generate stats');
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          NPC Stat Block Adjuster
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateAdjustedStats}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
          Generate Adjusted Stats: {npcName || 'NPC'}
        </Button>

        {adjustedStats && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-yellow-300">{adjustedStats.npc_name}</h4>
              <div className="flex gap-1">
                <Badge className="bg-yellow-600">{adjustedStats.archetype}</Badge>
                <Badge className="bg-purple-600">{adjustedStats.level_or_cr}</Badge>
              </div>
            </div>

            {/* Core Stats */}
            {adjustedStats.core_stats && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-xs text-yellow-400 font-semibold">HP</p>
                  <p className="text-sm text-yellow-300 font-bold">{adjustedStats.core_stats.hp}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-yellow-400 font-semibold">AC</p>
                  <p className="text-sm text-yellow-300 font-bold">{adjustedStats.core_stats.ac}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-yellow-400 font-semibold">Key Attr</p>
                  <p className="text-xs text-yellow-300">
                    {Object.entries(adjustedStats.core_stats.primary_attributes || {})
                      .map(([key, val]) => `${key.slice(0, 3).toUpperCase()} ${val}`)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Abilities */}
            {adjustedStats.abilities?.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-purple-300 text-sm">⚡ Special Abilities:</h5>
                {adjustedStats.abilities.map((ability, i) => (
                  <div key={i} className="bg-purple-900/20 border border-purple-500/30 rounded p-2 space-y-1">
                    <p className="font-semibold text-purple-300 text-sm">{ability.name}</p>
                    <p className="text-xs text-purple-200">{ability.description}</p>
                    {ability.synergy_note && (
                      <p className="text-xs text-indigo-400 italic">💡 {ability.synergy_note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Weaknesses */}
            {adjustedStats.weaknesses?.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-red-300 text-sm">⚠️ Vulnerabilities:</h5>
                <ul className="ml-3 text-xs text-red-300 list-disc">
                  {adjustedStats.weaknesses.map((weakness, i) => (
                    <li key={i}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tactical Notes */}
            {adjustedStats.tactical_notes && (
              <div className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-300 mb-1">🎯 Tactical Approach:</p>
                <p className="text-xs text-slate-400">{adjustedStats.tactical_notes}</p>
              </div>
            )}

            {/* Adjustment Reason */}
            {adjustedStats.adjustments_reason && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-300 mb-1">✓ Why These Adjustments:</p>
                <p className="text-xs text-green-200">{adjustedStats.adjustments_reason}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}