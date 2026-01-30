import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

export default function InteractiveTimeline({ worldId }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [expandedEra, setExpandedEra] = useState(null);

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const { data: world } = useQuery({
    queryKey: ['world', worldId],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ id: worldId });
      return worlds[0];
    },
    enabled: !!worldId
  });

  const { data: rulebooks } = useQuery({
    queryKey: ['rulebooks'],
    queryFn: () => base44.entities.Rulebook.list()
  });

  const generateTimeline = async () => {
    setIsGenerating(true);
    try {
      const generatedTimeline = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an interactive historical timeline for this world:

World: ${world?.name}
Franchise: ${world?.rulebook_franchise}
Genre: ${world?.genre}

Rulebook History:
${JSON.stringify(rulebooks?.slice(0, 3).map(r => r.title) || [])}

World Evolution:
${JSON.stringify(worldEvolution || {})}

Generate a timeline with:
1. Major historical eras (from franchise roots to present)
2. Key events in each era with dates/periods
3. Faction formations and shifts
4. Technological/magical developments
5. Conflicts and resolutions
6. How events cascade and interconnect
7. Current world state implications`,
        response_json_schema: {
          type: "object",
          properties: {
            timeline_eras: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  era_name: { type: "string" },
                  time_period: { type: "string" },
                  description: { type: "string" },
                  major_events: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        event_name: { type: "string" },
                        date: { type: "string" },
                        description: { type: "string" },
                        impact: { type: "string" },
                        factions_involved: { type: "array", items: { type: "string" } }
                      }
                    }
                  },
                  world_state: { type: "string" },
                  connections_to_present: { type: "string" }
                }
              }
            },
            interconnections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  era1: { type: "string" },
                  era2: { type: "string" },
                  connection: { type: "string" }
                }
              }
            }
          }
        }
      });

      setTimeline(generatedTimeline.timeline_eras || []);
      toast.success('Timeline generated!');
    } catch (error) {
      toast.error('Failed to generate timeline');
    }
    setIsGenerating(false);
  };

  const getEraColor = (index) => {
    const colors = [
      'from-red-900/40 to-red-700/40 border-red-500/30',
      'from-orange-900/40 to-orange-700/40 border-orange-500/30',
      'from-yellow-900/40 to-yellow-700/40 border-yellow-500/30',
      'from-green-900/40 to-green-700/40 border-green-500/30',
      'from-blue-900/40 to-blue-700/40 border-blue-500/30',
      'from-purple-900/40 to-purple-700/40 border-purple-500/30'
    ];
    return colors[index % colors.length];
  };

  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterType, setFilterType] = useState('all');

  const eventTypes = ['all', 'political', 'economic', 'environmental', 'social', 'military'];

  const filteredTimeline = timeline?.filter(era => {
    if (filterType === 'all') return true;
    return era.major_events?.some(evt => evt.event_type === filterType);
  }) || [];

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 col-span-2">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Interactive Historical Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateTimeline}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
          Generate Timeline
        </Button>

        {timeline && timeline.length > 0 && (
          <div className="space-y-4">
            {/* Timeline Controls */}
            <div className="flex flex-col sm:flex-row gap-3 pb-3 border-b border-slate-600/30">
              <div className="flex gap-1 flex-wrap">
                {eventTypes.map(type => (
                  <Button
                    key={type}
                    size="sm"
                    variant={filterType === type ? "default" : "outline"}
                    onClick={() => setFilterType(type)}
                    className="text-xs"
                  >
                    {type === 'all' ? 'All' : type}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.25))}
                  variant="outline"
                  className="text-xs"
                >
                  +
                </Button>
                <span className="text-xs text-slate-400 self-center">{(zoomLevel * 100).toFixed(0)}%</span>
                <Button
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(0.75, zoomLevel - 0.25))}
                  variant="outline"
                  className="text-xs"
                >
                  -
                </Button>
              </div>
            </div>

            {/* Timeline Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {filteredTimeline.map((era, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-r ${getEraColor(idx)} border rounded-lg p-4 cursor-pointer transition-all`}
                onClick={() => setExpandedEra(expandedEra === idx ? null : idx)}
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
              >
                {/* Era Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg">{era.era_name}</h4>
                    <p className="text-sm text-slate-300">{era.time_period}</p>
                  </div>
                  <Badge className="bg-slate-700/60">{expandedEra === idx ? '▼' : '▶'}</Badge>
                </div>

                <p className="text-sm text-slate-200 mb-2">{era.description}</p>

                {/* Events List (Collapsed) */}
                {expandedEra !== idx && era.major_events?.length > 0 && (
                  <div className="text-xs text-slate-400">
                    {era.major_events.length} major event{era.major_events.length !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Expanded Content */}
                {expandedEra === idx && (
                  <div className="mt-3 space-y-3 border-t border-current opacity-80 pt-3">
                    {/* Major Events */}
                    {era.major_events?.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-semibold text-white text-sm">⚡ Major Events:</h5>
                        {era.major_events.map((event, evtIdx) => (
                          <div key={evtIdx} className="bg-black/20 rounded p-2 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-white">{event.event_name}</p>
                              <Badge className="bg-slate-600 text-xs">{event.date}</Badge>
                            </div>
                            <p className="text-slate-300">{event.description}</p>
                            <p className="text-yellow-300">📊 Impact: {event.impact}</p>
                            {event.factions_involved?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {event.factions_involved.map((faction, fIdx) => (
                                  <Badge key={fIdx} className="bg-slate-600/40 text-xs">{faction}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* World State */}
                    {era.world_state && (
                      <div className="bg-black/20 rounded p-2">
                        <p className="text-xs font-semibold text-blue-300 mb-1">🌍 World State:</p>
                        <p className="text-xs text-slate-300">{era.world_state}</p>
                      </div>
                    )}

                    {/* Connection to Present */}
                    {era.connections_to_present && (
                      <div className="bg-black/20 rounded p-2">
                        <p className="text-xs font-semibold text-green-300 mb-1">🔗 Connection to Today:</p>
                        <p className="text-xs text-slate-300">{era.connections_to_present}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            </div>

            {/* Timeline Info */}
            <div className="mt-4 text-xs text-slate-400 text-center space-y-1">
              <p>📍 {filteredTimeline.length} era{filteredTimeline.length !== 1 ? 's' : ''} • Filter by event type • Zoom to adjust view</p>
              <p>Click any era to expand and explore events, impacts, and connections</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}