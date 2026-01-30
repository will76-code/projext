import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ActionVoteSummarizer({ campaignId }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(null);

  const { data: votes } = useQuery({
    queryKey: ['actionVotes', campaignId],
    queryFn: async () => {
      const allVotes = await base44.entities.ActionVote.filter({ campaign_id: campaignId });
      return allVotes.filter(v => v.status === 'executed');
    },
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

  const generateSummary = async () => {
    if (!votes || votes.length === 0) {
      toast.error('No executed votes to summarize');
      return;
    }

    setIsGenerating(true);
    try {
      const voteContent = votes.map(v => `
Action: ${v.action_description}
Proposed by: ${v.proposed_by}
Vote Result: ${v.votes?.filter(x => x.vote === 'yes').length || 0} yes, ${v.votes?.filter(x => x.vote === 'no').length || 0} no
`).join('\n');

      const aiSummary = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a narrative summary of executed group actions and their consequences:

Campaign: ${campaign?.title}
Campaign Tones: ${campaign?.campaign_tones?.join(', ') || 'Epic Adventure'}

Executed Actions:
${voteContent}

Create a dramatic, engaging narrative summary that:
1. Synthesizes the group decisions into a cohesive narrative
2. Highlights the consequences of each action
3. Shows how the world has been shaped by their choices
4. Incorporates the campaign tones (${campaign?.campaign_tones?.join(', ') || 'Epic Adventure'})
5. Sets up future hooks and consequences`,
        response_json_schema: {
          type: "object",
          properties: {
            narrative_summary: { type: "string" },
            consequence_analysis: { type: "array", items: { type: "string" } },
            world_impact: { type: "string" },
            future_hooks: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSummary(aiSummary);
      toast.success('AI Summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary');
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-green-500/30">
      <CardHeader>
        <CardTitle className="text-green-300 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Action Resolution Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateSummary}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Summarize Executed Actions
        </Button>

        {summary && (
          <div className="space-y-4">
            {summary.narrative_summary && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-300 leading-relaxed">{summary.narrative_summary}</p>
              </div>
            )}

            {summary.consequence_analysis?.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-slate-300 text-sm">⚖️ Consequences:</h5>
                {summary.consequence_analysis.map((consequence, i) => (
                  <div key={i} className="bg-slate-700/30 border border-slate-500/30 rounded p-2">
                    <p className="text-xs text-slate-300">{consequence}</p>
                  </div>
                ))}
              </div>
            )}

            {summary.world_impact && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                <p className="text-xs text-purple-400 font-semibold mb-1">🌍 World Impact:</p>
                <p className="text-xs text-purple-300">{summary.world_impact}</p>
              </div>
            )}

            {summary.future_hooks?.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-yellow-300 text-sm">🪝 Future Hooks:</h5>
                {summary.future_hooks.map((hook, i) => (
                  <Badge key={i} className="bg-yellow-600/60 text-yellow-200">
                    {hook}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}