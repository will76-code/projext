import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function WorldStateSimulator({ worldId }) {
  const queryClient = useQueryClient();
  const [isSimulating, setIsSimulating] = useState(false);

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    }
  });

  const simulateMutation = useMutation({
    mutationFn: async () => {
      setIsSimulating(true);
      
      const world = await base44.entities.World.filter({ id: worldId });
      const campaigns = await base44.entities.Campaign.filter({ world_id: worldId });
      
      const simulationData = await base44.integrations.Core.InvokeLLM({
        prompt: `Simulate world state evolution for ${world[0]?.name}:

Current World State: ${JSON.stringify(worldEvolution?.world_state || {})}
Recent Campaign Outcomes: ${JSON.stringify(worldEvolution?.campaign_states?.slice(0, 5) || [])}
Emergent Lore: ${JSON.stringify(worldEvolution?.emergent_lore?.slice(0, 5) || [])}
Active Campaigns: ${campaigns.length}

Generate realistic world state updates based on campaign outcomes:
1. Political changes (power shifts, new alliances, conflicts)
2. Economic shifts (trade route changes, resource scarcity/abundance)
3. Environmental challenges (natural disasters, climate changes)
4. Social movements (uprisings, cultural shifts)
5. Military developments (wars, peace treaties, territorial changes)

Create 3-5 dynamic events that feel like natural consequences of player actions.`,
        response_json_schema: {
          type: "object",
          properties: {
            world_state_update: {
              type: "object",
              properties: {
                political_landscape: { type: "string" },
                power_shifts: { type: "array", items: { type: "string" } },
                economic_conditions: { type: "string" },
                environmental_challenges: { type: "array", items: { type: "string" } }
              }
            },
            simulated_events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event_type: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impacts: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setIsSimulating(false);

      // Update WorldEvolution
      const eventsWithDates = simulationData.simulated_events.map(e => ({
        ...e,
        triggered_date: new Date().toISOString()
      }));

      if (worldEvolution) {
        await base44.entities.WorldEvolution.update(worldEvolution.id, {
          world_state: {
            ...worldEvolution.world_state,
            ...simulationData.world_state_update
          },
          simulated_events: [
            ...(worldEvolution.simulated_events || []),
            ...eventsWithDates
          ],
          last_simulation_date: new Date().toISOString()
        });
      } else {
        await base44.entities.WorldEvolution.create({
          world_id: worldId,
          world_state: simulationData.world_state_update,
          simulated_events: eventsWithDates,
          last_simulation_date: new Date().toISOString()
        });
      }

      return simulationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worldEvolution', worldId] });
      toast.success("World simulation complete!");
    }
  });

  const recentEvents = worldEvolution?.simulated_events?.slice(-5) || [];

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          World State Simulator
        </CardTitle>
        <p className="text-xs text-purple-400 mt-1">
          AI-driven simulation of world changes based on campaign outcomes
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => simulateMutation.mutate()}
          disabled={isSimulating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isSimulating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
          Run World Simulation
        </Button>

        {worldEvolution?.last_simulation_date && (
          <p className="text-xs text-purple-400 text-center">
            Last simulated: {new Date(worldEvolution.last_simulation_date).toLocaleDateString()}
          </p>
        )}

        {worldEvolution?.world_state && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
            <h5 className="font-semibold text-purple-300 mb-2">Current World State</h5>
            <div className="text-xs space-y-2 text-white">
              {worldEvolution.world_state.political_landscape && (
                <p><span className="text-purple-400">Political:</span> {worldEvolution.world_state.political_landscape}</p>
              )}
              {worldEvolution.world_state.economic_conditions && (
                <p><span className="text-purple-400">Economic:</span> {worldEvolution.world_state.economic_conditions}</p>
              )}
              {worldEvolution.world_state.power_shifts?.length > 0 && (
                <div>
                  <p className="text-purple-400">Power Shifts:</p>
                  <ul className="ml-3">
                    {worldEvolution.world_state.power_shifts.map((shift, i) => (
                      <li key={i}>• {shift}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {recentEvents.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-semibold text-purple-300 text-sm">Recent World Events</h5>
            {recentEvents.map((event, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-pink-500">
                <div className="flex items-start justify-between mb-1">
                  <h6 className="font-semibold text-pink-300 text-sm">{event.title}</h6>
                  <Badge className={
                    event.event_type === 'political' ? 'bg-purple-600' :
                    event.event_type === 'economic' ? 'bg-green-600' :
                    event.event_type === 'environmental' ? 'bg-blue-600' :
                    event.event_type === 'military' ? 'bg-red-600' : 'bg-yellow-600'
                  }>
                    {event.event_type}
                  </Badge>
                </div>
                <p className="text-xs text-white mb-2">{event.description}</p>
                {event.impacts?.length > 0 && (
                  <div className="text-xs text-pink-400">
                    <p className="flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3 h-3" />
                      Impacts:
                    </p>
                    <ul className="ml-4 text-pink-300">
                      {event.impacts.map((impact, j) => (
                        <li key={j}>• {impact}</li>
                      ))}
                    </ul>
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