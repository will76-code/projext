import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function CampaignGoalTracker({ campaignId, worldId, campaignNarrative }) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [goals, setGoals] = useState(null);
  const [progressReport, setProgressReport] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const campaigns = await base44.entities.Campaign.filter({ id: campaignId });
      return campaigns[0];
    },
    enabled: !!campaignId
  });

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const { data: journals } = useQuery({
    queryKey: ['journals', campaignId],
    queryFn: () => base44.entities.CampaignJournal.filter({ campaign_id: campaignId })
  });

  const { data: world } = useQuery({
    queryKey: ['world', worldId],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ id: worldId });
      return worlds[0];
    },
    enabled: !!worldId
  });

  const generateGoals = async () => {
    setIsGenerating(true);
    try {
      const generatedGoals = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate long-term campaign goals based on narrative context:

Campaign: ${campaign?.title}
World: ${world?.name} (${world?.rulebook_franchise})
Current Scene: ${campaign?.current_scene}
Story Summary: ${campaign?.story_summary || 'No story yet'}

World State:
${JSON.stringify(worldEvolution?.world_state || {})}

Recent Story Events:
${journals?.slice(-5).map(j => j.content).join('\n') || 'No events yet'}

Generate 4-6 campaign goals that:
1. Feel organic to the world and story
2. Span short-term (1-3 sessions), medium (5-10 sessions), and long-term (10+ sessions)
3. Connect to world evolution and franchise themes
4. Allow for flexibility and exploration
5. Provide clear milestone markers`,
        response_json_schema: {
          type: "object",
          properties: {
            campaign_goals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  goal_title: { type: "string" },
                  description: { type: "string" },
                  timeframe: { type: "string", enum: ["short_term", "medium_term", "long_term"] },
                  milestone_markers: { type: "array", items: { type: "string" } },
                  connection_to_world: { type: "string" },
                  exploration_hooks: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setGoals(generatedGoals.campaign_goals || []);
      toast.success('Campaign goals generated!');
    } catch (error) {
      toast.error('Failed to generate goals');
    }
    setIsGenerating(false);
  };

  const evaluateProgress = async () => {
    if (!goals || goals.length === 0) {
      toast.error('No goals to evaluate');
      return;
    }

    setIsEvaluating(true);
    try {
      const journalHistory = journals?.map(j => `[${j.entry_type}] ${j.content}`).join('\n\n') || '';
      
      const report = await base44.integrations.Core.InvokeLLM({
        prompt: `Evaluate campaign progress against goals:

Campaign Goals:
${JSON.stringify(goals)}

Campaign Journal:
${journalHistory}

World Evolution Progress:
${JSON.stringify(worldEvolution?.simulated_events?.slice(-5) || [])}

Create a progress report showing:
1. Overall progress percentage for each goal
2. Key events that advanced/hindered progress
3. Upcoming milestones and how to reach them
4. Suggested story hooks for exploration while progressing
5. Total narrative momentum`,
        response_json_schema: {
          type: "object",
          properties: {
            goal_progress: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  goal_title: { type: "string" },
                  completion_percentage: { type: "number" },
                  contributing_events: { type: "array", items: { type: "string" } },
                  hindering_factors: { type: "array", items: { type: "string" } },
                  next_milestone: { type: "string" }
                }
              }
            },
            narrative_momentum: { type: "string" },
            exploration_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  hook: { type: "string" },
                  goal_relevance: { type: "string" },
                  adventure_type: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      setProgressReport(report);
      toast.success('Progress evaluated!');
    } catch (error) {
      toast.error('Failed to evaluate progress');
    }
    setIsEvaluating(false);
  };

  const timeframeColors = {
    short_term: 'bg-yellow-600',
    medium_term: 'bg-blue-600',
    long_term: 'bg-purple-600'
  };

  const timeframeLabels = {
    short_term: '1-3 Sessions',
    medium_term: '5-10 Sessions',
    long_term: '10+ Sessions'
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Campaign Goal Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={generateGoals}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
            Generate Campaign Goals
          </Button>

          {goals && goals.length > 0 && (
            <div className="space-y-3">
              {goals.map((goal, i) => (
                <div key={i} className="bg-slate-700/30 border border-purple-500/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-purple-300 text-sm">{goal.goal_title}</h5>
                      <p className="text-xs text-slate-400 mt-1">{goal.description}</p>
                    </div>
                    <Badge className={timeframeColors[goal.timeframe]}>
                      {timeframeLabels[goal.timeframe]}
                    </Badge>
                  </div>

                  {goal.milestone_markers?.length > 0 && (
                    <div className="text-xs space-y-1">
                      <p className="text-purple-400 font-semibold">Milestones:</p>
                      <ul className="ml-2 list-disc text-slate-400">
                        {goal.milestone_markers.map((marker, j) => (
                          <li key={j}>{marker}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {goal.exploration_hooks?.length > 0 && (
                    <div className="text-xs space-y-1">
                      <p className="text-green-400 font-semibold">🔍 Exploration Hooks:</p>
                      <ul className="ml-2 list-disc text-green-300">
                        {goal.exploration_hooks.slice(0, 3).map((hook, j) => (
                          <li key={j}>{hook}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-indigo-400 italic">World Connection: {goal.connection_to_world}</p>
                </div>
              ))}

              <Button
                onClick={evaluateProgress}
                disabled={isEvaluating}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isEvaluating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                Evaluate Progress
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Report */}
      {progressReport && (
        <Card className="bg-slate-800/50 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Progress Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {progressReport.goal_progress?.map((progress, i) => (
              <div key={i} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-green-300 text-sm">{progress.goal_title}</h5>
                  <Badge className="bg-green-600">{progress.completion_percentage}%</Badge>
                </div>
                <Progress value={progress.completion_percentage} className="h-2" />

                {progress.contributing_events?.length > 0 && (
                  <div className="text-xs space-y-1 mt-2">
                    <p className="text-green-400 font-semibold">✓ Contributing Events:</p>
                    <ul className="ml-2 list-disc text-green-300">
                      {progress.contributing_events.map((event, j) => (
                        <li key={j}>{event}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {progress.hindering_factors?.length > 0 && (
                  <div className="text-xs space-y-1">
                    <p className="text-yellow-400 font-semibold">⚠ Hindering Factors:</p>
                    <ul className="ml-2 list-disc text-yellow-300">
                      {progress.hindering_factors.map((factor, j) => (
                        <li key={j}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {progress.next_milestone && (
                  <div className="bg-slate-800/50 rounded p-2 mt-2">
                    <p className="text-xs text-purple-400">🎯 Next Milestone: <span className="text-purple-300">{progress.next_milestone}</span></p>
                  </div>
                )}
              </div>
            ))}

            {progressReport.exploration_opportunities?.length > 0 && (
              <div className="bg-slate-700/30 border border-blue-500/30 rounded-lg p-3 space-y-2">
                <h5 className="font-semibold text-blue-300 text-sm">🗺️ Exploration Opportunities</h5>
                <p className="text-xs text-slate-400 mb-2">Discover and explore while progressing towards goals:</p>
                <div className="space-y-2">
                  {progressReport.exploration_opportunities.map((opp, i) => (
                    <div key={i} className="bg-blue-900/20 border border-blue-500/20 rounded p-2">
                      <p className="text-xs text-blue-300 font-semibold">{opp.hook}</p>
                      <p className="text-xs text-slate-400 mt-1">Type: {opp.adventure_type} | Goal Relevance: {opp.goal_relevance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {progressReport.summary && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs text-amber-200">{progressReport.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}