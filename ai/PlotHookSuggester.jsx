import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PlotHookSuggester({ worldId, loreEntries = [], events = [] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hooks, setHooks] = useState(null);

  const generateHooks = async () => {
    setLoading(true);
    try {
      const loreContext = loreEntries
        .slice(0, 5)
        .map(l => l.title)
        .join(", ");

      const eventContext = events
        .slice(-3)
        .map(e => e.title)
        .join(", ");

      const prompt = `Based on this world's established elements, suggest 5 compelling plot hooks for adventures:

Established Lore: ${loreContext || "General fantasy world"}
Recent Events: ${eventContext || "None recorded"}

For each plot hook, provide:
- Title
- Hook Description (1-2 sentences)
- Setup (how to introduce it)
- Escalation (how it can expand)
- Rewards (what players can gain)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            hooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  setup: { type: "string" },
                  escalation: { type: "string" },
                  rewards: { type: "string" }
                }
              }
            }
          }
        }
      });

      setHooks(result.hooks);
    } catch (error) {
      toast.error("Failed to generate plot hooks");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          Plot Hooks
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Plot Hook Suggester</DialogTitle>
        </DialogHeader>

        {!hooks ? (
          <Button
            onClick={generateHooks}
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Plot Hooks
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            {hooks.map((hook, idx) => (
              <Card key={idx} className="bg-slate-700/30 border-slate-600">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <h3 className="font-semibold text-cyan-300">{hook.title}</h3>
                  <p className="text-slate-300">{hook.description}</p>
                  <div className="text-xs space-y-1 text-slate-400">
                    <p><strong>Setup:</strong> {hook.setup}</p>
                    <p><strong>Escalation:</strong> {hook.escalation}</p>
                    <p><strong>Rewards:</strong> {hook.rewards}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={() => setHooks(null)} variant="outline" className="w-full">
              Generate New Hooks
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}