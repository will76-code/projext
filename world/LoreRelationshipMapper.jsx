import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, MapPin, Crown, Zap } from "lucide-react";
import { toast } from "sonner";

export default function LoreRelationshipMapper({ worldId }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [relationships, setRelationships] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const { data: loreContributions } = useQuery({
    queryKey: ['loreContributions', worldId],
    queryFn: () => base44.entities.LoreContribution.filter({ world_id: worldId })
  });

  const analyzeRelationships = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze lore relationships and create a network map:

Emergent Lore:
${JSON.stringify(worldEvolution?.emergent_lore || [])}

Simulated Events:
${JSON.stringify(worldEvolution?.simulated_events || [])}

User Contributions:
${JSON.stringify(loreContributions?.slice(0, 20) || [])}

NPC Memory:
${JSON.stringify(worldEvolution?.npc_memory || {})}

Create relationship analysis showing:
1. Faction relationships (allies, enemies, neutral)
2. Character connections (hierarchies, conflicts, alliances)
3. Event causality chains (how events trigger others)
4. Location significance (what lore anchors to where)
5. Temporal connections (how lore spans time)`,
        response_json_schema: {
          type: "object",
          properties: {
            faction_network: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  members: { type: "array", items: { type: "string" } },
                  relationships: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        target_faction: { type: "string" },
                        relationship_type: { type: "string", enum: ["ally", "enemy", "rival", "neutral", "dependent"] },
                        reason: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            event_causality: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  event: { type: "string" },
                  consequences: { type: "array", items: { type: "string" } },
                  influenced_by: { type: "array", items: { type: "string" } }
                }
              }
            },
            location_significance: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  lore_anchors: { type: "array", items: { type: "string" } },
                  factions_present: { type: "array", items: { type: "string" } }
                }
              }
            },
            character_arcs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  character: { type: "string" },
                  journey: { type: "string" },
                  key_events: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setRelationships(analysis);
      toast.success('Relationship map created!');
    } catch (error) {
      toast.error('Failed to analyze relationships');
    }
    setIsAnalyzing(false);
  };

  const getRelationshipColor = (type) => {
    const colors = {
      ally: 'bg-green-600/20 border-green-500/30 text-green-300',
      enemy: 'bg-red-600/20 border-red-500/30 text-red-300',
      rival: 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300',
      neutral: 'bg-slate-600/20 border-slate-500/30 text-slate-300',
      dependent: 'bg-purple-600/20 border-purple-500/30 text-purple-300'
    };
    return colors[type] || colors.neutral;
  };

  const filteredFactions = useMemo(() => {
    if (!relationships?.faction_network) return [];
    return relationships.faction_network;
  }, [relationships]);

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 col-span-2">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Network className="w-5 h-5" />
          Lore Relationship Mapper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={analyzeRelationships}
          disabled={isAnalyzing}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Network className="w-4 h-4 mr-2" />}
          Generate Relationship Map
        </Button>

        {relationships && (
          <div className="space-y-6">
            {/* Faction Network */}
            {relationships.faction_network?.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-semibold text-purple-300 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Faction Network
                </h5>
                <div className="grid grid-cols-1 gap-3">
                  {relationships.faction_network.map((faction, i) => (
                    <div key={i} className="bg-slate-700/30 border border-purple-500/20 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h6 className="font-semibold text-purple-300">{faction.name}</h6>
                        <Badge className="bg-purple-600">{faction.members?.length || 0} Members</Badge>
                      </div>

                      {faction.members?.length > 0 && (
                        <div className="text-xs text-slate-400">
                          <p className="mb-1 text-slate-500">Members:</p>
                          <div className="flex flex-wrap gap-1">
                            {faction.members.slice(0, 5).map((member, j) => (
                              <span key={j} className="px-2 py-1 bg-slate-600/50 rounded text-slate-300">{member}</span>
                            ))}
                            {faction.members.length > 5 && <span className="text-slate-500">+{faction.members.length - 5}</span>}
                          </div>
                        </div>
                      )}

                      {faction.relationships?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500 font-semibold">Relationships:</p>
                          {faction.relationships.map((rel, j) => (
                            <div key={j} className={`rounded p-2 text-xs border ${getRelationshipColor(rel.relationship_type)}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{rel.target_faction}</span>
                                <Badge className="bg-slate-600 text-xs">{rel.relationship_type}</Badge>
                              </div>
                              <p className="opacity-90">{rel.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Causality Chain */}
            {relationships.event_causality?.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-semibold text-blue-300 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Event Causality Chains
                </h5>
                <div className="space-y-2">
                  {relationships.event_causality.map((chain, i) => (
                    <div key={i} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 space-y-2">
                      <p className="font-semibold text-blue-300 text-sm">⚡ {chain.event}</p>

                      {chain.influenced_by?.length > 0 && (
                        <div className="text-xs text-blue-400 space-y-1">
                          <p className="font-semibold">Triggered by:</p>
                          {chain.influenced_by.map((trigger, j) => (
                            <p key={j} className="ml-2">← {trigger}</p>
                          ))}
                        </div>
                      )}

                      {chain.consequences?.length > 0 && (
                        <div className="text-xs text-yellow-400 space-y-1">
                          <p className="font-semibold">Consequences:</p>
                          {chain.consequences.map((consequence, j) => (
                            <p key={j} className="ml-2">→ {consequence}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Significance */}
            {relationships.location_significance?.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-semibold text-green-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Significance
                </h5>
                <div className="grid grid-cols-1 gap-2">
                  {relationships.location_significance.map((loc, i) => (
                    <div key={i} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 space-y-2">
                      <h6 className="font-semibold text-green-300">{loc.location}</h6>

                      {loc.lore_anchors?.length > 0 && (
                        <div className="text-xs">
                          <p className="text-green-400 font-semibold mb-1">Lore Anchors:</p>
                          <ul className="ml-2 list-disc text-green-300">
                            {loc.lore_anchors.map((anchor, j) => (
                              <li key={j}>{anchor}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {loc.factions_present?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {loc.factions_present.map((faction, j) => (
                            <Badge key={j} className="bg-green-600/60 text-green-200 text-xs">
                              {faction}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Character Arcs */}
            {relationships.character_arcs?.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-semibold text-pink-300 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Character Arcs
                </h5>
                <div className="space-y-2">
                  {relationships.character_arcs.map((arc, i) => (
                    <div key={i} className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-3 space-y-2">
                      <h6 className="font-semibold text-pink-300">{arc.character}</h6>
                      <p className="text-xs text-pink-200 italic">{arc.journey}</p>
                      {arc.key_events?.length > 0 && (
                        <div className="text-xs">
                          <p className="text-pink-400 font-semibold mb-1">Key Events:</p>
                          <ol className="ml-2 list-decimal text-pink-300 space-y-1">
                            {arc.key_events.map((event, j) => (
                              <li key={j}>{event}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}