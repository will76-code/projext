import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Link as LinkIcon, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function LinkedEntitiesViewer({ loreEntryId, worldId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [relationshipType, setRelationshipType] = useState("related");

  const { data: loreEntry } = useQuery({
    queryKey: ['loreEntry', loreEntryId],
    queryFn: () => base44.entities.LoreEntry.read(loreEntryId),
    enabled: !!loreEntryId
  });

  const { data: linkedEntities = [] } = useQuery({
    queryKey: ['linkedEntities', loreEntryId],
    queryFn: async () => {
      if (!loreEntry?.linked_entities) return [];
      const entities = [];
      for (const link of loreEntry.linked_entities) {
        try {
          const entity = await base44.entities[link.entity_type]?.read(link.entity_id);
          if (entity) entities.push({ ...entity, linkType: link.relationship_type });
        } catch (e) {
          // Entity not found
        }
      }
      return entities;
    },
    enabled: !!loreEntry
  });

  const { data: availableEntities = [] } = useQuery({
    queryKey: ['availableEntitiesForLinking', worldId],
    queryFn: async () => {
      const [npcs, locations, factions, loreEntries] = await Promise.all([
        base44.entities.Character?.filter({ world_id: worldId }) || [],
        base44.entities.CampaignLocation?.filter({ world_id: worldId }) || [],
        base44.entities.Faction?.filter({ world_id: worldId }) || [],
        base44.entities.LoreEntry?.filter({ world_id: worldId }) || []
      ]);
      
      return [
        ...(npcs || []).map(e => ({ ...e, type: 'Character', label: e.name })),
        ...(locations || []).map(e => ({ ...e, type: 'CampaignLocation', label: e.name })),
        ...(factions || []).map(e => ({ ...e, type: 'Faction', label: e.name })),
        ...(loreEntries || []).filter(e => e.id !== loreEntryId).map(e => ({ ...e, type: 'LoreEntry', label: e.title }))
      ];
    },
    enabled: !!worldId && !!loreEntry
  });

  const linkMutation = useMutation({
    mutationFn: async (entity) => {
      const currentLinks = loreEntry.linked_entities || [];
      const newLink = {
        entity_id: entity.id,
        entity_type: entity.type,
        relationship_type: relationshipType
      };
      
      if (!currentLinks.find(l => l.entity_id === entity.id && l.entity_type === entity.type)) {
        await base44.entities.LoreEntry.update(loreEntryId, {
          linked_entities: [...currentLinks, newLink]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreEntry', loreEntryId] });
      queryClient.invalidateQueries({ queryKey: ['linkedEntities', loreEntryId] });
      toast.success("Entity linked");
      setOpen(false);
      setSelectedEntity(null);
      setRelationshipType("related");
    }
  });

  const unlinkMutation = useMutation({
    mutationFn: async (entityId, entityType) => {
      const newLinks = (loreEntry.linked_entities || []).filter(
        l => !(l.entity_id === entityId && l.entity_type === entityType)
      );
      await base44.entities.LoreEntry.update(loreEntryId, {
        linked_entities: newLinks
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreEntry', loreEntryId] });
      queryClient.invalidateQueries({ queryKey: ['linkedEntities', loreEntryId] });
      toast.success("Entity unlinked");
    }
  });

  const filteredAvailable = availableEntities.filter(e =>
    e.label?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !linkedEntities.find(le => le.id === e.id && le.type === e.type)
  );

  const relationshipTypes = [
    "mentions",
    "related_to",
    "causes",
    "caused_by",
    "conflicts_with",
    "allies_with",
    "derived_from",
    "influences"
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-slate-700/30 border-slate-600">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-cyan-300 flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Linked Entities
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-2" />
                Link Entity
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
              <DialogHeader>
                <DialogTitle>Link Entity to Lore Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">
                    Search Entity
                  </label>
                  <Input
                    placeholder="Search NPCs, locations, factions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">
                    Relationship Type
                  </label>
                  <select
                    value={relationshipType}
                    onChange={(e) => setRelationshipType(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-slate-300 text-sm"
                  >
                    {relationshipTypes.map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredAvailable.length === 0 ? (
                    <p className="text-slate-400 text-sm">No entities found</p>
                  ) : (
                    filteredAvailable.map(entity => (
                      <button
                        key={`${entity.type}-${entity.id}`}
                        onClick={() => linkMutation.mutate(entity)}
                        disabled={linkMutation.isPending}
                        className="w-full text-left p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-200">{entity.label}</p>
                            <Badge variant="outline" className="text-xs mt-1">{entity.type}</Badge>
                          </div>
                          {linkMutation.isPending && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {linkedEntities.length === 0 ? (
            <p className="text-slate-400 text-sm">No linked entities yet</p>
          ) : (
            <div className="space-y-2">
              {linkedEntities.map((entity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 border border-slate-600"
                >
                  <div>
                    <p className="font-semibold text-slate-200">{entity.name || entity.title}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {entity.type}
                      </Badge>
                      <Badge className="bg-cyan-900/50 text-cyan-300 text-xs">
                        {entity.linkType}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unlinkMutation.mutate(entity.id, entity.type)}
                    disabled={unlinkMutation.isPending}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}