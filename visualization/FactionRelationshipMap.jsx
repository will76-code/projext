import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function FactionRelationshipMap({ worldId }) {
  const [showForm, setShowForm] = useState(false);
  const [faction1, setFaction1] = useState("");
  const [faction2, setFaction2] = useState("");
  const [relationship, setRelationship] = useState("neutral");
  const queryClient = useQueryClient();

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const { data: relationships } = useQuery({
    queryKey: ['factionRelationships', worldId],
    queryFn: async () => {
      try {
        const rels = await base44.entities.FactionRelationship.filter({ world_id: worldId });
        return rels;
      } catch {
        return [];
      }
    },
    enabled: !!worldId
  });

  const createRelationshipMutation = useMutation({
    mutationFn: () => base44.entities.FactionRelationship.create({
      world_id: worldId,
      faction_a: faction1,
      faction_b: faction2,
      relationship_type: relationship,
      tension_level: relationship === 'hostile' ? 100 : relationship === 'ally' ? -100 : 0,
      notes: ""
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factionRelationships', worldId] });
      setFaction1("");
      setFaction2("");
      setRelationship("neutral");
      setShowForm(false);
      toast.success('Relationship created!');
    }
  });

  // Extract all factions from world evolution
  const allFactions = [
    ...new Set([
      ...(relationships?.flatMap(r => [r.faction_a, r.faction_b]) || []),
      ...Object.keys(worldEvolution?.world_state?.power_shifts || {}),
      ...(worldEvolution?.campaign_states?.flatMap(s => Object.keys(s.factions_affected || {})) || [])
    ])
  ].filter(Boolean);

  const getRelationshipColor = (type) => {
    switch (type) {
      case 'ally': return 'bg-green-600 text-white';
      case 'hostile': return 'bg-red-600 text-white';
      case 'neutral': return 'bg-slate-600 text-white';
      case 'trade': return 'bg-blue-600 text-white';
      case 'rival': return 'bg-orange-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  const getRelationshipIcon = (type) => {
    switch (type) {
      case 'ally': return '🤝';
      case 'hostile': return '⚔️';
      case 'trade': return '💰';
      case 'rival': return '🔥';
      default: return '➡️';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Faction Relationship Map
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          className="border-purple-500/50"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Relationship Form */}
        {showForm && (
          <div className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
            <select
              value={faction1}
              onChange={(e) => setFaction1(e.target.value)}
              className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-2 text-sm text-slate-200"
            >
              <option value="">Select Faction A</option>
              {allFactions.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
              <option value="">─ New Faction</option>
            </select>
            {faction1 === "" && <input
              type="text"
              placeholder="Enter faction name"
              className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-2 text-sm text-slate-200"
              onChange={(e) => setFaction1(e.target.value)}
            />}

            <select
              value={faction2}
              onChange={(e) => setFaction2(e.target.value)}
              className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-2 text-sm text-slate-200"
            >
              <option value="">Select Faction B</option>
              {allFactions.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
              <option value="">─ New Faction</option>
            </select>

            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-2 text-sm text-slate-200"
            >
              <option value="ally">Ally (🤝)</option>
              <option value="hostile">Hostile (⚔️)</option>
              <option value="neutral">Neutral (➡️)</option>
              <option value="trade">Trade (💰)</option>
              <option value="rival">Rival (🔥)</option>
            </select>

            <Button
              onClick={() => createRelationshipMutation.mutate()}
              disabled={createRelationshipMutation.isPending || !faction1 || !faction2}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {createRelationshipMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create"}
            </Button>
          </div>
        )}

        {/* Visual Network */}
        {relationships?.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 space-y-3">
            <h5 className="text-sm font-semibold text-slate-400">Faction Network</h5>
            <div className="space-y-2">
              {relationships?.map((rel, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-slate-300 font-semibold max-w-24 truncate">{rel.faction_a}</span>
                    <div className="flex-1 flex items-center gap-1 mx-1">
                      <div className="flex-1 h-1 bg-gradient-to-r from-slate-600 to-slate-700" />
                      <span className="text-lg">{getRelationshipIcon(rel.relationship_type)}</span>
                    </div>
                    <span className="text-slate-300 font-semibold max-w-24 truncate text-right">{rel.faction_b}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationships Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {relationships?.map((rel, idx) => (
            <div
              key={idx}
              className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-slate-300 text-sm">{rel.faction_a}</span>
                  <span className="text-lg">{getRelationshipIcon(rel.relationship_type)}</span>
                  <span className="font-semibold text-slate-300 text-sm">{rel.faction_b}</span>
                </div>
              </div>

              <Badge className={getRelationshipColor(rel.relationship_type)}>
                {rel.relationship_type}
              </Badge>

              {rel.tension_level !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Zap className={`w-3 h-3 ${Math.abs(rel.tension_level) > 50 ? 'text-orange-400' : 'text-slate-400'}`} />
                    <div className="flex-1 h-1.5 bg-slate-600 rounded">
                      <div
                        className={`h-full rounded ${rel.tension_level > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(Math.abs(rel.tension_level), 100)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {rel.tension_level > 50 ? '⚡ High' : rel.tension_level > 0 ? '🟡 Medium' : '✓ Stable'} Tension
                  </p>
                </div>
              )}

              {rel.notes && (
                <p className="text-xs text-slate-400 line-clamp-2">{rel.notes}</p>
              )}
            </div>
          ))}
        </div>

        {!relationships?.length && !showForm && (
          <p className="text-sm text-slate-400 text-center py-6">No faction relationships yet.</p>
        )}

        {/* Faction Summary */}
        {allFactions.length > 0 && (
          <div className="border-t border-slate-500/30 pt-3">
            <h5 className="text-xs font-semibold text-slate-400 mb-2">Known Factions ({allFactions.length})</h5>
            <div className="flex flex-wrap gap-1">
              {allFactions.map(f => (
                <Badge key={f} variant="outline" className="border-slate-500/50 text-xs">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}