import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PassageLinkingEditor({ loreEntryId, worldId, content }) {
  const queryClient = useQueryClient();
  const contentRef = useRef(null);
  const [selectedText, setSelectedText] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [relationshipType, setRelationshipType] = useState("mentions");
  const [selectedEntity, setSelectedEntity] = useState(null);

  const { data: loreEntry } = useQuery({
    queryKey: ['loreEntry', loreEntryId],
    queryFn: () => base44.entities.LoreEntry.read(loreEntryId),
    enabled: !!loreEntryId
  });

  const { data: passageLinks = [] } = useQuery({
    queryKey: ['passageLinks', loreEntryId],
    queryFn: () => loreEntry?.passage_links || [],
    enabled: !!loreEntry
  });

  const { data: availableEntities = [] } = useQuery({
    queryKey: ['availableEntitiesForPassageLinking', worldId],
    queryFn: async () => {
      const results = [];
      try {
        const [characters, locations, loreEntries, timelineEvents] = await Promise.all([
          base44.entities.Character?.filter({ world_id: worldId }) || [],
          base44.entities.CampaignLocation?.filter({ world_id: worldId }) || [],
          base44.entities.LoreEntry?.filter({ world_id: worldId }) || [],
          base44.entities.SessionRecap?.filter({}) || []
        ]);

        (characters || []).forEach(e => results.push({ ...e, type: 'Character', label: e.name }));
        (locations || []).forEach(e => results.push({ ...e, type: 'CampaignLocation', label: e.name }));
        (loreEntries || []).filter(e => e.id !== loreEntryId).forEach(e => results.push({ ...e, type: 'LoreEntry', label: e.title }));
        (timelineEvents || []).forEach(e => results.push({ ...e, type: 'SessionRecap', label: e.title }));
      } catch (e) {
        console.error("Error fetching entities:", e);
      }
      return results;
    },
    enabled: !!worldId && !!loreEntry
  });

  const linkPassageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedText || !selectedEntity) {
        toast.error("Select text and entity");
        return;
      }

      const newLink = {
        passage_text: selectedText,
        entity_id: selectedEntity.id,
        entity_type: selectedEntity.type,
        relationship_type: relationshipType,
        timestamp: new Date().toISOString()
      };

      const currentLinks = loreEntry.passage_links || [];
      await base44.entities.LoreEntry.update(loreEntryId, {
        passage_links: [...currentLinks, newLink]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreEntry', loreEntryId] });
      queryClient.invalidateQueries({ queryKey: ['passageLinks', loreEntryId] });
      toast.success("Passage linked");
      setLinkDialogOpen(false);
      setSelectedText("");
      setSelectedEntity(null);
      setRelationshipType("mentions");
    }
  });

  const unlinkPassageMutation = useMutation({
    mutationFn: async (linkIndex) => {
      const newLinks = passageLinks.filter((_, i) => i !== linkIndex);
      await base44.entities.LoreEntry.update(loreEntryId, {
        passage_links: newLinks
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreEntry', loreEntryId] });
      queryClient.invalidateQueries({ queryKey: ['passageLinks', loreEntryId] });
      toast.success("Link removed");
    }
  });

  const handleTextSelect = () => {
    const selection = window.getSelection().toString();
    if (selection) {
      setSelectedText(selection);
      setLinkDialogOpen(true);
    }
  };

  const filteredEntities = availableEntities.filter(e =>
    e.label?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const relationshipTypes = ["mentions", "relates_to", "conflicts_with", "allies_with", "caused_by", "influences"];

  const renderContentWithHighlights = () => {
    let html = content || "";
    passageLinks.forEach(link => {
      const regex = new RegExp(`(${link.passage_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
      html = html.replace(regex, `<mark class="bg-cyan-800/50 border border-cyan-500 px-1 rounded cursor-help" title="${link.entity_type}: ${link.relationship_type}">$1</mark>`);
    });
    return html;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-700/30 border-slate-600">
        <CardHeader>
          <CardTitle className="text-sm text-slate-300">Linked Passages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            ref={contentRef}
            onMouseUp={handleTextSelect}
            className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed p-3 bg-slate-800/30 rounded border border-slate-600 cursor-text select-text"
            dangerouslySetInnerHTML={{ __html: renderContentWithHighlights() }}
          />

          <p className="text-xs text-slate-400">
            Select text above to link to entities. <strong>Highlighted text</strong> is already linked.
          </p>

          {passageLinks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-600">
              <h4 className="text-xs font-semibold text-slate-400">Active Links</h4>
              {passageLinks.map((link, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-slate-800/30 border border-slate-600 text-xs"
                >
                  <div className="flex-1">
                    <p className="text-slate-300 italic">"{link.passage_text}"</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{link.entity_type}</Badge>
                      <Badge className="bg-cyan-900/50 text-cyan-300 text-xs">{link.relationship_type}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unlinkPassageMutation.mutate(idx)}
                    disabled={unlinkPassageMutation.isPending}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Link Passage to Entity</DialogTitle>
            {selectedText && (
              <p className="text-sm text-slate-400 mt-2">Selected: <em>"{selectedText}"</em></p>
            )}
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-slate-300 mb-1 block">Entity</label>
              <Input
                placeholder="Search NPCs, locations, factions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-700/50 border-slate-600 mb-2"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredEntities.map(entity => (
                  <button
                    key={`${entity.type}-${entity.id}`}
                    onClick={() => setSelectedEntity(entity)}
                    className={`w-full text-left p-2 rounded transition-colors text-sm ${
                      selectedEntity?.id === entity.id && selectedEntity?.type === entity.type
                        ? 'bg-cyan-900/50 border border-cyan-500'
                        : 'bg-slate-700/30 hover:bg-slate-700/50'
                    }`}
                  >
                    <p className="text-slate-200">{entity.label}</p>
                    <p className="text-xs text-slate-500">{entity.type}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-1 block">Relationship</label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-slate-300"
              >
                {relationshipTypes.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => linkPassageMutation.mutate()}
              disabled={!selectedText || !selectedEntity || linkPassageMutation.isPending}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {linkPassageMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Link Passage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}