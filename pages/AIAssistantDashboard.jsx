import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, Zap, Users, BookOpen, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AIAssistantDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaignId');
  const [suggestions, setSuggestions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const campaigns = await base44.entities.Campaign.filter({ id: campaignId });
      return campaigns[0];
    },
    enabled: !!campaignId
  });

  const { data: characters } = useQuery({
    queryKey: ['characters', campaignId],
    queryFn: async () => {
      const chars = await base44.entities.Character.filter({ world_id: campaign?.world_id });
      return chars;
    },
    enabled: !!campaign?.world_id
  });

  const { data: sessionRecaps } = useQuery({
    queryKey: ['recaps', campaignId],
    queryFn: async () => {
      const recaps = await base44.entities.SessionRecap.filter({ campaign_id: campaignId });
      return recaps.sort((a, b) => b.session_number - a.session_number);
    },
    enabled: !!campaignId
  });

  const analyzeCampaign = async () => {
    if (!campaign || !characters?.length) {
      toast.error("Need campaign and character data");
      return;
    }

    setIsAnalyzing(true);
    try {
      const recentRecaps = sessionRecaps?.slice(0, 3) || [];
      const prompt = `You are a creative AI Game Master assistant. Analyze this campaign and suggest next steps.

Campaign: ${campaign.title}
Story Summary: ${campaign.story_summary}
Current Scene: ${campaign.current_scene}
Tones: ${campaign.campaign_tones?.join(", ")}

Characters:
${characters.map(c => `- ${c.name} (Level ${c.level} ${c.race} ${c.class_role})`).join("\n")}

Recent Sessions:
${recentRecaps.map(r => `Session ${r.session_number}: ${r.summary}`).join("\n")}

Active Quests:
${campaign.active_quests?.map(q => `- ${q.title}: ${q.status}`).join("\n")}

NPCs Met:
${campaign.npcs?.map(n => `- ${n.name}: ${n.description}`).join("\n")}

Based on this analysis, provide JSON with:
1. plotTwists (array): 3 unexpected story developments
2. npcInteractions (array): personalized NPC interaction suggestions based on character relationships
3. nextSteps (array): immediate action suggestions to advance the story
4. characterArcs (object): development opportunities for each character
5. escalation (string): how to raise stakes

Format as valid JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            plotTwists: { type: "array", items: { type: "string" } },
            npcInteractions: { type: "array", items: { type: "string" } },
            nextSteps: { type: "array", items: { type: "string" } },
            characterArcs: { type: "object" },
            escalation: { type: "string" }
          }
        }
      });

      setSuggestions(result);
      toast.success("Campaign analysis complete");
    } catch (error) {
      toast.error("Failed to analyze campaign");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-300 flex items-center gap-2">
              <Lightbulb className="w-8 h-8" />
              AI Campaign Assistant
            </h1>
            <p className="text-slate-400 text-sm mt-1">{campaign?.title}</p>
          </div>
          <Button
            onClick={analyzeCampaign}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {isAnalyzing ? "Analyzing..." : "Analyze Campaign"}
          </Button>
        </div>

        {!suggestions ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-8 text-center">
              <Lightbulb className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">Click "Analyze Campaign" to get AI-powered suggestions</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plot Twists */}
            <Card className="bg-slate-800/50 border-red-500/30 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-red-300 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Plot Twists
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.plotTwists?.map((twist, i) => (
                  <div key={i} className="bg-red-900/20 border border-red-500/30 rounded p-3">
                    <p className="text-sm text-red-100">{twist}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* NPC Interactions */}
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  NPC Interactions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestions.npcInteractions?.map((interaction, i) => (
                  <div key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-purple-400 font-semibold flex-shrink-0">•</span>
                    <span>{interaction}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="bg-slate-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestions.nextSteps?.map((step, i) => (
                  <div key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-cyan-400 font-semibold flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Escalation */}
            <Card className="bg-slate-800/50 border-orange-500/30 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-orange-300 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Raise the Stakes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">{suggestions.escalation}</p>
              </CardContent>
            </Card>

            {/* Character Arcs */}
            <Card className="bg-slate-800/50 border-green-500/30 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Character Development Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(suggestions.characterArcs || {}).map(([char, arc]) => (
                  <div key={char} className="bg-green-900/20 border border-green-500/30 rounded p-3">
                    <p className="font-semibold text-green-300 mb-1">{char}</p>
                    <p className="text-sm text-slate-300">{arc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}