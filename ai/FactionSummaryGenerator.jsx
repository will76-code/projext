import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function FactionSummaryGenerator({ worldId, relationships = [] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [factionName, setFactionName] = useState("");

  const generateSummary = async () => {
    if (!factionName.trim()) {
      toast.error("Enter faction name");
      return;
    }

    setLoading(true);
    try {
      const relatedRelationships = relationships
        .filter(r => r.faction_a === factionName || r.faction_b === factionName)
        .map(r => `${r.faction_a} ↔ ${r.faction_b}: ${r.relationship_type}`)
        .join("\n");

      const prompt = `Create a comprehensive faction profile for "${factionName}".

Related Faction Dynamics:
${relatedRelationships || "No relationship data"}

Generate a detailed faction summary including:
- Faction Name & Alignment
- Core Goals & Ideology
- Leadership Structure
- Resources & Territory
- Notable Members/Assets
- Relationships with Other Factions
- Hidden Agendas
- Threats & Opportunities
- How to Interact With Them`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            goals: { type: "array", items: { type: "string" } },
            structure: { type: "string" },
            resources: { type: "string" },
            allies: { type: "array", items: { type: "string" } },
            enemies: { type: "array", items: { type: "string" } },
            hiddenAgenda: { type: "string" }
          }
        }
      });

      setSummary(result);
    } catch (error) {
      toast.error("Failed to generate summary");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Faction Summary Generator</DialogTitle>
        </DialogHeader>

        {!summary ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Faction name..."
              value={factionName}
              onChange={(e) => setFactionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateSummary()}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-slate-300 text-sm"
            />
            <Button
              onClick={generateSummary}
              disabled={loading || !factionName.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-semibold text-orange-300">Goals</h3>
              <ul className="text-slate-300 space-y-1 mt-1">
                {summary.goals?.map((g, i) => <li key={i}>• {g}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-orange-300">Structure</h3>
              <p className="text-slate-300 mt-1">{summary.structure}</p>
            </div>
            <div>
              <h3 className="font-semibold text-orange-300">Allies</h3>
              <p className="text-slate-300">{summary.allies?.join(", ") || "None"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-orange-300">Enemies</h3>
              <p className="text-slate-300">{summary.enemies?.join(", ") || "None"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-orange-300">Hidden Agenda</h3>
              <p className="text-slate-300">{summary.hiddenAgenda}</p>
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
                toast.success("Copied to clipboard");
              }}
              variant="outline"
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Summary
            </Button>
            <Button onClick={() => setSummary(null)} variant="outline" className="w-full">
              Generate New
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}