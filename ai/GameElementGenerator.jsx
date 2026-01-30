import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function GameElementGenerator({ rulebooks = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [elementType, setElementType] = useState("magic_items");
  const [generated, setGenerated] = useState([]);

  const generateElements = async () => {
    if (!rulebooks.length) {
      toast.error("No rulebooks available");
      return;
    }

    setIsGenerating(true);
    try {
      const rulebookContext = rulebooks
        .filter(r => r.content_extracted)
        .slice(0, 3)
        .map(r => `${r.title}: ${JSON.stringify(r.game_mechanics || {}).substring(0, 300)}`)
        .join("\n");

      const prompts = {
        magic_items: `Based on these game rulebooks:\n${rulebookContext}\n\nGenerate 5 unique magical items. Return ONLY valid JSON:\n{"items": [{"name": "item name", "type": "weapon|armor|accessory|consumable", "rarity": "common|uncommon|rare|legendary", "effect": "mechanical effect", "flavor": "lore text"}]}`,
        spells: `Based on these game rulebooks:\n${rulebookContext}\n\nGenerate 5 unique spells or abilities. Return ONLY valid JSON:\n{"spells": [{"name": "spell name", "level": "number 1-9", "school": "magic school", "effect": "what it does", "components": "casting components"}]}`,
        archetypes: `Based on these game rulebooks:\n${rulebookContext}\n\nGenerate 5 character archetypes. Return ONLY valid JSON:\n{"archetypes": [{"name": "archetype name", "description": "concept", "strengths": ["strength 1", "strength 2"], "weaknesses": ["weakness 1", "weakness 2"]}]}`,
        encounters: `Based on these game rulebooks:\n${rulebookContext}\n\nGenerate 5 encounter ideas. Return ONLY valid JSON:\n{"encounters": [{"name": "encounter name", "cr": "challenge rating", "description": "setup", "enemies": ["enemy 1", "enemy 2"]}]}`
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[elementType] || prompts.magic_items,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            items: { type: "array" },
            spells: { type: "array" },
            archetypes: { type: "array" },
            encounters: { type: "array" }
          }
        }
      });

      const items = result.items || result.spells || result.archetypes || result.encounters || [];
      setGenerated(items);
      toast.success(`Generated ${items.length} ${elementType}!`);
    } catch (error) {
      toast.error("Failed to generate elements");
      console.error(error);
    }
    setIsGenerating(false);
  };

  const getItemKey = (item) => {
    if (item.name) return item.name;
    return Object.keys(item)[0];
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Game Elements
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-300">Generate Game Elements from Rulebooks</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={elementType} onValueChange={setElementType}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="magic_items">Magic Items</SelectItem>
              <SelectItem value="spells">Spells & Abilities</SelectItem>
              <SelectItem value="archetypes">Character Archetypes</SelectItem>
              <SelectItem value="encounters">Encounter Ideas</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={generateElements}
            disabled={isGenerating || !rulebooks.length}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isGenerating ? "Generating..." : "Generate"}
          </Button>

          <div className="space-y-2">
            {generated.map((item, idx) => (
              <Card key={idx} className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-200">{getItemKey(item)}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-400 space-y-1">
                  {Object.entries(item).map(([key, value]) => {
                    if (key === 'name') return null;
                    if (Array.isArray(value)) {
                      return (
                        <div key={key}>
                          <span className="text-slate-300 capitalize">{key}:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {value.map((v, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p key={key}>
                        <span className="text-slate-300 capitalize">{key}:</span> {String(value)}
                      </p>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}