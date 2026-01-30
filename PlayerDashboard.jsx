import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, BookOpen, Backpack, Zap, Award, History, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PlayerDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('campaignId');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    initialData: null
  });

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const campaigns = await base44.entities.Campaign.filter({ id: campaignId });
      return campaigns[0];
    },
    enabled: !!campaignId
  });

  const { data: character } = useQuery({
    queryKey: ['character', campaign?.character_ids?.[0]],
    queryFn: async () => {
      if (!campaign?.character_ids?.[0]) return null;
      const characters = await base44.entities.Character.filter({ id: campaign.character_ids[0] });
      return characters[0];
    },
    enabled: !!campaign?.character_ids?.[0]
  });

  const { data: loreContributions } = useQuery({
    queryKey: ['playerLore', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const contributions = await base44.entities.LoreContribution.filter({ submitted_by: user.email });
      return contributions;
    },
    enabled: !!user?.email
  });

  const { data: sessionRecaps } = useQuery({
    queryKey: ['sessionRecaps', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const recaps = await base44.entities.SessionRecap.filter({ campaign_id: campaignId });
      return recaps.sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
    },
    enabled: !!campaignId
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-300 flex items-center gap-2">
              <User className="w-8 h-8" />
              Player Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">{user?.full_name}</p>
          </div>
          <Link to={createPageUrl('WorldHub')}>
            <Button variant="outline" className="border-purple-500/50">
              ← Back to Hub
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-300">Active Character</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{character?.name || "No Character"}</p>
              {character?.level && <p className="text-xs text-slate-400">Level {character.level}</p>}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-300">Sessions Played</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{sessionRecaps?.length || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-300">Lore Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{loreContributions?.length || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-300">Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold text-white line-clamp-1">{campaign?.title || "No Campaign"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="character" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
            <TabsTrigger value="character" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Character</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Backpack className="w-4 h-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="lore" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Lore</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
          </TabsList>

          {/* Character Tab */}
          <TabsContent value="character" className="space-y-4 mt-4">
            {character ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-300">{character.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-400">Race</p>
                        <p className="font-semibold text-white">{character.race}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Class</p>
                        <p className="font-semibold text-white">{character.class_role}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Level</p>
                        <p className="font-semibold text-white">{character.level}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-300">Resources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {character.resources?.hp_max && (
                      <div>
                        <p className="text-xs text-slate-400">Health Points</p>
                        <p className="font-semibold text-white">{character.resources.hp_current}/{character.resources.hp_max}</p>
                      </div>
                    )}
                    {character.resources?.mana_max && (
                      <div>
                        <p className="text-xs text-slate-400">Mana</p>
                        <p className="font-semibold text-white">{character.resources.mana_current}/{character.resources.mana_max}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {character.backstory && (
                  <Card className="bg-slate-800/50 border-purple-500/30 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-purple-300">Backstory</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-300 leading-relaxed">{character.backstory}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-400">No active character</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Equipment & Items</CardTitle>
              </CardHeader>
              <CardContent>
                {character?.inventory && character.inventory.length > 0 ? (
                  <div className="space-y-2">
                    {character.inventory.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-700/30 border border-slate-500/30 rounded p-3">
                        <span className="text-sm text-slate-300">{item}</span>
                        <Backpack className="w-4 h-4 text-purple-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No items in inventory</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lore Tab */}
          <TabsContent value="lore" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Your Lore Contributions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {loreContributions?.map((contrib) => (
                  <div key={contrib.id} className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <h5 className="font-semibold text-slate-300">{contrib.title}</h5>
                      <Badge className={
                        contrib.status === 'approved' ? 'bg-green-600' :
                        contrib.status === 'rejected' ? 'bg-red-600' :
                        'bg-yellow-600'
                      }>
                        {contrib.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{contrib.content}</p>
                  </div>
                ))}
                {!loreContributions?.length && (
                  <p className="text-sm text-slate-400">You haven't contributed any lore yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Session Recaps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {sessionRecaps?.map((recap) => (
                  <div key={recap.id} className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-slate-300">Session {recap.session_number}: {recap.title}</h5>
                        <p className="text-xs text-slate-500 mt-1">
                          {recap.session_date && new Date(recap.session_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-purple-600">Summary</Badge>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-3">{recap.summary}</p>
                    {recap.key_events?.length > 0 && (
                      <div className="text-xs text-slate-400">
                        <p className="font-semibold mb-1">Key Events:</p>
                        <ul className="ml-3 space-y-1 list-disc">
                          {recap.key_events.slice(0, 3).map((evt, i) => (
                            <li key={i}>{evt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                {!sessionRecaps?.length && (
                  <p className="text-sm text-slate-400">No session recaps yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}