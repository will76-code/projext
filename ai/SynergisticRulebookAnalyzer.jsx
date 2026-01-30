import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function SynergisticRulebookAnalyzer({ rulebooks = [] }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [synergies, setSynergies] = useState(null);
  const [selectedRulebooks, setSelectedRulebooks] = useState([]);

  const extractedRulebooks = rulebooks.filter(r => r.content_extracted);

  const [actionMode, setActionMode] = React.useState(null);

  const analyzeSynergies = async (mode) => {
    if (selectedRulebooks.length < 2) {
      toast.error("Select at least 2 rulebooks");
      return;
    }

    setAnalyzing(true);
    setActionMode(mode);
    try {
      const rulebookData = selectedRulebooks.map(rb => ({
        title: rb.title,
        system: rb.game_system,
        mechanics: rb.game_mechanics,
        options: rb.character_options
      }));

      const prompts = {
        analyze: `Analyze these rulebooks and identify interesting synergistic combinations. Focus on:
- How mechanics from different systems complement each other
- Potential hybrid gameplay styles
- Cross-system character builds
Return JSON: {"synergies": [...], "hybrid_gameplay": "..."}`,
        start: `Based on these rulebooks, generate NEW creative game elements that blend multiple systems:
- Suggest 3 new hybrid spells/abilities combining different systems
- Suggest 2 new hybrid magic items
- Suggest 2 new hybrid character archetypes
Return JSON: {"new_spells": [...], "new_items": [...], "new_archetypes": [...]}`
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompts[mode]}

Rulebooks: ${JSON.stringify(rulebookData)}`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            synergies: { type: "array" },
            hybrid_gameplay: { type: "string" }
          }
        }
      });

      setSynergies(response);
      toast.success("Synergies analyzed!");
    } catch (error) {
      toast.error(`Analysis failed: ${error.message}`);
    }
    setAnalyzing(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Rulebook Synergy Analyzer
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Select 2+ rulebooks → Click "Analyze Synergies" to find combinations or "Start Synergies" to generate new hybrid content</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-slate-400 mb-3">Select rulebooks to analyze combinations:</p>
          <div className="grid grid-cols-2 gap-2">
            {extractedRulebooks.map(rb => (
              <button
                key={rb.id}
                onClick={() => setSelectedRulebooks(
                  selectedRulebooks.includes(rb.id)
                    ? selectedRulebooks.filter(id => id !== rb.id)
                    : [...selectedRulebooks, rb.id]
                )}
                className={`p-2 rounded text-sm transition-all ${
                  selectedRulebooks.includes(rb.id)
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {rb.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => analyzeSynergies("analyze")}
            disabled={analyzing || selectedRulebooks.length < 2}
            variant="default"
            className="flex-1 bg-slate-700 hover:bg-slate-600"
          >
            {analyzing && actionMode === "analyze" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Analyze Synergies
          </Button>
          <Button
            onClick={() => analyzeSynergies("start")}
            disabled={analyzing || selectedRulebooks.length < 2}
            variant="outline"
            className="flex-1"
          >
            {analyzing && actionMode === "start" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Start Synergies
          </Button>
        </div>

        {synergies && (
          <div className="space-y-4 bg-slate-700/30 rounded p-4">
            <p className="text-sm font-semibold text-cyan-300">Hybrid Gameplay:</p>
            <p className="text-xs text-slate-300">{synergies.hybrid_gameplay}</p>

            {synergies.synergies?.map((syn, i) => (
              <div key={i} className="bg-slate-800 rounded p-3 space-y-2">
                <h4 className="font-semibold text-purple-300">{syn.title}</h4>
                <p className="text-xs text-slate-300">{syn.description}</p>
                
                {syn.new_mechanics?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-orange-300">New Mechanics:</p>
                    <div className="flex flex-wrap gap-1">
                      {syn.new_mechanics.map((m, j) => (
                        <Badge key={j} variant="outline" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {syn.homebrew_items?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-300">Homebrew Items:</p>
                    {syn.homebrew_items.map((item, j) => (
                      <div key={j} className="text-xs text-slate-300 mt-1">
                        <span className="text-green-400">{item.name}:</span> {item.effect}
                      </div>
                    ))}
                  </div>
                )}

                {syn.character_builds?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-cyan-300">Hybrid Builds:</p>
                    {syn.character_builds.map((build, j) => (
                      <div key={j} className="text-xs text-slate-300 mt-1">
                        <span className="text-cyan-400">{build.build}:</span> {build.combination}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}