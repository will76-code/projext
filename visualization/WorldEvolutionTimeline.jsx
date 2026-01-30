import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Clock } from "lucide-react";
import { format } from "date-fns";

export default function WorldEvolutionTimeline({ worldId }) {
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState("all");
  const [milestones, setMilestones] = useState([]);

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', worldId],
    queryFn: async () => {
      const allCampaigns = await base44.entities.Campaign.filter({ world_id: worldId });
      return allCampaigns.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!worldId
  });

  // Combine all events
  const allEvents = [
    ...(campaigns?.map(c => ({
      type: 'campaign',
      title: c.title,
      date: c.created_date,
      data: c,
      color: 'bg-blue-600'
    })) || []),
    ...(worldEvolution?.simulated_events?.map(e => ({
      type: 'event',
      title: e.title,
      date: e.triggered_date,
      data: e,
      color: 'bg-purple-600'
    })) || []),
    ...(worldEvolution?.emergent_lore?.map(l => ({
      type: 'lore',
      title: l.lore_type,
      date: l.created_date,
      data: l,
      color: 'bg-green-600'
    })) || [])
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  const filteredEvents = filterType === 'all' ? allEvents : allEvents.filter(e => e.type === filterType);

  const typeColors = {
    campaign: 'bg-blue-600',
    event: 'bg-purple-600',
    lore: 'bg-green-600'
  };

  const toggleMilestone = (eventIdx) => {
    setMilestones(milestones.includes(eventIdx) 
      ? milestones.filter(i => i !== eventIdx)
      : [...milestones, eventIdx]
    );
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          World Evolution Timeline
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
            className="p-1 hover:bg-slate-700 rounded"
          >
            <ZoomOut className="w-4 h-4 text-slate-400" />
          </button>
          <span className="text-xs text-slate-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.2))}
            className="p-1 hover:bg-slate-700 rounded"
          >
            <ZoomIn className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'campaign', 'event', 'lore'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                filterType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div
          className="space-y-0 relative"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-slate-600" />

          {/* Events */}
          <div className="space-y-4">
            {filteredEvents.map((event, idx) => {
              const isMilestone = milestones.includes(idx);
              return (
              <div key={idx} className="ml-12 relative">
                {/* Milestone Star */}
                {isMilestone && (
                  <div className="absolute -left-10 top-0 text-yellow-400 text-lg animate-pulse">★</div>
                )}
                {/* Dot */}
                <div className={`absolute -left-8 top-1.5 w-4 h-4 rounded-full ${typeColors[event.type]} ${isMilestone ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-800' : ''} border-2 border-slate-800 cursor-pointer hover:scale-150 transition-transform`}
                  onClick={() => toggleMilestone(idx)}
                />

                {/* Content */}
                <div className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-slate-300 text-sm">{event.title}</h5>
                      <p className="text-xs text-slate-500">
                        {event.date ? format(new Date(event.date), 'MMM dd, yyyy') : 'Unknown date'}
                      </p>
                    </div>
                    <Badge className={`${typeColors[event.type]} text-xs`}>
                      {event.type}
                    </Badge>
                  </div>

                  {event.data?.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{event.data.description}</p>
                  )}

                  {event.data?.summary && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{event.data.summary}</p>
                  )}

                  {event.data?.content && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{event.data.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No events to display</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}