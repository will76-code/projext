import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Save, History, Lock, Unlock, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function RealtimeLoreEditor({ worldId, campaignId }) {
  const [selectedLore, setSelectedLore] = useState(null);
  const [content, setContent] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  const { data: loreEntries } = useQuery({
    queryKey: ['loreEntries', worldId],
    queryFn: async () => {
      try {
        const entries = await base44.entities.LoreEntry.filter({
          world_id: worldId,
          ...(campaignId && { campaign_id: campaignId })
        });
        return entries;
      } catch {
        return [];
      }
    },
    enabled: !!worldId,
    refetchInterval: 2000 // Real-time sync
  });

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    initialData: null
  });

  // Lock lore entry for real-time editing
  const lockLoreMutation = useMutation({
    mutationFn: (entryId) => base44.entities.LoreEntry.update(entryId, {
      locked_by: currentUser?.email,
      locked_at: new Date().toISOString()
    }),
    onSuccess: (data) => {
      setSelectedLore(data);
      setContent(data.content);
    }
  });

  // Unlock and save
  const saveLoreMutation = useMutation({
    mutationFn: async (entryData) => {
      const newVersion = (selectedLore?.version || 1) + 1;
      const newVersionEntry = {
        version_number: selectedLore?.version || 1,
        content: selectedLore?.content,
        edited_by: selectedLore?.last_edited_by || selectedLore?.author,
        edited_at: new Date().toISOString(),
        change_summary: changeSummary || "Updated"
      };

      const updatedEntry = await base44.entities.LoreEntry.update(selectedLore.id, {
        content: entryData.content,
        version: newVersion,
        versions: [...(selectedLore?.versions || []), newVersionEntry],
        last_edited_by: currentUser?.email,
        collaborators: [...new Set([...(selectedLore?.collaborators || []), currentUser?.email])],
        locked_by: null,
        locked_at: null
      });

      return updatedEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreEntries', worldId] });
      setSelectedLore(null);
      setContent("");
      setChangeSummary("");
      toast.success('Lore entry saved!');
    }
  });

  const unlockLoreMutation = useMutation({
    mutationFn: (entryId) => base44.entities.LoreEntry.update(entryId, {
      locked_by: null,
      locked_at: null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreEntries', worldId] });
      setSelectedLore(null);
      setContent("");
      toast.info('Entry unlocked');
    }
  });

  const approveLoreMutation = useMutation({
    mutationFn: (entryId) => base44.entities.LoreEntry.update(entryId, {
      is_approved: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreEntries', worldId] });
      toast.success('Lore approved by GM!');
    }
  });

  const revertVersionMutation = useMutation({
    mutationFn: async (versionNumber) => {
      const oldVersion = selectedLore?.versions?.find(v => v.version_number === versionNumber);
      if (!oldVersion) return;

      return base44.entities.LoreEntry.update(selectedLore.id, {
        content: oldVersion.content,
        version: selectedLore.version + 1,
        versions: [...selectedLore.versions, {
          version_number: selectedLore.version,
          content: selectedLore.content,
          edited_by: currentUser?.email,
          edited_at: new Date().toISOString(),
          change_summary: `Reverted to v${versionNumber}`
        }],
        last_edited_by: currentUser?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreEntries', worldId] });
      toast.success('Version restored!');
    }
  });

  const isEditing = selectedLore && selectedLore.locked_by === currentUser?.email;
  const isLockedByOther = selectedLore && selectedLore.locked_by && selectedLore.locked_by !== currentUser?.email;

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Collaborative Lore Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedLore ? (
          <>
            {/* Lore List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loreEntries?.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-slate-300">{entry.title}</h5>
                      <p className="text-xs text-slate-500">by {entry.author} • v{entry.version}</p>
                    </div>
                    <div className="flex gap-1">
                      {entry.is_approved && <Badge className="bg-green-600 text-xs">✓</Badge>}
                      {entry.locked_by && (
                        <Badge className="bg-yellow-600 text-xs">
                          🔒 {entry.locked_by === currentUser?.email ? 'You' : 'Other'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 line-clamp-2">{entry.content}</p>

                  <div className="flex gap-2 pt-2 border-t border-slate-500/30">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-purple-500/50"
                      onClick={() => lockLoreMutation.mutate(entry.id)}
                      disabled={isLockedByOther || lockLoreMutation.isPending}
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-500/50"
                          onClick={() => setSelectedLore(entry)}
                        >
                          <History className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-slate-900 border-purple-500/30">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-purple-300">Version History</h3>
                          {entry.versions?.map((v, i) => (
                            <div key={i} className="bg-slate-800/50 border border-slate-600 rounded p-2 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-300">v{v.version_number}</p>
                                <p className="text-xs text-slate-500">{v.edited_by}</p>
                              </div>
                              <p className="text-xs text-slate-400">{v.change_summary}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => revertVersionMutation.mutate(v.version_number)}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Restore
                              </Button>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    {currentUser?.role === 'admin' && !entry.is_approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500/50 text-green-400"
                        onClick={() => approveLoreMutation.mutate(entry.id)}
                        disabled={approveLoreMutation.isPending}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!loreEntries?.length && (
              <p className="text-sm text-slate-400 text-center py-6">No lore entries yet.</p>
            )}
          </>
        ) : (
          <>
            {/* Editor View */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-300">{selectedLore.title}</h4>
                {isLockedByOther && (
                  <Badge className="bg-yellow-600">🔒 Locked by {selectedLore.locked_by}</Badge>
                )}
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!isEditing}
                className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-3 text-sm text-slate-200 disabled:opacity-50 min-h-64"
                placeholder="Edit lore content..."
              />

              {isEditing && (
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="What changed? (optional)"
                  className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-2 text-sm text-slate-200"
                />
              )}

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={() => saveLoreMutation.mutate({ content })}
                      disabled={saveLoreMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {saveLoreMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save
                    </Button>
                    <Button
                      onClick={() => unlockLoreMutation.mutate(selectedLore.id)}
                      variant="outline"
                      className="border-red-500/50"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setSelectedLore(null)}
                    variant="outline"
                    className="w-full border-purple-500/50"
                  >
                    Back to List
                  </Button>
                )}
              </div>

              {selectedLore.collaborators?.length > 0 && (
                <p className="text-xs text-slate-500">
                  Edited by: {selectedLore.collaborators.join(', ')}
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}