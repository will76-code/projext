import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Vote, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ActionVoting({ campaignId, campaignContext = "" }) {
  const queryClient = useQueryClient();
  const [proposedAction, setProposedAction] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: votes } = useQuery({
    queryKey: ['votes', campaignId],
    queryFn: () => base44.entities.ActionVote.filter({ campaign_id: campaignId, status: 'active' }),
    initialData: []
  });

  const proposeMutation = useMutation({
    mutationFn: async (action) => {
      setGeneratingAI(true);
      const aiSuggestion = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this proposed action for a tabletop RPG campaign:
        
Action: "${action}"
Context: ${campaignContext}

Provide brief tactical analysis: potential risks, benefits, and alternative approaches.`,
        add_context_from_internet: false
      });

      const vote = await base44.entities.ActionVote.create({
        campaign_id: campaignId,
        action_description: action,
        proposed_by: user.email,
        votes: [{ user_email: user.email, vote: 'yes' }],
        ai_suggestion: aiSuggestion,
        status: 'active'
      });

      setGeneratingAI(false);
      return vote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', campaignId] });
      setProposedAction("");
      toast.success("Action proposed!");
    }
  });

  const resolveVoteMutation = useMutation({
    mutationFn: async (voteId) => {
      const vote = votes.find(v => v.id === voteId);
      const counts = getVoteCounts(vote.votes || []);
      
      // Generate AI compromise if vote is split
      let resolution = "";
      if (counts.yes && counts.no && Math.abs(counts.yes - counts.no) <= 2) {
        resolution = await base44.integrations.Core.InvokeLLM({
          prompt: `Votes are split on this action. Suggest a compromise:

Action: ${vote.action_description}
Yes votes: ${counts.yes}, No votes: ${counts.no}
AI Analysis: ${vote.ai_suggestion}

Provide a middle-ground solution that respects both sides.`,
          add_context_from_internet: false
        });
      } else {
        const majority = counts.yes > counts.no ? 'approved' : 'rejected';
        resolution = `Group ${majority} this action (${counts.yes} yes, ${counts.no} no)`;
      }

      // Update vote status
      await base44.entities.ActionVote.update(voteId, { status: 'executed' });

      // Auto-log to shared journal
      await base44.entities.CampaignJournal.create({
        campaign_id: campaignId,
        entry_type: 'decision',
        content: `${vote.action_description}\n\nResolution: ${resolution}`,
        logged_by: 'AI Moderator'
      });

      return resolution;
    },
    onSuccess: (resolution) => {
      queryClient.invalidateQueries({ queryKey: ['votes', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['journal', campaignId] });
      toast.success("Vote resolved and logged!");
    }
  });

  const castVoteMutation = useMutation({
    mutationFn: ({ voteId, currentVotes, voteValue }) => {
      const updated = currentVotes.filter(v => v.user_email !== user.email);
      updated.push({ user_email: user.email, vote: voteValue });
      return base44.entities.ActionVote.update(voteId, { votes: updated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', campaignId] });
    }
  });

  const getVoteCounts = (votes) => {
    return votes.reduce((acc, v) => {
      acc[v.vote] = (acc[v.vote] || 0) + 1;
      return acc;
    }, {});
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Vote className="w-5 h-5" />
          Action Voting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={proposedAction}
            onChange={(e) => setProposedAction(e.target.value)}
            placeholder="Propose next action (e.g., 'Investigate the abandoned temple')"
            className="bg-slate-700/50 border-purple-500/30 text-white resize-none"
            rows={2}
          />
          <Button
            onClick={() => proposeMutation.mutate(proposedAction)}
            disabled={!proposedAction.trim() || generatingAI}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generatingAI ? 'Getting AI Analysis...' : 'Propose Action'}
          </Button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {votes.map((vote) => {
            const counts = getVoteCounts(vote.votes || []);
            const userVote = vote.votes?.find(v => v.user_email === user?.email);

            return (
              <div key={vote.id} className="bg-slate-700/30 rounded-lg p-3">
                <div className="mb-2">
                  <p className="text-sm text-white font-semibold mb-1">{vote.action_description}</p>
                  <p className="text-xs text-purple-400">Proposed by {vote.proposed_by.split('@')[0]}</p>
                </div>

                {vote.ai_suggestion && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded p-2 mb-3 text-xs text-purple-200">
                    <p className="font-semibold text-purple-300 mb-1">AI Analysis:</p>
                    <p>{vote.ai_suggestion}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-600">{counts.yes || 0} Yes</Badge>
                  <Badge className="bg-red-600">{counts.no || 0} No</Badge>
                  <Badge className="bg-slate-600">{counts.abstain || 0} Abstain</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={userVote?.vote === 'yes' ? 'default' : 'outline'}
                      onClick={() => castVoteMutation.mutate({
                        voteId: vote.id,
                        currentVotes: vote.votes || [],
                        voteValue: 'yes'
                      })}
                      className="flex-1"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={userVote?.vote === 'no' ? 'default' : 'outline'}
                      onClick={() => castVoteMutation.mutate({
                        voteId: vote.id,
                        currentVotes: vote.votes || [],
                        voteValue: 'no'
                      })}
                      className="flex-1"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      No
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveVoteMutation.mutate(vote.id)}
                    className="w-full text-purple-400 border-purple-500/30"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Resolve Vote (AI Moderated)
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}