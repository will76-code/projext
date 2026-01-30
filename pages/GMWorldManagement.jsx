import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings, Users, Globe, BookOpen, TrendingUp, Save } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GMWorldManagement() {
  const urlParams = new URLSearchParams(window.location.search);
  const worldId = urlParams.get('worldId');
  const queryClient = useQueryClient();
  const [editingLore, setEditingLore] = useState(null);
  const [loreText, setLoreText] = useState("");

  const { data: world } = useQuery({
    queryKey: ['world', worldId],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ id: worldId });
      return worlds[0];
    },
    enabled: !!worldId
  });

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', worldId],
    queryFn: async () => {
      const allCampaigns = await base44.entities.Campaign.list();
      return allCampaigns.filter(c => c.world_id === worldId);
    },
    enabled: !!worldId
  });

  const { data: loreContributions } = useQuery({
    queryKey: ['loreContributions', worldId],
    queryFn: async () => {
      const contributions = await base44.entities.LoreContribution.filter({ world_id: worldId });
      return contributions;
    },
    enabled: !!worldId
  });

  const updateWorldMutation = useMutation({
    mutationFn: (data) => base44.entities.World.update(worldId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['world', worldId] });
      toast.success('World updated!');
    }
  });

  const approveLoreMutation = useMutation({
    mutationFn: (data) => base44.entities.LoreContribution.update(data.id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreContributions', worldId] });
      toast.success('Lore approved!');
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-300 flex items-center gap-2">
              <Settings className="w-8 h-8" />
              GM World Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">{world?.name}</p>
          </div>
          <Link to={createPageUrl('WorldHub')}>
            <Button variant="outline" className="border-purple-500/50">
              ← Back to Hub
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="factions" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Factions</span>
            </TabsTrigger>
            <TabsTrigger value="lore" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Lore</span>
            </TabsTrigger>
            <TabsTrigger value="evolution" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Evolution</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-300">Active Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{campaigns?.length || 0}</p>
                  <p className="text-sm text-slate-400 mt-2">Running simultaneously</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-300">World Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{worldEvolution?.simulated_events?.length || 0}</p>
                  <p className="text-sm text-slate-400 mt-2">Simulated events</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-300">Lore Contributions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{loreContributions?.length || 0}</p>
                  <p className="text-sm text-slate-400 mt-2">Player submissions</p>
                </CardContent>
              </Card>
            </div>

            {/* World Description */}
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">World Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={world?.description || ""}
                  onChange={(e) => setEditingLore({ ...world, description: e.target.value })}
                  className="w-full bg-slate-700/50 border border-purple-500/30 rounded p-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  rows={6}
                />
                <Button
                  onClick={() => updateWorldMutation.mutate({ description: editingLore?.description })}
                  disabled={updateWorldMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {updateWorldMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Description
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Factions Tab */}
          <TabsContent value="factions" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Faction Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {worldEvolution?.campaign_states?.map((state, idx) => (
                  <div key={idx} className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-4">
                    <p className="text-sm text-slate-300 mb-2">
                      <span className="font-semibold">Campaign:</span> {state.campaign_id}
                    </p>
                    {state.factions_affected && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 font-semibold">Faction Impact:</p>
                        {Object.entries(state.factions_affected).map(([faction, impact]) => (
                          <div key={faction} className="flex items-center justify-between">
                            <span className="text-xs text-slate-300">{faction}</span>
                            <Badge className={impact > 0 ? 'bg-green-600' : 'bg-red-600'}>
                              {impact > 0 ? '+' : ''}{impact}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!worldEvolution?.campaign_states?.length && (
                  <p className="text-sm text-slate-400">No faction data yet. Factions will track campaign impacts.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lore Tab */}
          <TabsContent value="lore" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Player Lore Contributions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {loreContributions?.map((contrib) => (
                  <div key={contrib.id} className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-slate-300">{contrib.title}</h5>
                        <p className="text-xs text-slate-500 mt-1">by {contrib.submitted_by}</p>
                      </div>
                      <Badge className={
                        contrib.status === 'approved' ? 'bg-green-600' :
                        contrib.status === 'rejected' ? 'bg-red-600' :
                        'bg-yellow-600'
                      }>
                        {contrib.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300">{contrib.content}</p>
                    {contrib.status === 'pending_review' && (
                      <Button
                        onClick={() => approveLoreMutation.mutate(contrib)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                ))}
                {!loreContributions?.length && (
                  <p className="text-sm text-slate-400">No player contributions yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evolution Tab */}
          <TabsContent value="evolution" className="space-y-4 mt-4">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">World State & Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {worldEvolution?.world_state && (
                  <div className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-4 space-y-3">
                    <h5 className="font-semibold text-slate-300">Current World State</h5>
                    <div className="text-sm text-slate-400 space-y-2">
                      <p><span className="text-slate-300 font-semibold">Political:</span> {worldEvolution.world_state.political_landscape}</p>
                      <p><span className="text-slate-300 font-semibold">Economic:</span> {worldEvolution.world_state.economic_conditions}</p>
                    </div>
                  </div>
                )}

                {worldEvolution?.simulated_events?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-semibold text-slate-300">Recent Simulated Events</h5>
                    {worldEvolution.simulated_events.slice(0, 5).map((event, idx) => (
                      <div key={idx} className="bg-slate-700/30 border border-slate-500/30 rounded p-2">
                        <p className="text-sm font-semibold text-slate-300">{event.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}