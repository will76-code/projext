import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, GitCompare, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AIRulebookComparison({ rulebooks }) {
  const [comparing, setComparing] = useState(false);
  const [rulebook1Id, setRulebook1Id] = useState("");
  const [rulebook2Id, setRulebook2Id] = useState("");
  const [comparisonResult, setComparisonResult] = useState(null);

  const extractedRulebooks = rulebooks.filter(r => r.content_extracted);

  const compareRulebooks = async () => {
    if (!rulebook1Id || !rulebook2Id) {
      toast.error("Please select two rulebooks to compare");
      return;
    }

    if (rulebook1Id === rulebook2Id) {
      toast.error("Please select two different rulebooks");
      return;
    }

    setComparing(true);
    setComparisonResult(null);

    try {
      const rb1 = extractedRulebooks.find(r => r.id === rulebook1Id);
      const rb2 = extractedRulebooks.find(r => r.id === rulebook2Id);

      const prompt = `You are an expert TTRPG analyst. Compare these two rulebooks in detail:

RULEBOOK 1: ${rb1.title} (${rb1.game_system})
- Core Rules: ${rb1.game_mechanics?.core_rules || "N/A"}
- Dice System: ${rb1.game_mechanics?.dice_system || "N/A"}
- Combat: ${rb1.detailed_mechanics?.combat_rules?.attack_resolution || "N/A"}
- Magic: ${rb1.detailed_mechanics?.magic_system?.casting_mechanic || "N/A"}
- Races: ${rb1.character_options?.races?.slice(0, 5).join(", ") || "N/A"}
- Classes: ${rb1.character_options?.classes?.slice(0, 5).join(", ") || "N/A"}

RULEBOOK 2: ${rb2.title} (${rb2.game_system})
- Core Rules: ${rb2.game_mechanics?.core_rules || "N/A"}
- Dice System: ${rb2.game_mechanics?.dice_system || "N/A"}
- Combat: ${rb2.detailed_mechanics?.combat_rules?.attack_resolution || "N/A"}
- Magic: ${rb2.detailed_mechanics?.magic_system?.casting_mechanic || "N/A"}
- Races: ${rb2.character_options?.races?.slice(0, 5).join(", ") || "N/A"}
- Classes: ${rb2.character_options?.classes?.slice(0, 5).join(", ") || "N/A"}

Analyze deeply and return JSON:
{
  "core_similarities": ["Key similarities in core mechanics"],
  "core_differences": ["Major differences in core systems"],
  "thematic_variations": ["Different narrative or flavor approaches"],
  "rulebook_interpretations": ["Different interpretations of similar concepts"],
  "power_scaling": "How power levels compare",
  "complexity_comparison": "Which is more complex and why",
  "cross_system_compatibility": ["Areas where content could be adapted between systems"],
  "recommended_hybrid_rules": ["Suggestions for combining both rulesets"],
  "best_for": {
    "rulebook1": "What this rulebook excels at",
    "rulebook2": "What this rulebook excels at"
  }
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            core_similarities: { type: "array" },
            core_differences: { type: "array" },
            thematic_variations: { type: "array" },
            rulebook_interpretations: { type: "array" },
            power_scaling: { type: "string" },
            complexity_comparison: { type: "string" },
            cross_system_compatibility: { type: "array" },
            recommended_hybrid_rules: { type: "array" },
            best_for: { type: "object" }
          }
        }
      });

      setComparisonResult({
        ...result,
        rulebook1: rb1,
        rulebook2: rb2
      });

      toast.success("Comparison complete!");
    } catch (error) {
      toast.error("Failed to compare rulebooks");
      console.error(error);
    }

    setComparing(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <GitCompare className="w-5 h-5" />
          AI Rulebook Comparison Tool
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          Deep AI analysis identifies subtle differences, thematic variations, and cross-system compatibility
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Rulebook 1</label>
            <Select value={rulebook1Id} onValueChange={setRulebook1Id}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select first rulebook" />
              </SelectTrigger>
              <SelectContent>
                {extractedRulebooks.map(rb => (
                  <SelectItem key={rb.id} value={rb.id}>
                    {rb.title} ({rb.game_system})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Rulebook 2</label>
            <Select value={rulebook2Id} onValueChange={setRulebook2Id}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select second rulebook" />
              </SelectTrigger>
              <SelectContent>
                {extractedRulebooks.map(rb => (
                  <SelectItem key={rb.id} value={rb.id}>
                    {rb.title} ({rb.game_system})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={compareRulebooks}
          disabled={comparing || !rulebook1Id || !rulebook2Id}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {comparing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <GitCompare className="w-4 h-4 mr-2" />
              Compare Rulebooks
            </>
          )}
        </Button>

        {comparisonResult && (
          <div className="space-y-4 mt-6">
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-4">
              <h3 className="text-sm font-semibold text-indigo-300 mb-2">Comparing:</h3>
              <div className="flex justify-between text-xs">
                <span className="text-white">{comparisonResult.rulebook1.title}</span>
                <span className="text-slate-400">vs</span>
                <span className="text-white">{comparisonResult.rulebook2.title}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                <h4 className="text-xs font-semibold text-green-300 mb-2">✓ Core Similarities</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {comparisonResult.core_similarities?.map((sim, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-green-400">•</span>
                      <span>{sim}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
                <h4 className="text-xs font-semibold text-red-300 mb-2">⚠ Core Differences</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {comparisonResult.core_differences?.map((diff, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-red-400">•</span>
                      <span>{diff}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3">
                <h4 className="text-xs font-semibold text-purple-300 mb-2">🎭 Thematic Variations</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {comparisonResult.thematic_variations?.map((theme, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
                <h4 className="text-xs font-semibold text-yellow-300 mb-2">📖 Rulebook Interpretations</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {comparisonResult.rulebook_interpretations?.map((interp, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-yellow-400">•</span>
                      <span>{interp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/30 rounded p-3">
                  <h4 className="text-xs font-semibold text-slate-300 mb-1">Power Scaling</h4>
                  <p className="text-xs text-slate-400">{comparisonResult.power_scaling}</p>
                </div>
                <div className="bg-slate-700/30 rounded p-3">
                  <h4 className="text-xs font-semibold text-slate-300 mb-1">Complexity</h4>
                  <p className="text-xs text-slate-400">{comparisonResult.complexity_comparison}</p>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                <h4 className="text-xs font-semibold text-blue-300 mb-2">🔄 Cross-System Compatibility</h4>
                <div className="flex flex-wrap gap-1">
                  {comparisonResult.cross_system_compatibility?.map((comp, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{comp}</Badge>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded p-3">
                <h4 className="text-xs font-semibold text-emerald-300 mb-2">💡 Hybrid Rule Suggestions</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {comparisonResult.recommended_hybrid_rules?.map((rule, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-3">
                  <h4 className="text-xs font-semibold text-indigo-300 mb-1">
                    {comparisonResult.rulebook1.title} Best For:
                  </h4>
                  <p className="text-xs text-slate-400">{comparisonResult.best_for?.rulebook1}</p>
                </div>
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-3">
                  <h4 className="text-xs font-semibold text-indigo-300 mb-1">
                    {comparisonResult.rulebook2.title} Best For:
                  </h4>
                  <p className="text-xs text-slate-400">{comparisonResult.best_for?.rulebook2}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}