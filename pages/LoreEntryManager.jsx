import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Search, Trash2, Eye, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import BulkActions from "@/components/entities/BulkActions";
import SavedViewManager from "@/components/entities/SavedViewManager";
import RelationshipEditor from "@/components/entities/RelationshipEditor";
import RichLoreEditor from "@/components/lore/RichLoreEditor";
import AILoreGenerator from "@/components/ai/AILoreGenerator";
import EntityLinker from "@/components/entities/EntityLinker";
import LinkedEntitiesViewer from "@/components/lore/LinkedEntitiesViewer";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function LoreEntryManager() {
  const urlParams = new URLSearchParams(window.location.search);
  const worldId = urlParams.get('worldId');
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_date");
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingEntryForLinks, setEditingEntryForLinks] = useState(null);

  const { data: loreEntries, isLoading } = useQuery({
    queryKey: ['lore', worldId, categoryFilter, statusFilter],
    queryFn: async () => {
      let query = { world_id: worldId };
      if (categoryFilter !== "all") query.category = categoryFilter;
      if (statusFilter !== "all") query.is_approved = statusFilter === "approved";
      
      return await base44.entities.LoreEntry.filter(query);
    },
    enabled: !!worldId
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.LoreEntry.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lore', worldId] });
      setSelectedIds([]);
      toast.success("Entries deleted");
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.LoreEntry.update(id, { is_approved: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lore', worldId] });
      setSelectedIds([]);
      toast.success("Entries approved");
    }
  });

  const handleBulkDelete = async (ids) => {
    await deleteMutation.mutateAsync(ids);
  };

  const handleBulkApprove = async (ids) => {
    await approveMutation.mutateAsync(ids);
  };

  const filteredEntries = (loreEntries || [])
    .filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "created_date") return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredEntries.map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectEntry = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const handleLoadView = useCallback((filters, sort) => {
    if (filters.category) setCategoryFilter(filters.category);
    if (filters.status) setStatusFilter(filters.status);
    if (sort.sortBy) setSortBy(sort.sortBy);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
         <div className="flex items-center justify-between">
           <h1 className="text-3xl font-bold text-purple-300">Lore Entries</h1>
           <div className="flex gap-2">
             <AILoreGenerator 
               worldId={worldId}
               worldName="Unknown World"
               onLoreGenerated={() => queryClient.invalidateQueries({ queryKey: ['lore', worldId] })}
             />
             <Link to={`/LoreBuilder?worldId=${worldId}`}>
               <Button className="bg-purple-600 hover:bg-purple-700">
                 <Plus className="w-4 h-4 mr-2" />
                 New Entry
               </Button>
             </Link>
           </div>
         </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <BulkActions
            selectedIds={selectedIds}
            onDelete={handleBulkDelete}
            onStatusChange={handleBulkApprove}
            isDeleting={deleteMutation.isPending}
            statusOptions={["approved", "pending"]}
          />
        )}

        {/* Filters & Views */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700/50 border-slate-600"
                  prefix={<Search className="w-4 h-4" />}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-sm bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-slate-300"
              >
                <option value="all">All Categories</option>
                <option value="history">History</option>
                <option value="culture">Culture</option>
                <option value="location">Location</option>
                <option value="faction">Faction</option>
                <option value="character">Character</option>
                <option value="magic">Magic</option>
                <option value="custom">Custom</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-slate-300"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-slate-300"
              >
                <option value="created_date">Newest First</option>
                <option value="title">A-Z</option>
              </select>
            </div>

            <SavedViewManager
              entityType="lore_entries"
              currentFilters={{ category: categoryFilter, status: statusFilter }}
              currentSort={{ sortBy }}
              onLoadView={handleLoadView}
            />
          </CardContent>
        </Card>

        {/* Entries List */}
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEntries.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-8 text-center text-slate-400">
                  No lore entries found
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Select All */}
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={selectedIds.length === filteredEntries.length && filteredEntries.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-xs text-slate-400">
                    {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
                  </span>
                </div>

                {filteredEntries.map((entry) => (
                   <Card key={entry.id} className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
                     <CardContent className="p-4">
                       <div className="flex items-center gap-4 mb-3">
                      <Checkbox
                        checked={selectedIds.includes(entry.id)}
                        onCheckedChange={(checked) => handleSelectEntry(entry.id, checked)}
                      />

                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-200">{entry.title}</h3>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {entry.category}
                          </Badge>
                          {entry.is_approved && (
                            <Badge className="bg-green-900/50 text-green-300 text-xs">
                              ✓ Approved
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingEntry(entry)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingEntryForLinks(entry)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      </div>
                      </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* Edit Entry Dialog */}
         {editingEntry && (
           <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
             <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-96 overflow-y-auto">
               <RichLoreEditor
                 entryId={editingEntry.id}
                 initialContent={editingEntry.content}
                 initialTitle={editingEntry.title}
                 worldId={worldId}
                 onSave={(updated) => {
                   queryClient.invalidateQueries({ queryKey: ['lore', worldId] });
                   setEditingEntry(null);
                 }}
               />
             </DialogContent>
           </Dialog>
         )}

         {/* Link Entities Dialog */}
         {editingEntryForLinks && (
           <Dialog open={!!editingEntryForLinks} onOpenChange={(open) => !open && setEditingEntryForLinks(null)}>
             <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-96 overflow-y-auto">
               <LinkedEntitiesViewer
                 loreEntryId={editingEntryForLinks.id}
                 worldId={worldId}
               />
             </DialogContent>
           </Dialog>
         )}
      </div>
    </div>
  );
}