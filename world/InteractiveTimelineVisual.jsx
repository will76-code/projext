import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronDown, Filter } from "lucide-react";

export default function InteractiveTimelineVisual({ timeline }) {
  const [expandedEras, setExpandedEras] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!timeline || timeline.length === 0) return null;

  const eventTypes = ["all", "political", "economic", "military", "cultural", "disaster"];

  const toggleEra = (idx) => {
    setExpandedEras(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getEventIcon = (type) => {
    const icons = {
      political: '👑',
      economic: '💰',
      military: '⚔️',
      cultural: '🎭',
      disaster: '💥'
    };
    return icons[type] || '📌';
  };

  const getEventColor = (type) => {
    const colors = {
      political: 'bg-blue-600/20 border-blue-500/30',
      economic: 'bg-green-600/20 border-green-500/30',
      military: 'bg-red-600/20 border-red-500/30',
      cultural: 'bg-purple-600/20 border-purple-500/30',
      disaster: 'bg-orange-600/20 border-orange-500/30'
    };
    return colors[type] || 'bg-slate-600/20 border-slate-500/30';
  };

  const filteredTimeline = timeline.map(era => ({
    ...era,
    major_events: era.major_events?.filter(evt =>
      filterType === "all" || evt.type === filterType
    ) || []
  }));

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Interactive Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-1 flex-wrap">
            {eventTypes.map(type => (
              <Button
                key={type}
                size="sm"
                variant={filterType === type ? "default" : "outline"}
                onClick={() => setFilterType(type)}
                className="text-xs"
              >
                {type === "all" ? "All Events" : type}
              </Button>
            ))}
          </div>
          <div className="ml-auto text-xs text-slate-400 self-center">
            Zoom: {(zoomLevel * 100).toFixed(0)}%
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {filteredTimeline.map((era, idx) => (
            <div
              key={idx}
              className="border-l-4 border-purple-500/50 pl-4 space-y-2 cursor-pointer hover:border-purple-500"
              onClick={() => toggleEra(idx)}
            >
              {/* Era Header */}
              <div className="flex items-start justify-between hover:opacity-80">
                <div>
                  <h4 className="font-bold text-white text-sm">{era.era_name}</h4>
                  <p className="text-xs text-slate-400">{era.time_period}</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${expandedEras[idx] ? 'rotate-180' : ''}`}
                />
              </div>

              {/* Collapsed View */}
              {!expandedEras[idx] && (
                <p className="text-xs text-slate-400">
                  {era.major_events?.length || 0} event{(era.major_events?.length || 0) !== 1 ? 's' : ''}
                </p>
              )}

              {/* Expanded View */}
              {expandedEras[idx] && (
                <div className="space-y-2 mt-3 border-t border-slate-600/30 pt-3">
                  {/* Events */}
                  {era.major_events?.map((event, evtIdx) => (
                    <div
                      key={evtIdx}
                      className={`border rounded-lg p-2 text-xs space-y-1 ${getEventColor(event.event_type || 'political')}`}
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top left'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getEventIcon(event.event_type || 'political')}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-white">{event.event_name}</p>
                          <p className="text-slate-400">{event.date}</p>
                        </div>
                      </div>
                      <p className="text-slate-300">{event.description}</p>
                      {event.impact && <p className="text-slate-400 italic">📊 {event.impact}</p>}
                      {event.factions_involved?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {event.factions_involved.map((faction, fIdx) => (
                            <Badge key={fIdx} className="bg-slate-600/60 text-xs">
                              {faction}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* World State */}
                  {era.world_state && (
                    <div className="bg-slate-700/30 border border-slate-500/30 rounded p-2">
                      <p className="text-xs font-semibold text-blue-400 mb-1">🌍 World State</p>
                      <p className="text-xs text-slate-300">{era.world_state}</p>
                    </div>
                  )}

                  {/* Connection to Present */}
                  {era.connections_to_present && (
                    <div className="bg-slate-700/30 border border-slate-500/30 rounded p-2">
                      <p className="text-xs font-semibold text-green-400 mb-1">🔗 Connection to Today</p>
                      <p className="text-xs text-slate-300">{era.connections_to_present}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center">Click eras to expand • Filter by event type</p>
      </CardContent>
    </Card>
  );
}