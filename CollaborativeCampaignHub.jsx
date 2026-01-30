import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, Vote, BookMarked, Zap, Map, Award } from "lucide-react";
import { Link } from "react-router-dom";
import ActionVoteModerator from "../components/campaign/ActionVoteModerator";
import ActionVoteSummarizer from "../components/campaign/ActionVoteSummarizer";
import LoreDiscoveryLinker from "../components/campaign/LoreDiscoveryLinker";
import DynamicEncounterGenerator from "../components/ai/DynamicEncounterGenerator";
import NPCStatBlockAdjuster from "../components/ai/NPCStatBlockAdjuster";
import EnvironmentChallengeGenerator from "../components/ai/EnvironmentChallengeGenerator";
import CampaignGoalTracker from "../components/campaign/CampaignGoalTracker";
import WorldEvolutionLoreGenerator from "../components/ai/WorldEvolutionLoreGenerator";
import LoreNetworkGraph from "../components/world/LoreNetworkGraph";
import InteractiveTimelineVisual from "../components/world/InteractiveTimelineVisual";

export default function CollaborativeCampaignHub() {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaignId');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const campaigns = await base44.entities.Campaign.filter({ id: campaignId });
      return campaigns[0];
    },
    enabled: !!campaignId
  });

  const { data: world } = useQuery({
    queryKey: ['world', campaign?.world_id],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ id: campaign?.world_id });
      return worlds[0];
    },
    enabled: !!campaign?.world_id
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', campaignId],
    queryFn: async () => {
      const msgs = await base44.entities.ConversationMessage.filter({ campaign_id: campaignId });
      return msgs;
    },
    enabled: !!campaignId,
    initialData: []
  });

  if (isLoading) {
    return <div className="p-6 text-slate-400">Loading campaign...</div>;
  }

  if (!campaign) {
    return <div className="p-6 text-slate-400">Campaign not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-300 flex items-center gap-2">
              <Users className="w-8 h-8" />
              Campaign Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1">{campaign?.title} - {world?.name}</p>
            {campaign?.campaign_tones?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {campaign.campaign_tones.map(tone => (
                  <span key={tone} className="text-xs bg-purple-600/40 px-2 py-1 rounded text-purple-300">
                    {tone.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Link to={`/Campaign?characterId=${campaign?.character_ids?.[0]}`}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              ← Back to Campaign
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="collaboration" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
            <TabsTrigger value="collaboration" className="flex items-center gap-2">
              <Vote className="w-4 h-4" />
              <span className="hidden sm:inline">Collaboration</span>
            </TabsTrigger>
            <TabsTrigger value="lore" className="flex items-center gap-2">
              <BookMarked className="w-4 h-4" />
              <span className="hidden sm:inline">Lore</span>
            </TabsTrigger>
            <TabsTrigger value="encounters" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Encounters</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
          </TabsList>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ActionVoteModerator campaignId={campaignId} />
              <ActionVoteSummarizer campaignId={campaignId} />
            </div>
          </TabsContent>

          {/* Lore Tab */}
          <TabsContent value="lore" className="space-y-4 mt-4">
            <LoreDiscoveryLinker campaignId={campaignId} worldId={world?.id} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <WorldEvolutionLoreGenerator worldId={world?.id} />
              <LoreNetworkGraph worldId={world?.id} />
            </div>
          </TabsContent>

          {/* Encounters Tab */}
          <TabsContent value="encounters" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DynamicEncounterGenerator
                character={campaign?.character_ids?.[0]}
                world={world}
                campaign={campaign}
                messages={messages}
              />
              <div className="space-y-4">
                <NPCStatBlockAdjuster
                  character={campaign?.character_ids?.[0]}
                  npcName="Campaign NPC"
                  world={world}
                  messages={messages}
                />
                <EnvironmentChallengeGenerator
                  character={campaign?.character_ids?.[0]}
                  location={campaign?.current_scene}
                  world={world}
                  messages={messages}
                />
              </div>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4 mt-4">
            <CampaignGoalTracker
              campaignId={campaignId}
              worldId={world?.id}
              campaignNarrative={campaign?.story_summary}
            />
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-slate-800/50 border-slate-500/30">
          <CardContent className="pt-6">
            <p className="text-xs text-slate-400">
              <span className="text-slate-500 font-semibold">💡 Hub Features:</span> Collaborative voting with AI moderation, lore discovery linking, dynamic encounter generation tailored to campaign tone and narrative, and progress tracking towards campaign goals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}