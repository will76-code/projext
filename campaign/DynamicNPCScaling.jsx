import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function DynamicNPCScaling({ campaign, playerCharacters = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [npcName, setNpcName] = useState("");
  const [scaledNPC, setScaledNPC] = useState(null);

  const scaleNPC = async () => {
    if (!npcName.trim()) {
      toast.error("Enter NPC name");
      return;
    }

    setIsGenerating(true);
    try {
      const avgLevel = playerCharacters.reduce((sum, c) => sum + (c.level || 1), 0) / (playerCharacters.length || 1);
      const partySize = playerCharacters.length;

      const scaled = await base44.integrations.Core.InvokeLLM({
        prompt: `Scale NPC for balanced encounter:

NPC: ${npcName}
Party: ${partySize} characters, average level ${avgLevel.toFixed(1)}
Player Builds: ${JSON.stringify(playerCharacters.map(c => ({ class: c.class_role, attributes: c.attributes })))}
Campaign Trend: ${campaign.story_summary?.slice(-200) || "Early campaign"}

Generate appropriately scaled NPC stats:
- Challenge Rating suitable for party
- Abilities that counter party strengths
- Weaknesses that reward strategy
- Stats balanced for encounter difficulty

Return complete stat block.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            challenge_rating: { type: "string" },
            hit_points: { type: "number" },
            armor_class: { type: "number" },
            attributes: { type: "object" },
            abilities: { type: "array", items: { type: "string" } },
            vulnerabilities: { type: "array", items: { type: "string" } },
            tactics: { type: "string" },
            scaling_notes: { type: "string" }
          }
        }
      });

      setScaledNPC(scaled);
      toast.success("NPC scaled!");
    } catch (error) {
      toast.error("Failed to scale NPC");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Dynamic NPC Scaling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={npcName}
          onChange={(e) => setNpcName(e.target.value)}
          placeholder="NPC name or type (e.g., 'Dragon', 'Villain')"
          className="bg-slate-700/50 border-purple-500/30 text-white"
        />

        <Button
          onClick={scaleNPC}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
          Scale to Party Level
        </Button>

        {scaledNPC && (
          <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <h5 className="font-semibold text-green-300 text-lg">{scaledNPC.name}</h5>
              <span className="text-xs bg-green-600 px-2 py-1 rounded">CR {scaledNPC.challenge_rating}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-800/50 rounded p-2">
                <p className="text-green-400 text-xs">HP</p>
                <p className="text-white font-semibold">{scaledNPC.hit_points}</p>
              </div>
              <div className="bg-slate-800/50 rounded p-2">
                <p className="text-green-400 text-xs">AC</p>
                <p className="text-white font-semibold">{scaledNPC.armor_class}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-green-400 mb-1">Attributes:</p>
              <pre className="text-xs text-white bg-slate-800 rounded p-2">
                {JSON.stringify(scaledNPC.attributes, null, 2)}
              </pre>
            </div>

            <div>
              <p className="text-xs text-green-400 mb-1">Abilities:</p>
              <ul className="ml-3 text-sm text-white">
                {scaledNPC.abilities?.map((ability, i) => (
                  <li key={i}>• {ability}</li>
                ))}
              </ul>
            </div>

            {scaledNPC.vulnerabilities?.length > 0 && (
              <div>
                <p className="text-xs text-red-400 mb-1">Vulnerabilities:</p>
                <ul className="ml-3 text-sm text-red-300">
                  {scaledNPC.vulnerabilities.map((v, i) => (
                    <li key={i}>• {v}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
              <p className="text-xs text-yellow-400 mb-1">Tactics:</p>
              <p className="text-xs text-white">{scaledNPC.tactics}</p>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-2">
              <p className="text-xs text-purple-400 mb-1">Scaling Notes:</p>
              <p className="text-xs text-white">{scaledNPC.scaling_notes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}