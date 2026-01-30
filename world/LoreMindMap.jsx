import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network } from "lucide-react";
import { toast } from "sonner";

export default function LoreMindMap({ worldId }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindMapData, setMindMapData] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

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

  const generateMindMap = async () => {
    setIsGenerating(true);
    try {
      const mapData = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a mind map structure showing lore interconnectedness:

World: ${world?.name}
World Evolution:
${JSON.stringify(worldEvolution || {})}

Generate a hierarchical mind map showing:
1. Central concept (the world itself)
2. Major branches (themes, conflicts, eras)
3. Sub-branches (events, factions, characters)
4. Connections between branches
5. Color coding by category`,
        response_json_schema: {
          type: "object",
          properties: {
            root: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                category: { type: "string" }
              }
            },
            branches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  category: { type: "string", enum: ["faction", "event", "character", "location", "artifact", "conflict"] },
                  children: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            connections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  relationship: { type: "string" }
                }
              }
            }
          }
        }
      });

      setMindMapData(mapData);
      toast.success('Mind map generated!');
    } catch (error) {
      toast.error('Failed to generate mind map');
    }
    setIsGenerating(false);
  };

  const getCategoryColor = (category) => {
    const colors = {
      faction: 'bg-blue-600/20 border-blue-500/30 text-blue-300',
      event: 'bg-red-600/20 border-red-500/30 text-red-300',
      character: 'bg-pink-600/20 border-pink-500/30 text-pink-300',
      location: 'bg-green-600/20 border-green-500/30 text-green-300',
      artifact: 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300',
      conflict: 'bg-purple-600/20 border-purple-500/30 text-purple-300'
    };
    return colors[category] || colors.event;
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Network className="w-5 h-5" />
          Lore Mind Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateMindMap}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Network className="w-4 h-4 mr-2" />}
          Generate Lore Mind Map
        </Button>

        {mindMapData && (
          <div className="space-y-6">
            {/* Root Node */}
            {mindMapData.root && (
              <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 border-2 border-purple-500/50 rounded-lg p-4 text-center">
                <h4 className="font-bold text-lg text-purple-300 mb-2">{mindMapData.root.title}</h4>
                <p className="text-sm text-slate-300">{mindMapData.root.description}</p>
              </div>
            )}

            {/* Branches */}
            {mindMapData.branches?.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-300 text-sm">🌳 Main Branches</h5>
                <div className="space-y-2">
                  {mindMapData.branches.map((branch, idx) => (
                    <div
                      key={branch.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${getCategoryColor(branch.category)}`}
                      onMouseEnter={() => setHoveredNode(branch.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h6 className="font-semibold">{branch.title}</h6>
                        <Badge className="bg-slate-600 text-xs">{branch.category}</Badge>
                      </div>

                      {/* Child Nodes */}
                      {branch.children?.length > 0 && (
                        <div className="ml-3 space-y-1 mt-2 border-l-2 border-current/20 pl-3">
                          {branch.children.map((child) => (
                            <div key={child.id} className="text-xs opacity-90">
                              <p className="font-semibold">{child.title}</p>
                              {child.description && <p className="opacity-75">{child.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connections */}
            {mindMapData.connections?.length > 0 && (
              <div className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
                <h5 className="font-semibold text-slate-300 text-sm">🔗 Interconnections</h5>
                <div className="space-y-1">
                  {mindMapData.connections.slice(0, 8).map((conn, idx) => (
                    <div key={idx} className="text-xs text-slate-400">
                      <span className="text-purple-400 font-semibold">{conn.from}</span>
                      <span className="text-slate-500 mx-1">→</span>
                      <span className="text-purple-400 font-semibold">{conn.to}</span>
                      <span className="text-slate-500 mx-1">({conn.relationship})</span>
                    </div>
                  ))}
                  {mindMapData.connections.length > 8 && (
                    <p className="text-xs text-slate-500">+{mindMapData.connections.length - 8} more connections</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}