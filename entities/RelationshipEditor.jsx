import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

const relationshipTypes = [
  { value: "ally", label: "⚔️ Ally", color: "bg-green-900/50 text-green-300" },
  { value: "hostile", label: "💢 Hostile", color: "bg-red-900/50 text-red-300" },
  { value: "neutral", label: "⚪ Neutral", color: "bg-gray-900/50 text-gray-300" },
  { value: "trade", label: "💰 Trade", color: "bg-yellow-900/50 text-yellow-300" },
  { value: "rival", label: "⚡ Rival", color: "bg-orange-900/50 text-orange-300" }
];

export default function RelationshipEditor({ worldId, entity, entityType, onClose, onSave }) {
  const [relationships, setRelationships] = useState(entity?.relationships || []);
  const [newTarget, setNewTarget] = useState("");
  const [newType, setNewType] = useState("ally");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const searchEntities = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await base44.entities.LoreEntry.filter({
        world_id: worldId,
        title: { $regex: query, $options: 'i' }
      });
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const addRelationship = async (targetId, targetName) => {
    if (relationships.some(r => r.target_id === targetId)) {
      toast.error("Relationship already exists");
      return;
    }

    const newRel = {
      id: `rel_${Date.now()}`,
      target_id: targetId,
      target_name: targetName,
      type: newType,
      created_date: new Date().toISOString()
    };

    setRelationships([...relationships, newRel]);
    setNewTarget("");
    setSearchResults([]);
    toast.success("Relationship added");
  };

  const removeRelationship = (relId) => {
    setRelationships(relationships.filter(r => r.id !== relId));
    toast.success("Relationship removed");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await base44.entities.LoreEntry.update(entity.id, { relationships });
      toast.success("Relationships saved!");
      if (onSave) onSave({ ...entity, relationships });
      onClose();
    } catch (error) {
      toast.error("Failed to save relationships");
    }
    setLoading(false);
  };

  return (
    <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-slate-300 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Manage Relationships - {entity?.title}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* Add Relationship */}
        <div className="bg-slate-700/50 p-4 rounded border border-slate-600 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search entities..."
              value={newTarget}
              onChange={(e) => {
                setNewTarget(e.target.value);
                searchEntities(e.target.value);
              }}
              className="bg-slate-600/50 border-slate-600 text-sm"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="text-xs bg-slate-600/50 border border-slate-600 rounded px-2 py-1 text-slate-300"
            >
              {relationshipTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-1 bg-slate-600/30 rounded p-2">
              {searchResults.map(result => (
                <button
                  key={result.id}
                  onClick={() => addRelationship(result.id, result.title)}
                  className="w-full text-left text-xs bg-slate-700/50 hover:bg-slate-700 p-2 rounded text-slate-300 transition-colors"
                >
                  {result.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Relationships */}
        {relationships.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No relationships yet</p>
        ) : (
          <div className="space-y-2">
            {relationships.map(rel => {
              const typeConfig = relationshipTypes.find(t => t.value === rel.type);
              return (
                <div key={rel.id} className="flex items-center justify-between bg-slate-700/30 p-3 rounded border border-slate-600">
                  <div>
                    <p className="text-sm text-slate-200">{rel.target_name}</p>
                    <Badge className={`${typeConfig?.color} text-xs`}>
                      {typeConfig?.label}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRelationship(rel.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate-700">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Relationships
        </Button>
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
      </div>
    </DialogContent>
  );
}