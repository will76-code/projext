import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

export default function LoreNetworkGraph({ worldId }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [networkData, setNetworkData] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const canvasRef = useRef(null);

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const generateNetwork = async () => {
    setIsGenerating(true);
    try {
      const network = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a network graph structure for lore interconnections:

World Evolution:
${JSON.stringify(worldEvolution || {})}

Create a dynamic network showing:
1. Nodes: Factions, Characters, Events, Locations, Artifacts
2. Edges: Relationships, conflicts, alliances, causality
3. Node importance based on narrative weight
4. Edge types: alliance, conflict, causality, discovery`,
        response_json_schema: {
          type: "object",
          properties: {
            nodes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                  type: { type: "string", enum: ["faction", "character", "event", "location", "artifact"] },
                  importance: { type: "number" },
                  description: { type: "string" }
                }
              }
            },
            edges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source: { type: "string" },
                  target: { type: "string" },
                  relationship: { type: "string" },
                  type: { type: "string", enum: ["alliance", "conflict", "causality", "discovery"] },
                  weight: { type: "number" }
                }
              }
            }
          }
        }
      });

      setNetworkData(network);
      toast.success('Network graph generated!');
    } catch (error) {
      toast.error('Failed to generate network');
    }
    setIsGenerating(false);
  };

  const getNodeColor = (type) => {
    const colors = {
      faction: '#3b82f6',
      character: '#ec4899',
      event: '#f59e0b',
      location: '#10b981',
      artifact: '#a78bfa'
    };
    return colors[type] || '#6b7280';
  };

  useEffect(() => {
    if (!canvasRef.current || !networkData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(canvas.width / (2 * zoom), canvas.height / (2 * zoom));

    // Draw edges
    networkData.edges?.forEach(edge => {
      const source = networkData.nodes.find(n => n.id === edge.source);
      const target = networkData.nodes.find(n => n.id === edge.target);
      if (source && target) {
        ctx.strokeStyle = edge.type === 'conflict' ? '#ef4444' : '#6b7280';
        ctx.lineWidth = edge.weight || 1;
        ctx.beginPath();
        ctx.moveTo(source.x || 0, source.y || 0);
        ctx.lineTo(target.x || 0, target.y || 0);
        ctx.stroke();
      }
    });

    // Draw nodes
    networkData.nodes?.forEach(node => {
      ctx.fillStyle = getNodeColor(node.type);
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, Math.max(3, (node.importance || 0.5) * 10), 0, Math.PI * 2);
      ctx.fill();

      if (selectedNode?.id === node.id) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [networkData, zoom, selectedNode]);

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Network className="w-5 h-5" />
          Dynamic Lore Network
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateNetwork}
          disabled={isGenerating}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Network className="w-4 h-4 mr-2" />}
          Generate Network Graph
        </Button>

        {networkData && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setZoom(Math.min(3, zoom + 0.2))} variant="outline">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} variant="outline">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-slate-400 ml-auto self-center">{(zoom * 100).toFixed(0)}%</span>
            </div>

            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg cursor-pointer"
              onClick={(e) => {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left) / zoom - canvasRef.current.width / (2 * zoom);
                const y = (e.clientY - rect.top) / zoom - canvasRef.current.height / (2 * zoom);

                const closest = networkData.nodes.reduce((min, node) => {
                  const dist = Math.hypot((node.x || 0) - x, (node.y || 0) - y);
                  return dist < (min.dist || Infinity) ? { node, dist } : min;
                }, {});

                if (closest.dist < 20) setSelectedNode(closest.node);
              }}
            />

            {selectedNode && (
              <div className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-slate-300">{selectedNode.label}</h5>
                  <Badge className="bg-slate-600">{selectedNode.type}</Badge>
                </div>
                <p className="text-xs text-slate-400">{selectedNode.description}</p>
              </div>
            )}

            <div className="text-xs text-slate-400 space-y-1">
              <p>Nodes: {networkData.nodes?.length || 0} | Edges: {networkData.edges?.length || 0}</p>
              <p>Click nodes to view details • Zoom to explore connections</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}