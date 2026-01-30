import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Lightbulb, Vote } from "lucide-react";
import { toast } from "sonner";

export default function ActionVoteModerator({ campaignId }) {
  const queryClient = useQueryClient();
  const [selectedVote, setSelectedVote] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const { data: votes } = useQuery({
    queryKey: ['actionVotes', campaignId],
    queryFn: () => base44.entities.ActionVote.filter({ campaign_id: campaignId }),
    enabled: !!campaignId
  });

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const campaigns = await base44.entities.Campaign.filter({ id: campaignId });
      return campaigns[0];
    },
    enabled: !!campaignId
  });

  const updateVoteMutation = useMutation({
    mutationFn: (data) => base44.entities.ActionVote.update(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionVotes', campaignId] });
      toast.success('Vote resolved!');
    }
  });

  const createJournalMutation = useMutation({
    mutationFn: (data) => base44.entities.CampaignJournal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals', campaignId] });
    }
  });

  const moderateVote = async (vote) => {
    setSelectedVote(vote);
    setIsProcessing(true);
    setSuggestion(null);

    try {
      const voteResults = {
        yes: vote.votes.filter(v => v.vote === 'yes').length,
        no: vote.votes.filter(v => v.vote === 'no').length,
        abstain: vote.votes.filter(v => v.vote === 'abstain').length
      };

      const suggestion = await base44.integrations.Core.InvokeLLM({
        prompt: `Moderate an action vote for a D&D campaign:

Action Proposed: ${vote.action_description}
Campaign: ${campaign?.title}
Current Scene: ${campaign?.current_scene}
Story Summary: ${campaign?.story_summary}

Vote Results:
- Yes: ${voteResults.yes}
- No: ${voteResults.no}
- Abstain: ${voteResults.abstain}

Analyze the vote and suggest:
1. The most narratively coherent resolution
2. A compromise that honors both majority and minority preferences (if split)
3. How this decision impacts the story
4. What narrative consequences should occur`,
        response_json_schema: {
          type: "object",
          properties: {
            resolution: { type: "string" },
            vote_interpretation: { type: "string" },
            compromise_option: { type: "string" },
            narrative_impact: { type: "string" },
            story_consequences: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setSuggestion(suggestion);
    } catch (error) {
      toast.error('Failed to moderate vote');
    }
    setIsProcessing(false);
  };

  const resolveVote = async (resolution, journalEntry) => {
    try {
      // Update vote status
      await updateVoteMutation.mutateAsync({
        id: selectedVote.id,
        updates: {
          status: 'approved',
          ai_suggestion: resolution
        }
      });

      // Create journal entry
      await createJournalMutation.mutateAsync({
        campaign_id: campaignId,
        entry_type: 'decision',
        content: journalEntry,
        logged_by: 'AI_Moderator'
      });

      setSuggestion(null);
      setSelectedVote(null);
    } catch (error) {
      toast.error('Failed to resolve vote');
    }
  };

  const activeVotes = votes?.filter(v => v.status === 'active') || [];

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Vote className="w-5 h-5" />
          Action Vote Moderator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeVotes.length === 0 ? (
          <p className="text-sm text-slate-400">No active votes</p>
        ) : (
          <div className="space-y-3">
            {activeVotes.map((vote) => (
              <div key={vote.id} className="bg-slate-700/30 border border-purple-500/20 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-purple-300">{vote.action_description}</p>
                    <p className="text-xs text-slate-400 mt-1">Proposed by: {vote.proposed_by}</p>
                  </div>
                  <Badge className={
                    vote.votes.filter(v => v.vote === 'yes').length > vote.votes.filter(v => v.vote === 'no').length
                      ? 'bg-green-600' : 'bg-red-600'
                  }>
                    {vote.votes.filter(v => v.vote === 'yes').length}Y / {vote.votes.filter(v => v.vote === 'no').length}N
                  </Badge>
                </div>

                {selectedVote?.id === vote.id && suggestion ? (
                  <div className="bg-indigo-900/30 border border-indigo-500/30 rounded p-3 mt-2 space-y-2">
                    <h5 className="font-semibold text-indigo-300 text-sm">📋 AI Resolution Suggestion</h5>
                    <div className="space-y-2 text-xs text-white">
                      <div>
                        <p className="text-indigo-400 font-semibold mb-1">Resolution:</p>
                        <p>{suggestion.resolution}</p>
                      </div>
                      <div>
                        <p className="text-indigo-400 font-semibold mb-1">Interpretation:</p>
                        <p>{suggestion.vote_interpretation}</p>
                      </div>
                      {suggestion.compromise_option && (
                        <div>
                          <p className="text-yellow-400 font-semibold mb-1">💡 Compromise Option:</p>
                          <p>{suggestion.compromise_option}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-purple-400 font-semibold mb-1">Story Impact:</p>
                        <p>{suggestion.narrative_impact}</p>
                      </div>
                      {suggestion.story_consequences?.length > 0 && (
                        <div>
                          <p className="text-orange-400 font-semibold mb-1">Consequences:</p>
                          <ul className="ml-3 list-disc">
                            {suggestion.story_consequences.map((c, i) => (
                              <li key={i} className="text-orange-300">{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => resolveVote(suggestion.resolution, `Vote Resolved: ${suggestion.resolution}\n\nNarrative Impact: ${suggestion.narrative_impact}`)}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approve Resolution
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSuggestion(null);
                          setSelectedVote(null);
                        }}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => moderateVote(vote)}
                    disabled={isProcessing}
                    className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
                  >
                    {isProcessing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Lightbulb className="w-3 h-3 mr-1" />}
                    Get AI Moderation
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}