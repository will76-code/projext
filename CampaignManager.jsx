import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, ScrollText, Sparkles, Play, Pause, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import InGameNPCRoleplay from "@/components/ai/InGameNPCRoleplay";

export default function CampaignManager() {
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [newCampaignData, setNewCampaignData] = useState({
    title: "",
    world_id: "",
    story_summary: "",
    character_ids: []
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date')
  });

  const { data: worlds = [] } = useQuery({
    queryKey: ['worlds'],
    queryFn: () => base44.entities.World.list()
  });

  const { data: characters = [] } = useQuery({
    queryKey: ['characters'],
    queryFn: () => base44.entities.Character.list()
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success("Campaign created!");
      setNewCampaignData({ title: "", world_id: "", story_summary: "", character_ids: [] });
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success("Campaign updated!");
    }
  });

  const addSessionNote = async (note) => {
    if (!selectedCampaign) return;
    const logs = selectedCampaign.session_logs || [];
    await updateCampaignMutation.mutateAsync({
      id: selectedCampaign.id,
      data: {
        session_logs: [
          ...logs,
          {
            session_number: logs.length + 1,
            date: new Date().toISOString(),
            summary: note,
            key_events: []
          }
        ]
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-purple-300">Campaign Manager</h1>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-purple-500/30 text-white">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Campaign Title</Label>
                  <Input
                    value={newCampaignData.title}
                    onChange={(e) => setNewCampaignData({ ...newCampaignData, title: e.target.value })}
                    placeholder="The Shadow War"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div>
                  <Label>World</Label>
                  <Select 
                    value={newCampaignData.world_id} 
                    onValueChange={(val) => setNewCampaignData({ ...newCampaignData, world_id: val })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue placeholder="Select world" />
                    </SelectTrigger>
                    <SelectContent>
                      {worlds.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Story Summary</Label>
                  <Textarea
                    value={newCampaignData.story_summary}
                    onChange={(e) => setNewCampaignData({ ...newCampaignData, story_summary: e.target.value })}
                    placeholder="A dark conspiracy threatens the city..."
                    className="bg-slate-800 border-slate-600 h-24"
                  />
                </div>
                <Button 
                  onClick={() => createCampaignMutation.mutate(newCampaignData)}
                  disabled={!newCampaignData.title || !newCampaignData.world_id}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campaign List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map(campaign => {
            const world = worlds.find(w => w.id === campaign.world_id);
            return (
              <Card 
                key={campaign.id} 
                className={`bg-slate-800/50 border-purple-500/30 cursor-pointer transition-all ${
                  selectedCampaign?.id === campaign.id ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setSelectedCampaign(campaign)}
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{campaign.title}</span>
                    <Badge className={
                      campaign.status === 'active' ? 'bg-green-600' :
                      campaign.status === 'paused' ? 'bg-yellow-600' :
                      'bg-slate-600'
                    }>
                      {campaign.status || 'active'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-purple-400">{world?.name}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-400 line-clamp-2">{campaign.story_summary}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {campaign.character_ids?.length || 0} PCs
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <ScrollText className="w-3 h-3 mr-1" />
                      {campaign.session_logs?.length || 0} sessions
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Campaign Details */}
        {selectedCampaign && (
          <div className="mt-8 space-y-6">
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300 flex items-center justify-between">
                  <span>{selectedCampaign.title}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCampaignMutation.mutate({
                        id: selectedCampaign.id,
                        data: { status: selectedCampaign.status === 'active' ? 'paused' : 'active' }
                      })}
                    >
                      {selectedCampaign.status === 'active' ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                      {selectedCampaign.status === 'active' ? 'Pause' : 'Resume'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-slate-700/50">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="characters">Characters</TabsTrigger>
                    <TabsTrigger value="npcs">NPCs</TabsTrigger>
                    <TabsTrigger value="quests">Quests</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div>
                      <Label className="text-slate-400">Story Summary</Label>
                      <p className="text-white mt-1">{selectedCampaign.story_summary}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Current Scene</Label>
                      <Input
                        value={selectedCampaign.current_scene || ""}
                        onChange={(e) => updateCampaignMutation.mutate({
                          id: selectedCampaign.id,
                          data: { current_scene: e.target.value }
                        })}
                        placeholder="Where are the players now?"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="characters">
                    <div className="space-y-2">
                      {characters.filter(c => selectedCampaign.character_ids?.includes(c.id)).map(char => (
                        <Card key={char.id} className="bg-slate-700/30 border-slate-600">
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-white">{char.name}</p>
                                <p className="text-xs text-slate-400">{char.class_role} • Level {char.level}</p>
                              </div>
                              <Badge>PC</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="npcs">
                    <InGameNPCRoleplay campaignId={selectedCampaign.id} worldId={selectedCampaign.world_id} />
                  </TabsContent>

                  <TabsContent value="quests">
                    <div className="space-y-2">
                      {selectedCampaign.active_quests?.map((quest, i) => (
                        <Card key={i} className="bg-slate-700/30 border-slate-600">
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-white">{quest.title}</p>
                              <Badge className={
                                quest.status === 'completed' ? 'bg-green-600' :
                                quest.status === 'failed' ? 'bg-red-600' :
                                'bg-blue-600'
                              }>
                                {quest.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400">{quest.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="sessions" className="space-y-3">
                    {selectedCampaign.session_logs?.map((log, i) => (
                      <Card key={i} className="bg-slate-700/30 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white flex items-center justify-between">
                            Session {log.session_number}
                            <span className="text-xs text-slate-400">{new Date(log.date).toLocaleDateString()}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-300">
                          <p>{log.summary}</p>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Session Note
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-purple-500/30">
                        <DialogHeader>
                          <DialogTitle>Session Note</DialogTitle>
                        </DialogHeader>
                        <Textarea
                          id="session-note"
                          placeholder="What happened this session?"
                          className="bg-slate-800 border-slate-600 text-white h-32"
                        />
                        <Button onClick={() => {
                          const note = document.getElementById('session-note').value;
                          if (note.trim()) addSessionNote(note);
                        }}>
                          Save Note
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}