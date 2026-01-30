import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AILoreGenerator({ worldId, worldName, onLoreGenerated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState("character");
  const [parameters, setParameters] = useState("");
  const [generatedLore, setGeneratedLore] = useState(null);

  const loreTypes = [
    { value: "character", label: "Character Backstory" },
    { value: "location", label: "Location History" },
    { value: "faction", label: "Faction Origins" },
    { value: "historical_event", label: "Historical Event" },
    { value: "magic_lore", label: "Magic System Entry" }
  ];

  const generateLore = async () => {
    if (!parameters.trim()) {
      toast.error("Enter parameters for lore generation");
      return;
    }

    setGenerating(true);
    try {
      const prompt = `Generate a detailed lore entry for a ${selectedType} in the world of "${worldName}". 
      
Parameters: ${parameters}

Create content with:
- Main narrative/description
- Plot hooks (3-4 potential story angles)
- Character motivations (if applicable)
- Connections to world events
- Potential conflicts

Return as JSON with fields: "title", "content", "plot_hooks" (array), "motivations" (array), "conflicts" (array).`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            plot_hooks: { 
              type: "array",
              items: { type: "string" }
            },
            motivations: { 
              type: "array",
              items: { type: "string" }
            },
            conflicts: { 
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setGeneratedLore(response);
      toast.success("Lore generated successfully!");
    } catch (error) {
      toast.error("Failed to generate lore");
    }
    setGenerating(false);
  };

  const saveLore = async () => {
    if (!generatedLore) return;

    try {
      const content = `
<h2>${generatedLore.title}</h2>
<p>${generatedLore.content}</p>

<h3>Plot Hooks</h3>
<ul>
${generatedLore.plot_hooks.map(hook => `<li>${hook}</li>`).join("")}
</ul>

<h3>Character Motivations</h3>
<ul>
${generatedLore.motivations.map(m => `<li>${m}</li>`).join("")}
</ul>

<h3>Potential Conflicts</h3>
<ul>
${generatedLore.conflicts.map(c => `<li>${c}</li>`).join("")}
</ul>
      `;

      await base44.entities.LoreEntry.create({
        world_id: worldId,
        title: generatedLore.title,
        content,
        category: selectedType,
        version: 1
      });

      toast.success("Lore entry saved!");
      setGeneratedLore(null);
      setParameters("");
      setIsOpen(false);
      if (onLoreGenerated) onLoreGenerated();
    } catch (error) {
      toast.error("Failed to save lore entry");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-purple-600 hover:bg-purple-700 mb-4">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Generate Lore
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-purple-300">Generate Lore with AI</DialogTitle>
        </DialogHeader>

        {!generatedLore ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 font-semibold">Lore Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full mt-2 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-300"
              >
                {loreTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400 font-semibold">Parameters</label>
              <textarea
                value={parameters}
                onChange={(e) => setParameters(e.target.value)}
                placeholder={`e.g., "A half-elf ranger with mysterious origins and a vendetta against bandits"...`}
                className="w-full mt-2 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-300 h-24 resize-none"
              />
            </div>

            <Button
              onClick={generateLore}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {generating ? "Generating..." : "Generate Lore"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
              <div className="flex items-center gap-2 text-green-300 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Lore Generated!
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200">{generatedLore.title}</h3>
              <p className="text-sm text-slate-400 mt-2">{generatedLore.content}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-amber-300">Plot Hooks:</h4>
              <ul className="text-xs text-slate-400 mt-1 space-y-1">
                {generatedLore.plot_hooks.map((hook, i) => (
                  <li key={i}>• {hook}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => { setGeneratedLore(null); setParameters(""); }}
                variant="outline"
                className="flex-1"
              >
                Generate Again
              </Button>
              <Button
                onClick={saveLore}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Save Entry
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}