import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RelationshipMapBuilder({ worldId, entities = [] }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState("faction");
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [linkNotes, setLinkNotes] = useState({});
  const [linkStrength, setLinkStrength] = useState({});
  const [linkType, setLinkType] = useState({});

  const nodeTypes = {
    faction: { color: "#8b5cf6", emoji: "⚔️" },
    location: { color: "#06b6d4", emoji: "📍" },
    npc: { color: "#ec4899", emoji: "👤" },
    event: { color: "#f59e0b", emoji: "⭐" }
  };

  // Initialize nodes from entities
  useEffect(() => {
    if (entities.length > 0 && nodes.length === 0) {
      const initialNodes = entities.slice(0, 5).map((entity, i) => ({
        id: `node_${i}`,
        label: entity.name || `${newNodeType} ${i + 1}`,
        type: newNodeType,
        x: 100 + (i % 3) * 150,
        y: 100 + Math.floor(i / 3) * 150
      }));
      setNodes(initialNodes);
    }
  }, [entities]);

  const addNode = () => {
    if (!newNodeLabel.trim()) {
      toast.error("Enter a label");
      return;
    }

    const newNode = {
      id: `node_${Date.now()}`,
      label: newNodeLabel,
      type: newNodeType,
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50
    };

    setNodes([...nodes, newNode]);
    setNewNodeLabel("");
    toast.success("Node added");
  };

  const deleteNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    setLinks(links.filter(l => l.source !== id && l.target !== id));
  };

  const relationshipTypes = ["ally", "hostile", "neutral", "trade", "rival"];

  const createLink = (sourceId, targetId) => {
    if (sourceId === targetId || links.find(l => (l.source === sourceId && l.target === targetId) || (l.source === targetId && l.target === sourceId))) {
      return;
    }
    const linkId = `link_${Date.now()}`;
    setLinks([...links, { id: linkId, source: sourceId, target: targetId }]);
    setLinkType({ ...linkType, [linkId]: "ally" });
    setLinkStrength({ ...linkStrength, [linkId]: 5 });
    toast.success("Connection created");
  };

  const deleteLink = (linkId) => {
    setLinks(links.filter(l => l.id !== linkId));
    const newNotes = { ...linkNotes };
    delete newNotes[linkId];
    setLinkNotes(newNotes);
    setSelectedLink(null);
  };

  const updateLinkType = (linkId, type) => {
    setLinkType({ ...linkType, [linkId]: type });
  };

  const updateLinkStrength = (linkId, strength) => {
    setLinkStrength({ ...linkStrength, [linkId]: strength });
  };

  const updateLinkNotes = (linkId, notes) => {
    setLinkNotes({ ...linkNotes, [linkId]: notes });
  };

  const filteredLinks = filterType === "all" 
    ? links 
    : links.filter(l => linkType[l.id] === filterType);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(n => 
      Math.hypot(n.x - x, n.y - y) < 20
    );

    if (clickedNode) {
      if (selectedNode?.id === clickedNode.id) {
        setSelectedNode(null);
      } else if (selectedNode) {
        createLink(selectedNode.id, clickedNode.id);
        setSelectedNode(null);
      } else {
        setSelectedNode(clickedNode);
      }
    } else {
      setSelectedLink(null);
    }
  };

  const getLinkAtPoint = (x, y) => {
    const threshold = 10;
    return filteredLinks.find(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      if (!source || !target) return false;

      const dist = Math.abs((target.y - source.y) * x - (target.x - source.x) * y + target.x * source.y - target.y * source.x) / Math.hypot(target.y - source.y, target.x - source.x);
      return dist < threshold;
    });
  };

  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setIsDragging(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      setNodes(nodes.map(n => 
        n.id === isDragging ? { ...n, x, y } : n
      ));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, nodes]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw links
    filteredLinks.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      if (source && target) {
        const type = linkType[link.id] || "ally";
        const strength = linkStrength[link.id] || 5;

        // Color based on type
        const typeColors = {
          ally: "#10b981",
          hostile: "#ef4444",
          neutral: "#64748b",
          trade: "#f59e0b",
          rival: "#8b5cf6"
        };

        ctx.strokeStyle = typeColors[type];
        ctx.lineWidth = 1 + (strength / 10) * 3;
        ctx.setLineDash(selectedLink?.id === link.id ? [5, 5] : []);
        
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw strength indicator
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.fillStyle = typeColors[type];
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(strength, midX, midY - 5);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const config = nodeTypes[node.type];
      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fill();

      // Highlight selected
      if (selectedNode?.id === node.id) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw label
      if (showLabels) {
        ctx.fillStyle = "#f1f5f9";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label.substring(0, 10), node.x, node.y + 35);
      }

      // Draw emoji
      ctx.font = "16px sans-serif";
      ctx.fillText(config.emoji, node.x - 8, node.y - 5);
    });
  };

  useEffect(() => {
    drawCanvas();
  }, [nodes, filteredLinks, selectedNode, showLabels, selectedLink, linkType, linkStrength]);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-cyan-300">Faction & Location Map</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
            className="text-slate-400"
          >
            {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onClick={(e) => {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const clickedLink = getLinkAtPoint(x, y);
            if (clickedLink) {
              setSelectedLink(clickedLink);
              setSelectedNode(null);
            } else {
              handleCanvasClick(e);
            }
          }}
          className="w-full border border-slate-700 rounded bg-slate-900/50 cursor-crosshair"
        />

        <div className="text-xs text-slate-400 space-y-1">
          <p>• Click a node to select it</p>
          <p>• Click another node to connect them</p>
          <p>• Drag nodes to move them around</p>
        </div>

        {/* Filter by Relationship Type */}
        <div className="border-t border-slate-700 pt-4">
          <p className="text-xs text-slate-400 font-semibold mb-2">Filter by Type:</p>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={filterType === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterType("all")}
            >
              All
            </Badge>
            {relationshipTypes.map(type => (
              <Badge 
                key={type}
                variant={filterType === type ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setFilterType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-700 pt-4">
          <div className="flex gap-2">
            <select
              value={newNodeType}
              onChange={(e) => setNewNodeType(e.target.value)}
              className="text-xs bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-slate-300"
            >
              {Object.entries(nodeTypes).map(([type, config]) => (
                <option key={type} value={type}>{config.emoji} {type}</option>
              ))}
            </select>
            <Input
              placeholder="New node label"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNode()}
              className="text-xs bg-slate-700/50 border-slate-600"
            />
            <Button onClick={addNode} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {selectedNode && (
            <div className="flex items-center justify-between bg-amber-900/20 border border-amber-500/30 rounded p-2">
              <span className="text-xs text-amber-300">
                {selectedNode.label} ({selectedNode.type})
              </span>
              <Button
                onClick={() => deleteNode(selectedNode.id)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}

          {selectedLink && (
            <div className="bg-slate-700/30 border border-purple-500/30 rounded p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-300 font-semibold">Edit Relationship</span>
                <Button
                  onClick={() => deleteLink(selectedLink.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <div>
                <label className="text-xs text-slate-400">Type</label>
                <select
                  value={linkType[selectedLink.id] || "ally"}
                  onChange={(e) => updateLinkType(selectedLink.id, e.target.value)}
                  className="w-full text-xs bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-slate-300 mt-1"
                >
                  {relationshipTypes.map(type => (
                    <option key={type} value={type} className="capitalize">{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Strength: {linkStrength[selectedLink.id] || 5}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={linkStrength[selectedLink.id] || 5}
                  onChange={(e) => updateLinkStrength(selectedLink.id, parseInt(e.target.value))}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Notes</label>
                <textarea
                  value={linkNotes[selectedLink.id] || ""}
                  onChange={(e) => updateLinkNotes(selectedLink.id, e.target.value)}
                  placeholder="Add relationship notes..."
                  className="w-full text-xs bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-slate-300 mt-1 h-20 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}