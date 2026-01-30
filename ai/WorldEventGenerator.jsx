import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Globe, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function WorldEventGenerator({ world }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [worldEvent, setWorldEvent] = useState(null);

  const generateWorldEvent = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a WORLD-IMPACTING event for this setting that affects ALL campaigns:

World: ${world.name}
Genre: ${world.genre}
Description: ${world.description}

Create an event that:
- Fundamentally changes the world state
- Affects multiple regions/factions
- Creates ripple effects across all campaigns
- Forces player adaptation
- Has both immediate and long-term consequences

Return as JSON with title, description, global_effects, regional_impacts, timeline, and consequences.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            severity: { type: "string", enum: ["minor", "major", "catastrophic"] },
            description: { type: "string" },
            global_effects: { type: "array", items: { type: "string" } },
            regional_impacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            timeline: { type: "string" },
            consequences: {
              type: "object",
              properties: {
                immediate: { type: "array", items: { type: "string" } },
                long_term: { type: "array", items: { type: "string" } }
              }
            },
            player_opportunities: { type: "array", items: { type: "string" } }
          }
        }
      });

      setWorldEvent(response);
      toast.success("World event generated!");
    } catch (error) {
      toast.error("Failed to generate world event");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-red-500/30">
      <CardHeader>
        <CardTitle className="text-red-300 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          World-Impacting Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-red-300">
          Generate events that reshape the entire world and affect all campaigns
        </p>

        <Button
          onClick={generateWorldEvent}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
          Generate World Event
        </Button>

        {worldEvent && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-red-300 text-lg">{worldEvent.title}</h4>
              <Badge className={`${
                worldEvent.severity === 'catastrophic' ? 'bg-red-600' :
                worldEvent.severity === 'major' ? 'bg-orange-600' : 'bg-yellow-600'
              }`}>
                {worldEvent.severity}
              </Badge>
            </div>
            <p className="text-sm text-white mb-4">{worldEvent.description}</p>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-red-400 mb-1">Global Effects:</p>
                <ul className="space-y-1">
                  {worldEvent.global_effects?.map((effect, i) => (
                    <li key={i} className="text-xs text-white flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>{effect}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {worldEvent.regional_impacts?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-400 mb-1">Regional Impacts:</p>
                  <div className="space-y-2">
                    {worldEvent.regional_impacts.map((impact, i) => (
                      <div key={i} className="bg-slate-800/50 rounded p-2">
                        <p className="text-xs font-semibold text-orange-300">{impact.region}</p>
                        <p className="text-xs text-white">{impact.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-yellow-400 mb-1">Timeline:</p>
                <p className="text-xs text-white">{worldEvent.timeline}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-1">Immediate:</p>
                  <ul className="space-y-1">
                    {worldEvent.consequences?.immediate?.map((cons, i) => (
                      <li key={i} className="text-xs text-white">• {cons}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-400 mb-1">Long-term:</p>
                  <ul className="space-y-1">
                    {worldEvent.consequences?.long_term?.map((cons, i) => (
                      <li key={i} className="text-xs text-white">• {cons}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {worldEvent.player_opportunities?.length > 0 && (
                <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                  <p className="text-xs font-semibold text-green-400 mb-1">Player Opportunities:</p>
                  <ul className="space-y-1">
                    {worldEvent.player_opportunities.map((opp, i) => (
                      <li key={i} className="text-xs text-white">• {opp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}