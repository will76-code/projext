import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertCircle, Lightbulb, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function EnhancedCampaignAssistant({ campaign, character, world, relationships = [], timeline = [], sessionRecaps = [] }) {
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState([]);
  const [plotTwists, setPlotTwists] = useState([]);
  const [inconsistencies, setInconsistencies] = useState([]);
  const [opportunities, setOpportunities] = useState([]);

  const analyzeRelationshipsAndTimeline = async () => {
    setGenerating(true);
    try {
      const context = `
Campaign: ${campaign.title}
World: ${world.name} (${world.genre})
Character: ${character.name}

Relationships Map:
${relationships.map(r => `- ${r.faction_a} ${r.relationship_type === 'hostile' ? '⚔️' : '💚'} ${r.faction_b} (tension: ${r.tension_level})`).join('\n')}

Timeline Events:
${timeline.map(e => `- ${e.date}: ${e.title} (${e.event_type})`).join('\n')}

Recent Sessions:
${sessionRecaps.slice(-3).map(s => `- Session ${s.session_number}: ${s.title}`).join('\n')}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this campaign's relationship map and timeline to identify:
1. Plot inconsistencies or contradictions
2. Missed opportunities for story development
3. Character relationship dynamics that could create tension

${context}

Provide detailed analysis as JSON with "inconsistencies", "opportunities", and "relationship_insights" arrays.`,
        response_json_schema: {
          type: "object",
          properties: {
            inconsistencies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                  resolution: { type: "string" }
                }
              }
            },
            opportunities: {
              type: "array",
              items: { type: "string" }
            },
            relationship_insights: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setInconsistencies(response.inconsistencies || []);
      setOpportunities(response.opportunities || []);
      setInsights(response.relationship_insights || []);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Analysis failed");
    }
    setGenerating(false);
  };

  const generatePlotTwists = async () => {
    setGenerating(true);
    try {
      const recentActions = sessionRecaps.slice(-2).map(r => r.key_events).flat();
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 compelling plot twists for a campaign where:
- Campaign: ${campaign.title}
- Character: ${character.name} (Level ${character.level})
- Recent key events: ${recentActions.join(', ')}
- Character progression: ${sessionRecaps[sessionRecaps.length - 1]?.character_progression || 'Unknown'}

Each twist should build on player actions and be specific to the world (${world.name}).
Return as JSON array with "twist", "trigger", "narrative_impact", and "difficulty" fields.`,
        response_json_schema: {
          type: "object",
          properties: {
            twists: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  twist: { type: "string" },
                  trigger: { type: "string" },
                  narrative_impact: { type: "string" },
                  difficulty: { type: "string" }
                }
              }
            }
          }
        }
      });

      setPlotTwists(response.twists || []);
      toast.success("Plot twists generated!");
    } catch (error) {
      toast.error("Failed to generate plot twists");
    }
    setGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Advanced Campaign Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="twists">Plot Twists</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-3">
            <Button
              onClick={analyzeRelationshipsAndTimeline}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
              Analyze Relationships & Timeline
            </Button>

            {inconsistencies.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-400 text-sm">Inconsistencies Found</h4>
                {inconsistencies.map((inc, i) => (
                  <div key={i} className="bg-red-900/20 border border-red-500/30 rounded p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${inc.severity === 'high' ? 'bg-red-600' : inc.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'}`}>
                        {inc.severity}
                      </Badge>
                      <span className="text-sm text-red-300 font-semibold">{inc.issue}</span>
                    </div>
                    <p className="text-xs text-red-200">{inc.resolution}</p>
                  </div>
                ))}
              </div>
            )}

            {opportunities.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-green-400 text-sm">Story Opportunities</h4>
                {opportunities.map((opp, i) => (
                  <div key={i} className="bg-green-900/20 border border-green-500/30 rounded p-3">
                    <p className="text-xs text-green-300">{opp}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="twists" className="space-y-3">
            <Button
              onClick={generatePlotTwists}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
              Generate Plot Twists
            </Button>

            {plotTwists.map((twist, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                <h4 className="font-semibold text-purple-300 text-sm">{twist.twist}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  <span className="font-semibold">Trigger:</span> {twist.trigger}
                </p>
                <p className="text-xs text-slate-300 mt-1">{twist.narrative_impact}</p>
                <Badge className="mt-2 text-xs bg-purple-600/50">{twist.difficulty}</Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="insights" className="space-y-3">
            {insights.length > 0 ? (
              insights.map((insight, i) => (
                <div key={i} className="flex gap-2 bg-slate-700/30 p-3 rounded border border-slate-600">
                  <TrendingUp className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300">{insight}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Run analysis to see relationship insights</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}