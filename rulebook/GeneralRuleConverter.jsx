import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function GeneralRuleConverter({ worldId, gameSystem }) {
  const [sourceSystem, setSourceSystem] = useState("");
  const [targetSystem, setTargetSystem] = useState("");
  const [sourceRulebook, setSourceRulebook] = useState("");
  const [targetRulebook, setTargetRulebook] = useState("");
  const [conversion, setConversion] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  const gameSystems = [
    "D&D 5e",
    "D&D 3.5e",
    "Pathfinder 1e",
    "Pathfinder 2e",
    "Vampire the Masquerade 5e",
    "Vampire the Masquerade 20th Anniversary",
    "Mage the Ascension 5e",
    "Mage the Ascension 20th Anniversary",
    "Call of Cthulhu 7e",
    "World of Darkness",
    "Starfinder",
    "Cyberware Red"
  ];

  const convertRules = async () => {
    if (!sourceSystem || !targetSystem || !sourceRulebook) {
      toast.error("Select source and target systems");
      return;
    }

    setIsConverting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Convert game mechanics and rules from one system to another while maintaining game balance and intent.

Source System: ${sourceSystem}
Source Content: ${sourceRulebook}

Target System: ${targetSystem}
Target Rulebook Context: ${targetRulebook || "Standard rules"}

Provide a conversion guide that includes:
1. mechanicalMappings: How core mechanics translate (attributes, skills, combat, magic, etc.)
2. spellsConversion: Spell/ability conversion with adjusted values
3. balanceNotes: Any adjustments needed for game balance
4. lostMechanics: Features that don't translate well and alternatives
5. newOpportunities: Systems from target that enhance the source material
6. conversionSteps: Step-by-step process for converting characters or content

Format as valid JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            mechanicalMappings: { type: "object" },
            spellsConversion: { type: "array", items: { type: "object" } },
            balanceNotes: { type: "array", items: { type: "string" } },
            lostMechanics: { type: "array", items: { type: "object" } },
            newOpportunities: { type: "array", items: { type: "string" } },
            conversionSteps: { type: "array", items: { type: "string" } }
          }
        }
      });

      setConversion(result);
      toast.success("Rules conversion complete");
    } catch (error) {
      toast.error("Failed to convert rules");
      console.error(error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-amber-500/50 text-amber-400">
          <BookOpen className="w-4 h-4 mr-2" />
          Convert Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-300">Cross-System Rule Converter</DialogTitle>
          <DialogDescription className="text-slate-400">
            Convert rules, mechanics, and content between game systems
          </DialogDescription>
        </DialogHeader>

        {!conversion ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Source System</label>
                <select
                  value={sourceSystem}
                  onChange={(e) => setSourceSystem(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300"
                >
                  <option value="">Select system</option>
                  {gameSystems.map(sys => (
                    <option key={sys} value={sys}>{sys}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target System</label>
                <select
                  value={targetSystem}
                  onChange={(e) => setTargetSystem(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300"
                >
                  <option value="">Select system</option>
                  {gameSystems.map(sys => (
                    <option key={sys} value={sys}>{sys}</option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              placeholder="Describe the rule, ability, or mechanic to convert"
              value={sourceRulebook}
              onChange={(e) => setSourceRulebook(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 min-h-20"
            />

            <textarea
              placeholder="Target system context (optional)"
              value={targetRulebook}
              onChange={(e) => setTargetRulebook(e.target.value)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 min-h-20"
            />

            <Button
              onClick={convertRules}
              disabled={isConverting}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {isConverting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              Convert Rules
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mechanical Mappings */}
            <div>
              <h4 className="font-semibold text-amber-300 text-sm mb-2">Mechanical Mappings</h4>
              <div className="bg-slate-800/50 rounded p-2 text-xs text-slate-300 space-y-1">
                {Object.entries(conversion.mechanicalMappings || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-amber-400">{key}</span>
                    <span>→ {value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Steps */}
            {conversion.conversionSteps && (
              <div>
                <h4 className="font-semibold text-amber-300 text-sm mb-2">How to Convert</h4>
                <ol className="space-y-1 text-xs text-slate-300 list-decimal list-inside">
                  {conversion.conversionSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Balance Notes */}
            {conversion.balanceNotes?.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
                <h4 className="font-semibold text-yellow-300 text-xs mb-1">⚖️ Balance Notes</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {conversion.balanceNotes.map((note, i) => (
                    <li key={i}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={() => setConversion(null)}
              variant="outline"
              className="w-full border-slate-600"
            >
              Convert Another
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}