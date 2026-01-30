import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe } from "lucide-react";
import { toast } from "sonner";

export default function WorldSimulationModule({ world, worldState, factions = [] }) {
  const [simulating, setSimulating] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [monthsAhead, setMonthsAhead] = useState(12);

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Simulate world evolution over ${monthsAhead} months. Return JSON:
{
  "timeline": [
    {
      "month": 1,
      "events": ["event 1", "event 2"],
      "faction_changes": {"faction": "change"},
      "consequences": ["consequence 1"]
    }
  ],
  "political_shifts": "how power balance changes",
  "economic_impact": "resource and trade changes",
  "environmental_changes": "natural/environmental shifts",
  "generated_lore": [
    {
      "title": "lore entry title",
      "category": "history|event|character",
      "content": "detailed lore"
    }
  ],
  "future_scenarios": [
    {
      "scenario": "potential outcome",
      "probability": "high|medium|low",
      "player_influence": "how players can prevent/cause this"
    }
  ]
}

World: ${world?.name}
Current State: ${JSON.stringify(worldState || {})}
Factions: ${factions.map(f => f.name).join(", ")}`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            timeline: { type: "array" },
            political_shifts: { type: "string" },
            economic_impact: { type: "string" },
            environmental_changes: { type: "string" },
            generated_lore: { type: "array" },
            future_scenarios: { type: "array" }
          }
        }
      });

      setSimulation(response);
      toast.success("Simulation complete!");
    } catch (error) {
      toast.error(`Simulation failed: ${error.message}`);
    }
    setSimulating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          World Simulation Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-slate-400">Simulate ahead:</label>
          <div className="flex gap-2 mt-2">
            {[6, 12, 24, 36].map(months => (
              <Button
                key={months}
                variant={monthsAhead === months ? "default" : "outline"}
                size="sm"
                onClick={() => setMonthsAhead(months)}
              >
                {months}m
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={runSimulation}
          disabled={simulating}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600"
        >
          {simulating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Run Simulation
        </Button>

        {simulation && (
          <div className="space-y-4 bg-slate-700/30 rounded p-4 max-h-96 overflow-y-auto">
            <div>
              <h4 className="font-semibold text-cyan-300">Political Shifts</h4>
              <p className="text-xs text-slate-300 mt-1">{simulation.political_shifts}</p>
            </div>

            <div>
              <h4 className="font-semibold text-cyan-300">Economic Impact</h4>
              <p className="text-xs text-slate-300 mt-1">{simulation.economic_impact}</p>
            </div>

            <div>
              <h4 className="font-semibold text-cyan-300">Environmental Changes</h4>
              <p className="text-xs text-slate-300 mt-1">{simulation.environmental_changes}</p>
            </div>

            <div>
              <h4 className="font-semibold text-green-300 mb-2">Timeline Events</h4>
              {simulation.timeline?.slice(0, 4).map((month, i) => (
                <div key={i} className="bg-slate-800 rounded p-2 mb-2">
                  <p className="text-sm font-semibold text-green-400">Month {month.month}</p>
                  {month.events?.map((e, j) => (
                    <p key={j} className="text-xs text-slate-300">→ {e}</p>
                  ))}
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-semibold text-orange-300 mb-2">Generated Lore</h4>
              {simulation.generated_lore?.map((lore, i) => (
                <div key={i} className="text-xs text-slate-300 mb-1">
                  <span className="text-orange-400">{lore.title}</span> ({lore.category})
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-semibold text-purple-300 mb-2">Future Scenarios</h4>
              {simulation.future_scenarios?.map((scenario, i) => (
                <div key={i} className="bg-slate-800 rounded p-2 mb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-purple-300">{scenario.scenario}</p>
                    <Badge 
                      className={scenario.probability === 'high' ? 'bg-red-600' : scenario.probability === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'}
                    >
                      {scenario.probability}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{scenario.player_influence}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}