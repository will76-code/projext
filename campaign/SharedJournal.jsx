import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

export default function SharedJournal({ campaignId }) {
  const queryClient = useQueryClient();
  const [newEntry, setNewEntry] = useState("");
  const [entryType, setEntryType] = useState("event");

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: entries } = useQuery({
    queryKey: ['journal', campaignId],
    queryFn: () => base44.entities.CampaignJournal.filter({ campaign_id: campaignId }, '-created_date'),
    initialData: []
  });

  const addEntryMutation = useMutation({
    mutationFn: async (data) => {
      const campaign = await base44.entities.Campaign.filter({ id: campaignId });
      const world = await base44.entities.World.filter({ id: campaign[0]?.world_id });
      const rulebooks = world[0]?.unique_mechanics?.rulebook_ids 
        ? await base44.entities.Rulebook.filter({ id: { $in: world[0].unique_mechanics.rulebook_ids } })
        : [];
      
      // AI links entry to rulebook data and world evolution
      let aiEnhancement = "";
      if (rulebooks.length > 0) {
        const worldEvolution = await base44.entities.WorldEvolution.filter({ world_id: world[0].id }).catch(() => []);
        
        aiEnhancement = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this campaign journal entry and find connections to world lore:

Entry: ${data.content}
Available Rulebooks: ${rulebooks.map(r => r.title).join(', ')}
World Evolution: ${JSON.stringify(worldEvolution[0]?.emergent_lore?.slice(0, 5) || [])}

Return relevant lore connections, historical parallels, or rulebook references (2-3 sentences).`,
          add_context_from_internet: false
        }).catch(() => "");
      }
      
      return await base44.entities.CampaignJournal.create({
        ...data,
        content: aiEnhancement ? `${data.content}\n\n📖 Lore Connection: ${aiEnhancement}` : data.content
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', campaignId] });
      setNewEntry("");
      toast.success("Journal entry added with lore links!");
    }
  });

  const upvoteMutation = useMutation({
    mutationFn: ({ id, upvotes }) => base44.entities.CampaignJournal.update(id, { upvotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', campaignId] });
    }
  });

  const handleUpvote = (entry) => {
    const upvotes = entry.upvotes || [];
    if (upvotes.includes(user.email)) {
      upvoteMutation.mutate({ id: entry.id, upvotes: upvotes.filter(e => e !== user.email) });
    } else {
      upvoteMutation.mutate({ id: entry.id, upvotes: [...upvotes, user.email] });
    }
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Shared Campaign Journal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <select
            value={entryType}
            onChange={(e) => setEntryType(e.target.value)}
            className="w-full px-3 py-2 rounded bg-slate-700/50 border border-purple-500/30 text-white text-sm"
          >
            <option value="event">Event</option>
            <option value="discovery">Discovery</option>
            <option value="decision">Decision</option>
            <option value="note">Note</option>
          </select>

          <Textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="Log an event, discovery, or note..."
            className="bg-slate-700/50 border-purple-500/30 text-white resize-none"
            rows={3}
          />

          <Button
            onClick={() => addEntryMutation.mutate({
              campaign_id: campaignId,
              entry_type: entryType,
              content: newEntry,
              logged_by: user.email
            })}
            disabled={!newEntry.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-slate-700/30 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <Badge className={
                  entry.entry_type === 'event' ? 'bg-blue-600' :
                  entry.entry_type === 'discovery' ? 'bg-green-600' :
                  entry.entry_type === 'decision' ? 'bg-yellow-600' : 'bg-slate-600'
                }>
                  {entry.entry_type}
                </Badge>
                <span className="text-xs text-purple-400">
                  {entry.logged_by?.split('@')[0]}
                </span>
              </div>
              <p className="text-sm text-white mb-2">{entry.content}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpvote(entry)}
                className={`text-xs ${(entry.upvotes || []).includes(user?.email) ? 'text-purple-400' : 'text-slate-400'}`}
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                {(entry.upvotes || []).length}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}