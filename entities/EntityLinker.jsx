import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link as LinkIcon, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function EntityLinker({ entityId, entityType, worldId, linkedEntities = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState(linkedEntities);
  const [availableEntities, setAvailableEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [linkType, setLinkType] = useState("related");
  const [loading, setLoading] = useState(false);

  const linkTypes = ["related", "parent", "child", "conflict", "ally", "consequence", "inspiration"];

  const entityTypes = ["LoreEntry", "Character", "CampaignLocation", "FactionRelationship"];

  useEffect(() => {
    if (isOpen) {
      loadAvailableEntities();
    }
  }, [isOpen]);

  const loadAvailableEntities = async () => {
    setLoading(true);
    try {
      const allEntities = [];
      for (const type of entityTypes) {
        if (type === entityType) continue;
        const entities = await base44.entities[type].filter({ world_id: worldId });
        allEntities.push(...entities.map(e => ({ ...e, _type: type })));
      }
      setAvailableEntities(allEntities);
    } catch (error) {
      toast.error("Failed to load entities");
    }
    setLoading(false);
  };

  const addLink = async () => {
    if (!selectedEntity) {
      toast.error("Select an entity to link");
      return;
    }

    const newLink = {
      id: `link_${Date.now()}`,
      target_id: selectedEntity.id,
      target_type: selectedEntity._type,
      target_name: selectedEntity.name || selectedEntity.title,
      link_type: linkType
    };

    setLinks([...links, newLink]);
    setSelectedEntity(null);
    setLinkType("related");
    toast.success("Entity linked!");
  };

  const removeLink = (linkId) => {
    setLinks(links.filter(l => l.id !== linkId));
    toast.success("Link removed");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-slate-400" />
          <h4 className="font-semibold text-slate-300">Linked Entities</h4>
          <Badge variant="outline" className="text-xs">{links.length}</Badge>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-3 h-3 mr-1" />
              Link Entity
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-purple-300">Link to Entity</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 font-semibold">Link Type</label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value)}
                  className="w-full mt-2 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300"
                >
                  {linkTypes.map(type => (
                    <option key={type} value={type} className="capitalize">{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 font-semibold">Select Entity</label>
                <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                  {loading ? (
                    <p className="text-xs text-slate-500">Loading entities...</p>
                  ) : availableEntities.length === 0 ? (
                    <p className="text-xs text-slate-500">No entities available</p>
                  ) : (
                    availableEntities.map(entity => (
                      <button
                        key={`${entity._type}_${entity.id}`}
                        onClick={() => setSelectedEntity(entity)}
                        className={`w-full text-left p-2 rounded text-xs transition-colors ${
                          selectedEntity?.id === entity.id
                            ? "bg-purple-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <div className="font-semibold">{entity.name || entity.title}</div>
                        <div className="text-xs opacity-70">{entity._type}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <Button
                onClick={addLink}
                disabled={!selectedEntity}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Create Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {links.map(link => (
          <div
            key={link.id}
            className="flex items-center justify-between bg-slate-700/30 border border-purple-500/20 rounded p-2"
          >
            <div className="flex-1 min-w-0">
              <Badge variant="outline" className="text-xs capitalize mb-1">
                {link.link_type}
              </Badge>
              <p className="text-sm text-slate-300 truncate">{link.target_name}</p>
              <p className="text-xs text-slate-500">{link.target_type}</p>
            </div>
            <Button
              onClick={() => removeLink(link.id)}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 ml-2"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}

        {links.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-2">
            No linked entities yet. Create a link to connect this entity to others.
          </p>
        )}
      </div>
    </div>
  );
}