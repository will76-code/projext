import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, Loader2, ThumbsUp, ThumbsDown, Settings } from "lucide-react";
import { toast } from "sonner";

export default function EnhancedWorldStateVoting({ worldId, campaignId }) {
  const [proposalText, setProposalText] = useState("");
  const [proposalType, setProposalType] = useState("world_change");
  const [votingThreshold, setVotingThreshold] = useState(60);
  const [showThresholdSettings, setShowThresholdSettings] = useState(false);
  const queryClient = useQueryClient();

  const { data: proposals } = useQuery({
    queryKey: ['worldStateProposals', worldId],
    queryFn: async () => {
      try {
        const allProposals = await base44.entities.WorldStateProposal.filter({
          world_id: worldId
        });
        return allProposals.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      } catch {
        return [];
      }
    },
    enabled: !!worldId
  });

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    initialData: null
  });

  const createProposalMutation = useMutation({
    mutationFn: (text) => base44.entities.WorldStateProposal.create({
      world_id: worldId,
      campaign_id: campaignId || null,
      title: text.split('\n')[0].slice(0, 60),
      description: text,
      proposal_type: proposalType,
      proposed_by: currentUser?.email,
      votes_for: [],
      votes_against: [],
      votes_abstain: [],
      status: "active",
      voting_threshold: votingThreshold,
      auto_implement: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worldStateProposals', worldId] });
      setProposalText("");
      toast.success('Proposal created!');
    }
  });

  const voteProposalMutation = useMutation({
    mutationFn: async ({ proposalId, voteType }) => {
      const proposal = proposals.find(p => p.id === proposalId);
      const userEmail = currentUser?.email;

      let votesFor = proposal.votes_for || [];
      let votesAgainst = proposal.votes_against || [];
      let votesAbstain = proposal.votes_abstain || [];

      // Remove existing vote
      votesFor = votesFor.filter(v => v !== userEmail);
      votesAgainst = votesAgainst.filter(v => v !== userEmail);
      votesAbstain = votesAbstain.filter(v => v !== userEmail);

      // Add new vote
      if (voteType === 'for') votesFor.push(userEmail);
      else if (voteType === 'against') votesAgainst.push(userEmail);
      else if (voteType === 'abstain') votesAbstain.push(userEmail);

      // Check if threshold met
      const totalVotes = votesFor.length + votesAgainst.length;
      const threshold = proposal.voting_threshold || 60;
      let status = proposal.status;
      const percentFor = totalVotes > 0 ? (votesFor.length / totalVotes) * 100 : 0;

      if (percentFor >= threshold && votesFor.length > 0) {
        status = 'approved';
        // Auto-implement if enabled
        if (proposal.auto_implement) {
          await implementProposal(proposal, votesFor);
        }
      } else if ((votesAgainst.length / totalVotes) * 100 > (100 - threshold) && votesAgainst.length > 0) {
        status = 'rejected';
      }

      return base44.entities.WorldStateProposal.update(proposalId, {
        votes_for: votesFor,
        votes_against: votesAgainst,
        votes_abstain: votesAbstain,
        status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worldStateProposals', worldId] });
      toast.success('Vote recorded!');
    }
  });

  const implementProposal = async (proposal, votesFor) => {
    try {
      // Update world evolution with approved change
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      if (evolution.length > 0) {
        const evo = evolution[0];
        await base44.entities.WorldEvolution.update(evo.id, {
          emergent_lore: [
            ...(evo.emergent_lore || []),
            {
              lore_type: 'World Change (Voted)',
              content: proposal.description,
              triggered_by: `Player Proposal: ${proposal.title}`,
              created_date: new Date().toISOString()
            }
          ]
        });
      }
      toast.success('✓ Proposal automatically implemented!');
    } catch (error) {
      console.error('Failed to implement proposal:', error);
    }
  };

  const getVotePercentage = (votes, total) => {
    return total === 0 ? 0 : Math.round((votes.length / total) * 100);
  };

  const statusStyles = {
    active: 'bg-yellow-600',
    approved: 'bg-green-600',
    rejected: 'bg-red-600',
    implementing: 'bg-blue-600'
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-purple-300 flex items-center gap-2">
          🗳️ World State Proposals
        </CardTitle>
        {currentUser?.role === 'admin' && (
          <Button
            size="sm"
            variant="outline"
            className="border-purple-500/50"
            onClick={() => setShowThresholdSettings(!showThresholdSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Threshold Settings */}
        {showThresholdSettings && currentUser?.role === 'admin' && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 space-y-2">
            <label className="text-xs font-semibold text-purple-300">Approval Threshold: {votingThreshold}%</label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={votingThreshold}
              onChange={(e) => setVotingThreshold(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-slate-400">Requires {votingThreshold}% of votes to approve</p>
          </div>
        )}

        {/* New Proposal */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={proposalType}
              onChange={(e) => setProposalType(e.target.value)}
              className="bg-slate-700/50 border border-purple-500/30 rounded px-2 py-1 text-xs text-slate-200"
            >
              <option value="world_change">World Change</option>
              <option value="faction_shift">Faction Shift</option>
              <option value="lore_addition">Lore Addition</option>
              <option value="event">World Event</option>
            </select>
          </div>
          <textarea
            value={proposalText}
            onChange={(e) => setProposalText(e.target.value)}
            placeholder="Propose a world-state change..."
            className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            rows={3}
          />
          <Button
            onClick={() => createProposalMutation.mutate(proposalText)}
            disabled={createProposalMutation.isPending || !proposalText.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {createProposalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "📋"}
            Submit Proposal
          </Button>
        </div>

        {/* Proposals List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {proposals?.map((proposal) => {
            const totalVotes = (proposal.votes_for?.length || 0) + (proposal.votes_against?.length || 0) + (proposal.votes_abstain?.length || 0);
            const percentFor = getVotePercentage(proposal.votes_for || [], totalVotes);
            const threshold = proposal.voting_threshold || 60;
            const userVote = currentUser?.email ? 
              proposal.votes_for?.includes(currentUser.email) ? 'for' :
              proposal.votes_against?.includes(currentUser.email) ? 'against' :
              proposal.votes_abstain?.includes(currentUser.email) ? 'abstain' : null
              : null;

            return (
              <div key={proposal.id} className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-semibold text-slate-300">{proposal.title}</h5>
                    <p className="text-xs text-slate-500 mt-1">by {proposal.proposed_by}</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={statusStyles[proposal.status]}>
                      {proposal.status === 'approved' && '✓'}
                      {proposal.status === 'rejected' && '✗'}
                      {proposal.status === 'active' && '⏱️'}
                      {' ' + proposal.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-slate-300">{proposal.description}</p>

                {/* Vote Progress */}
                <div className="space-y-1 bg-slate-800/50 rounded p-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Threshold: {threshold}%</span>
                    <span className={`font-semibold ${percentFor >= threshold ? 'text-green-400' : 'text-slate-400'}`}>
                      {percentFor}% For
                    </span>
                  </div>
                  <Progress value={percentFor} className="h-2" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>FOR: {proposal.votes_for?.length || 0}</span>
                    <span>AGAINST: {proposal.votes_against?.length || 0}</span>
                    <span>ABSTAIN: {proposal.votes_abstain?.length || 0}</span>
                  </div>
                </div>

                {/* Voting Buttons */}
                {proposal.status === 'active' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-500/30">
                    <Button
                      size="sm"
                      variant={userVote === 'for' ? "default" : "outline"}
                      className={`flex-1 ${userVote === 'for' ? 'bg-green-600' : ''}`}
                      onClick={() => voteProposalMutation.mutate({ proposalId: proposal.id, voteType: 'for' })}
                      disabled={voteProposalMutation.isPending}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={userVote === 'against' ? "default" : "outline"}
                      className={`flex-1 ${userVote === 'against' ? 'bg-red-600' : ''}`}
                      onClick={() => voteProposalMutation.mutate({ proposalId: proposal.id, voteType: 'against' })}
                      disabled={voteProposalMutation.isPending}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={userVote === 'abstain' ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => voteProposalMutation.mutate({ proposalId: proposal.id, voteType: 'abstain' })}
                      disabled={voteProposalMutation.isPending}
                    >
                      —
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {!proposals?.length && (
            <p className="text-sm text-slate-400 text-center py-4">No proposals yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}