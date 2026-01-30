import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Loader2, Trash2, ZoomIn, ZoomOut, Move } from "lucide-react";
import { toast } from "sonner";

export default function CampaignGeographicalMap({ worldId, campaignId }) {
  const [showForm, setShowForm] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [locationType, setLocationType] = useState("settlement");
  const [description, setDescription] = useState("");
  const [xPos, setXPos] = useState(50);
  const [yPos, setYPos] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const queryClient = useQueryClient();

  const { data: locations } = useQuery({
    queryKey: ['locations', worldId, campaignId],
    queryFn: async () => {
      try {
        const locs = await base44.entities.CampaignLocation.filter({
          world_id: worldId,
          ...(campaignId && { campaign_id: campaignId })
        });
        return locs;
      } catch {
        return [];
      }
    },
    enabled: !!worldId
  });

  const createLocationMutation = useMutation({
    mutationFn: () => base44.entities.CampaignLocation.create({
      world_id: worldId,
      campaign_id: campaignId || null,
      name: locationName,
      type: locationType,
      description,
      x_position: xPos,
      y_position: yPos,
      poi: [] // Points of interest
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', worldId, campaignId] });
      setLocationName("");
      setDescription("");
      setLocationType("settlement");
      setShowForm(false);
      toast.success('Location added!');
    }
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id) => base44.entities.CampaignLocation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', worldId, campaignId] });
      toast.success('Location deleted');
    }
  });

  const locationIcons = {
    settlement: '🏘️',
    city: '🏰',
    dungeon: '🗻',
    forest: '🌲',
    mountain: '⛰️',
    water: '💧',
    ruin: '⚱️',
    temple: '⛪',
    castle: '🏯',
    cave: '🕳️'
  };

  const locationColors = {
    settlement: 'bg-yellow-500',
    city: 'bg-orange-500',
    dungeon: 'bg-purple-500',
    forest: 'bg-green-500',
    mountain: 'bg-gray-500',
    water: 'bg-blue-500',
    ruin: 'bg-red-500',
    temple: 'bg-pink-500',
    castle: 'bg-indigo-500',
    cave: 'bg-slate-600'
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Campaign Map
        </CardTitle>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-slate-400 px-2 py-1">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(2, zoom + 0.2))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-purple-500/50"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Location Form */}
        {showForm && (
          <div className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
            <input
              type="text"
              placeholder="Location name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-2 text-sm text-slate-200 placeholder-slate-500"
            />
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-2 text-sm text-slate-200"
            >
              {Object.keys(locationIcons).map(type => (
                <option key={type} value={type}>{type} {locationIcons[type]}</option>
              ))}
            </select>
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-2 text-sm text-slate-200 placeholder-slate-500"
              rows={2}
            />

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Position: ({xPos}, {yPos})</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">X</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={xPos}
                    onChange={(e) => setXPos(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Y</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={yPos}
                    onChange={(e) => setYPos(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => createLocationMutation.mutate()}
              disabled={createLocationMutation.isPending || !locationName}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {createLocationMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create"}
            </Button>
          </div>
        )}

        {/* Map Container */}
        <div className="bg-slate-900/50 border border-slate-600 rounded-lg relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px'
            }}
          />

          {/* Zoomable Container */}
          <div
            className="absolute inset-0 transition-transform"
            style={{
              transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`
            }}
          >
            {/* Locations */}
            {locations?.map((loc) => (
              <div
                key={loc.id}
                className="absolute group"
                style={{
                  left: `${loc.x_position}%`,
                  top: `${loc.y_position}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => setSelectedLocation(selectedLocation?.id === loc.id ? null : loc)}
              >
                {/* Marker */}
                <div className={`w-8 h-8 rounded-full ${locationColors[loc.type]} ${selectedLocation?.id === loc.id ? 'ring-2 ring-yellow-400' : ''} flex items-center justify-center text-lg cursor-pointer border-2 border-slate-800 shadow-lg hover:scale-125 transition-transform`}>
                  {locationIcons[loc.type]}
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 border border-slate-600 rounded p-2 text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <p className="font-semibold">{loc.name}</p>
                  <p className="text-slate-500">{loc.type}</p>
                </div>

                {/* Delete Button (on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLocationMutation.mutate(loc.id);
                  }}
                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="bg-red-600 rounded-full p-0.5">
                    <Trash2 className="w-3 h-3 text-white" />
                  </div>
                </button>
              </div>
            ))}

            {/* Empty State */}
            {!locations?.length && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-slate-500 text-sm">No locations yet. Add some to the map!</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Location Details */}
        {selectedLocation && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 space-y-2">
            <h5 className="font-semibold text-purple-300">{selectedLocation.name}</h5>
            <p className="text-sm text-slate-300">{selectedLocation.description}</p>
            <Badge className={locationColors[selectedLocation.type]}>{selectedLocation.type}</Badge>
            <p className="text-xs text-slate-500">Position: ({selectedLocation.x_position}, {selectedLocation.y_position})</p>
          </div>
        )}

        {/* Location List */}
        {locations?.length > 0 && (
          <div className="border-t border-slate-500/30 pt-3">
            <h5 className="text-xs font-semibold text-slate-400 mb-2">Locations ({locations.length})</h5>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {locations.map(loc => (
                <div key={loc.id} className="flex items-start justify-between text-xs p-1 hover:bg-slate-700/30 rounded">
                  <div>
                    <p className="text-slate-300">{locationIcons[loc.type]} {loc.name}</p>
                    <p className="text-slate-500 line-clamp-1">{loc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}