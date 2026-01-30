import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function SynergisticUpgrades({ character, messages }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [upgrades, setUpgrades] = useState([]);

  const generateSynergies = async () => {
    setIsGenerating(true);
    try {
      const recentNarrative = messages.slice(-20).map(m => m.content).join('\n');
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this character's build and recent narrative to suggest SYNERGISTIC upgrades:

Character: ${character.name}
Class: ${character.class_role}
Attributes: ${JSON.stringify(character.attributes)}
Skills: ${JSON.stringify(character.skills)}
Special Traits: ${JSON.stringify(character.special_things)}
Recent Narrative: ${recentNarrative}

Suggest 5 synergistic upgrades that:
- Create powerful COMBOS with existing abilities
- Fit the narrative arc
- Open new tactical possibilities
- Have unexpected synergies

Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            synergies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  synergy_with: { type: "string" },
                  combo_potential: { type: "string" },
                  narrative_fit: { type: "string" }
                }
              }
            }
          }
        }
      });

      setUpgrades(response.synergies || []);
      toast.success("Synergistic upgrades found!");
    } catch (error) {
      toast.error("Failed to generate synergies");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Synergistic Build Upgrades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={generateSynergies}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Analyze Build Synergies
        </Button>

        {upgrades.map((upgrade, i) => (
          <div key={i} className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-4">
            <h5 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-pink-400" />
              {upgrade.name}
            </h5>
            <p className="text-sm text-white mb-2">{upgrade.description}</p>
            <div className="space-y-1 text-xs">
              <p><span className="text-pink-400 font-semibold">Synergizes with:</span> <span className="text-white">{upgrade.synergy_with}</span></p>
              <p><span className="text-purple-400 font-semibold">Combo:</span> <span className="text-white">{upgrade.combo_potential}</span></p>
              <p><span className="text-green-400 font-semibold">Narrative Fit:</span> <span className="text-white">{upgrade.narrative_fit}</span></p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}