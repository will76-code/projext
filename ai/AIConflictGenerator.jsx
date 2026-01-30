import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AIConflictGenerator({ worldId, events = [], relationships = [], characters = [] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState(null);

  const generateConflicts = async () => {
    if (events.length === 0) {
      toast.error("Add timeline events first");
      return;
    }

    setLoading(true);
    try {
      const prompt = `You are a creative game master analyzing world dynamics to suggest dramatic conflicts.

Current Timeline Events:
${events.slice(-5).map(e => `- [${e.year || 'TBD'}] ${e.title}: ${e.description}`).join('\n')}

Character Relationships:
${relationships.slice(0, 5).map(r => `- ${r.faction_a} ↔ ${r.faction_b}: ${r.relationship_type} (tension: ${r.tension_level})`).join('\n')}

Active Characters: ${characters.length > 0 ? characters.slice(0, 3).map(c => c.name).join(', ') : 'None defined'}

Generate 4 potential conflicts that naturally escalate from current events. For each, suggest:
1. Conflict Hook - how it emerges from current state
2. Escalation Path - how tension builds
3. Climax Point - the dramatic peak
4. Plot Twist - unexpected turn

Format as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  hook: { type: "string" },
                  escalation: { type: "string" },
                  climax: { type: "string" },
                  twist: { type: "string" },
                  severity: { type: "string" }
                }
              }
            }
          }
        }
      });

      setConflicts(result.conflicts);
    } catch (error) {
      toast.error("Failed to generate conflicts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    minor: "bg-yellow-900/50 text-yellow-300",
    moderate: "bg-orange-900/50 text-orange-300",
    major: "bg-red-900/50 text-red-300",
    catastrophic: "bg-red-800 text-red-100"
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-red-600 hover:bg-red-700">
          <AlertCircle className="w-4 h-4 mr-2" />
          Generate Conflicts
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Conflict Generator</DialogTitle>
        </DialogHeader>

        {!conflicts ? (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              Analyzes timeline events, relationships, and characters to suggest dramatic conflicts and plot twists.
            </p>
            <Button
              onClick={generateConflicts}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing World State...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Conflicts
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {conflicts.map((conflict, idx) => (
              <Card key={idx} className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base text-red-300">{conflict.title}</CardTitle>
                    <Badge className={severityColors[conflict.severity] || "bg-slate-600"}>
                      {conflict.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-300">Hook:</p>
                    <p className="text-slate-400">{conflict.hook}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Escalation:
                    </p>
                    <p className="text-slate-400">{conflict.escalation}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300">Climax:</p>
                    <p className="text-slate-400">{conflict.climax}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300">Plot Twist:</p>
                    <p className="text-slate-400">{conflict.twist}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              onClick={() => setConflicts(null)}
              variant="outline"
              className="w-full"
            >
              Generate New Conflicts
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}