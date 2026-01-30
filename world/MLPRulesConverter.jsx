import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";

export default function MLPRulesConverter({ worldId }) {
  const [sourceEdition, setSourceEdition] = useState("mlp-foe");
  const [targetEdition, setTargetEdition] = useState("essence20");
  const [conversion, setConversion] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  const editions = {
    "mlp-foe": { name: "My Little Pony: Friends Forever", system: "Custom D&D-based" },
    "mlp-tails": { name: "Tails of Equestria", system: "Simplified D&D" },
    "essence20": { name: "Essence20", system: "Modern d20 System" }
  };

  const convertRules = async () => {
    setIsConverting(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Convert ${editions[sourceEdition].name} rules to ${editions[targetEdition].name} (${editions[targetEdition].system}).

Create conversion guidelines for:

1. Attribute/Stat Conversion:
   - Map source edition attributes to target attributes
   - Conversion formulas for ability scores
   - Skill conversions

2. Combat System Changes:
   - Attack resolution differences
   - Damage calculations
   - AC/defense equivalents

3. Magic/Abilities:
   - Spell to ability conversions
   - New abilities available in target system
   - Balance adjustments

4. Character Creation:
   - Race options equivalents
   - Class/Role conversions
   - Experience/progression scaling

5. Equipment & Items:
   - Item conversions and stat adjustments
   - New item options

Format as JSON: { statConversion, combatChanges, magicConversion, characterCreation, equipment, conversionTable (with before/after examples) }`,
        response_json_schema: {
          type: "object",
          properties: {
            statConversion: { type: "string" },
            combatChanges: { type: "string" },
            magicConversion: { type: "string" },
            characterCreation: { type: "string" },
            equipment: { type: "string" },
            conversionTable: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sourceRule: { type: "string" },
                  targetEquivalent: { type: "string" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });
      setConversion(result);
      toast.success('Rules conversion generated!');
    } catch (error) {
      toast.error('Failed to generate conversion');
      console.error(error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          MLP Rules Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!conversion ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">From Edition</label>
                <select
                  value={sourceEdition}
                  onChange={(e) => setSourceEdition(e.target.value)}
                  className="w-full bg-slate-700/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-slate-200"
                >
                  {Object.entries(editions).map(([key, val]) => (
                    <option key={key} value={key}>{val.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">{editions[sourceEdition].system}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">To Edition</label>
                <select
                  value={targetEdition}
                  onChange={(e) => setTargetEdition(e.target.value)}
                  className="w-full bg-slate-700/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-slate-200"
                >
                  {Object.entries(editions).map(([key, val]) => (
                    <option key={key} value={key}>{val.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">{editions[targetEdition].system}</p>
              </div>
            </div>

            <Button
              onClick={convertRules}
              disabled={isConverting || sourceEdition === targetEdition}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isConverting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
              Generate Conversion Guide
            </Button>
          </>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3">
              <p className="text-xs text-slate-400">Converting from</p>
              <p className="font-semibold text-slate-200">{editions[sourceEdition].name}</p>
              <p className="text-xs text-slate-500">to</p>
              <p className="font-semibold text-slate-200">{editions[targetEdition].name}</p>
            </div>

            {/* Stat Conversion */}
            <div className="border-t border-slate-600 pt-3">
              <h6 className="font-semibold text-slate-300 mb-2">📊 Attribute Conversion</h6>
              <p className="text-sm text-slate-300 bg-slate-700/30 rounded p-2">{conversion.statConversion}</p>
            </div>

            {/* Combat Changes */}
            <div>
              <h6 className="font-semibold text-slate-300 mb-2">⚔️ Combat Changes</h6>
              <p className="text-sm text-slate-300 bg-slate-700/30 rounded p-2">{conversion.combatChanges}</p>
            </div>

            {/* Magic Conversion */}
            <div>
              <h6 className="font-semibold text-slate-300 mb-2">✨ Magic & Abilities</h6>
              <p className="text-sm text-slate-300 bg-slate-700/30 rounded p-2">{conversion.magicConversion}</p>
            </div>

            {/* Character Creation */}
            <div>
              <h6 className="font-semibold text-slate-300 mb-2">👤 Character Creation</h6>
              <p className="text-sm text-slate-300 bg-slate-700/30 rounded p-2">{conversion.characterCreation}</p>
            </div>

            {/* Conversion Table */}
            {conversion.conversionTable?.length > 0 && (
              <div>
                <h6 className="font-semibold text-slate-300 mb-2">📋 Quick Reference Table</h6>
                <div className="space-y-2">
                  {conversion.conversionTable.map((row, i) => (
                    <div key={i} className="bg-slate-700/30 rounded p-2 border border-slate-600">
                      <div className="flex gap-2 text-xs mb-1">
                        <Badge className="bg-slate-700">Source</Badge>
                        <Badge className="bg-purple-900">Target</Badge>
                      </div>
                      <p className="text-sm text-slate-300"><strong>{row.sourceRule}</strong></p>
                      <p className="text-sm text-slate-400">→ {row.targetEquivalent}</p>
                      {row.notes && <p className="text-xs text-slate-500 mt-1">📝 {row.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => setConversion(null)}
              variant="outline"
              className="w-full border-purple-500/50"
            >
              Convert Different Editions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}