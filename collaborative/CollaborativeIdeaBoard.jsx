import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Lightbulb, Trash2, Heart, MessageCircle, Loader2, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function CollaborativeIdeaBoard({ campaignId, worldId }) {
  const [newIdea, setNewIdea] = useState("");
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();

  // Create IdeaBoard entity if not exists
  const { data: ideas } = useQuery({
    queryKey: ['ideas', campaignId || worldId],
    queryFn: async () => {
      try {
        const allIdeas = await base44.entities.IdeaBoard.filter({
          [campaignId ? 'campaign_id' : 'world_id']: campaignId || worldId
        });
        return allIdeas.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      } catch {
        return [];
      }
    },
    enabled: !!(campaignId || worldId)
  });

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    initialData: null
  });

  const createIdeaMutation = useMutation({
    mutationFn: (content) => base44.entities.IdeaBoard.create({
      [campaignId ? 'campaign_id' : 'world_id']: campaignId || worldId,
      content,
      submitted_by: currentUser?.email,
      likes: [],
      comments: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', campaignId || worldId] });
      setNewIdea("");
      toast.success('Idea posted!');
    }
  });

  const updateIdeaMutation = useMutation({
    mutationFn: ({ id, content }) => base44.entities.IdeaBoard.update(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', campaignId || worldId] });
      setEditingId(null);
      toast.success('Idea updated!');
    }
  });

  const likeIdeaMutation = useMutation({
    mutationFn: async (idea) => {
      const likes = idea.likes || [];
      const hasLiked = likes.includes(currentUser?.email);
      const newLikes = hasLiked ? likes.filter(e => e !== currentUser?.email) : [...likes, currentUser?.email];
      return base44.entities.IdeaBoard.update(idea.id, { likes: newLikes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', campaignId || worldId] });
    }
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: (id) => base44.entities.IdeaBoard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', campaignId || worldId] });
      toast.success('Idea deleted');
    }
  });

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Collaborative Idea Board
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Idea Input */}
        <div className="space-y-2">
          <textarea
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Share your world-building ideas..."
            className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            rows={3}
          />
          <Button
            onClick={() => createIdeaMutation.mutate(newIdea)}
            disabled={createIdeaMutation.isPending || !newIdea.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {createIdeaMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
            Post Idea
          </Button>
        </div>

        {/* Ideas List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {ideas?.map((idea) => {
            const hasLiked = idea.likes?.includes(currentUser?.email);
            const isOwner = idea.submitted_by === currentUser?.email;

            return (
              <div key={idea.id} className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingId === idea.id ? (
                      <textarea
                        value={idea.content}
                        onChange={(e) => {
                          const updated = ideas.map(i => i.id === idea.id ? {...i, content: e.target.value} : i);
                          // Local state update
                        }}
                        className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-2 text-sm text-slate-200"
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm text-slate-300">{idea.content}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">by {idea.submitted_by}</p>
                  </div>
                  {isOwner && (
                    <div className="flex gap-1">
                      {editingId === idea.id ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/50"
                          onClick={() => updateIdeaMutation.mutate({ id: idea.id, content: idea.content })}
                        >
                          Save
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(idea.id)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteIdeaMutation.mutate(idea.id)}>
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Interactions */}
                <div className="flex gap-3 pt-2 border-t border-slate-500/30">
                  <button
                    onClick={() => likeIdeaMutation.mutate(idea)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-pink-400"
                  >
                    <Heart className={`w-4 h-4 ${hasLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
                    {idea.likes?.length || 0}
                  </button>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MessageCircle className="w-4 h-4" />
                    {idea.comments?.length || 0}
                  </div>
                </div>
              </div>
            );
          })}
          {!ideas?.length && (
            <p className="text-sm text-slate-400 text-center py-4">No ideas yet. Share your first one!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}