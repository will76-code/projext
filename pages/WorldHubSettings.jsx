import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Settings, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import MLPRulesConverter from "@/components/world/MLPRulesConverter";
import RelationshipMapBuilder from "@/components/visualization/RelationshipMapBuilder";
import TimelineBuilder from "@/components/visualization/TimelineBuilder";
import GeneralRuleConverter from "@/components/rulebook/GeneralRuleConverter";
import EnhancedCampaignAssistant from "@/components/ai/EnhancedCampaignAssistant";
import WorldRulebookManager from "@/components/rulebook/WorldRulebookManager";
import LinkedEntitiesViewer from "@/components/lore/LinkedEntitiesViewer";
import CharacterBackstoryGenerator from "@/components/ai/CharacterBackstoryGenerator";
import FactionSummaryGenerator from "@/components/ai/FactionSummaryGenerator";
import PlotHookSuggester from "@/components/ai/PlotHookSuggester";
import RulebookMechanicsDisplay from "@/components/rulebook/RulebookMechanicsDisplay";
import WorldMechanicsSummary from "@/components/world/WorldMechanicsSummary";
import AIStoryWeaver from "@/components/ai/AIStoryWeaver";
import WorldSimulationModule from "@/components/ai/WorldSimulationModule";
import ExpandedLoreGenerator from "@/components/ai/ExpandedLoreGenerator";
import FullCampaignGenerator from "@/components/ai/FullCampaignGenerator";
import NPCCompanionManager from "@/components/ai/NPCCompanionManager";
import RulebookComparisonTool from "@/components/rulebook/RulebookComparisonTool";
import AIRulebookComparison from "@/components/rulebook/AIRulebookComparison";
import InGameNPCRoleplay from "@/components/ai/InGameNPCRoleplay";
import VectorStoreSetup from "@/components/ai/VectorStoreSetup";

export default function WorldHubSettings() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const worldId = urlParams.get('worldId');

  const [sandboxMode, setSandboxMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [sessionRecaps, setSessionRecaps] = useState([]);

  const { data: world, isLoading } = useQuery({
    queryKey: ['world', worldId],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ id: worldId });
      return worlds[0];
    },
    enabled: !!worldId,
    onSuccess: (data) => {
      setSandboxMode(data?.sandbox_mode || false);
    }
  });

  const { data: relationshipsData } = useQuery({
    queryKey: ['relationships', worldId],
    queryFn: () => base44.entities.FactionRelationship.filter({ world_id: worldId }),
    enabled: !!worldId,
    onSuccess: (data) => setRelationships(data || [])
  });

  const { data: recapsData } = useQuery({
    queryKey: ['recaps', worldId],
    queryFn: async () => {
      const campaigns = await base44.entities.Campaign.filter({ world_id: worldId });
      if (campaigns.length === 0) return [];
      const allRecaps = await Promise.all(
        campaigns.map(c => base44.entities.SessionRecap.filter({ campaign_id: c.id }))
      );
      return allRecaps.flat();
    },
    enabled: !!worldId,
    onSuccess: (data) => setSessionRecaps(data || [])
  });

  const { data: rulebooks } = useQuery({
    queryKey: ['rulebooks'],
    queryFn: () => base44.entities.Rulebook.list('-created_date'),
    initialData: []
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', worldId],
    queryFn: () => base44.entities.Campaign.filter({ world_id: worldId }),
    enabled: !!worldId,
    initialData: []
  });

  const { data: characters } = useQuery({
    queryKey: ['characters', worldId],
    queryFn: () => base44.entities.Character.filter({ world_id: worldId }),
    enabled: !!worldId,
    initialData: []
  });

  const { data: worldStateData } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: () => base44.entities.WorldEvolution.filter({ world_id: worldId }),
    enabled: !!worldId,
    initialData: []
  });

  const { data: loreEntries = [] } = useQuery({
    queryKey: ['loreEntries', worldId],
    queryFn: () => base44.entities.LoreEntry.filter({ world_id: worldId }),
    enabled: !!worldId,
    initialData: []
  });

  const events = timelineEvents || [];

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.World.update(worldId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['world', worldId] });
      toast.success('Settings saved!');
    }
  });

  const handleSandboxToggle = async (enabled) => {
    setSandboxMode(enabled);
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({ sandbox_mode: enabled });
    } catch (error) {
      toast.error('Failed to save settings');
      setSandboxMode(!enabled);
    }
    setIsSaving(false);
  };

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.World.delete(worldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worlds'] });
      toast.success('World deleted');
      window.location.href = '/';
    },
    onError: () => {
      toast.error('Failed to delete world');
    }
  });

  if (isLoading) return <div className="p-6 text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-300 flex items-center gap-2">
              <Settings className="w-8 h-8" />
              World Settings
            </h1>
            <p className="text-slate-400 text-sm mt-1">{world?.name}</p>
          </div>
          <Link to="/WorldHub">
            <Button variant="outline" className="border-purple-500/50">
              Back to Worlds
            </Button>
          </Link>
        </div>

        {/* Campaign Mode Settings */}
        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-purple-300 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Campaign Mode
            </CardTitle>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-500/50 text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete World
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-red-500/30">
                <AlertDialogTitle className="text-red-300">Delete {world?.name}?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. All campaigns, characters, and lore will be permanently deleted.
                </AlertDialogDescription>
                <div className="flex gap-3">
                  <AlertDialogCancel className="border-slate-500/50">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-700/30 border border-purple-500/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Sandbox Exploration Mode</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Enable players to freely explore without strict goal direction. Allows campaigns to be flexible exploration sandboxes where discovery is organic.
                  </p>
                </div>
                <Switch
                  checked={sandboxMode}
                  onCheckedChange={handleSandboxToggle}
                  disabled={isSaving}
                />
              </div>

              {sandboxMode && (
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-3">
                  <p className="text-xs text-cyan-300">
                    ✓ <span className="font-semibold">Sandbox Mode Active:</span> Players can explore freely, discover emergent lore, and pursue personal adventures. AI will still suggest goals and track momentum, but players aren't bound to them.
                  </p>
                </div>
              )}

              {!sandboxMode && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3">
                  <p className="text-xs text-purple-300">
                    ✓ <span className="font-semibold">Goal-Driven Mode Active:</span> Campaigns follow structured objectives with clear progress tracking. Players work toward AI-suggested goals while exploration is encouraged as a side activity.
                  </p>
                </div>
              )}
            </div>

            {isSaving && (
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            )}
          </CardContent>
          </Card>

          {/* World Info */}
        <Card className="bg-slate-800/50 border-slate-500/30">
          <CardHeader>
            <CardTitle className="text-slate-300">World Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Name</p>
                <p className="text-sm text-white">{world?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Genre</p>
                <p className="text-sm text-white capitalize">{world?.genre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Game System</p>
                <p className="text-sm text-white uppercase">{world?.game_system}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Franchise</p>
                <p className="text-sm text-white">{world?.rulebook_franchise || 'Custom'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rulebook Manager */}
        <WorldRulebookManager worldId={worldId} currentWorld={world} />

        {/* World Mechanics Summary */}
        <WorldMechanicsSummary world={world} rulebooks={rulebooks} />

        {/* Expanded Lore Generator */}
        <ExpandedLoreGenerator worldId={worldId} rulebooks={rulebooks} />

        {/* Full Campaign Generator */}
        <FullCampaignGenerator world={world} rulebooks={rulebooks} />

        {/* NPC Companion Manager */}
        <NPCCompanionManager worldId={worldId} campaignId={campaigns?.[0]?.id} rulebooks={rulebooks} />

        {/* Rulebook Comparison Tool */}
        <RulebookComparisonTool rulebooks={rulebooks} />

        {/* AI-Powered Comparison */}
        <AIRulebookComparison rulebooks={rulebooks} />

        {/* In-Game NPC Roleplay */}
        <InGameNPCRoleplay campaignId={campaigns?.[0]?.id} worldId={worldId} />

        {/* Vector Store Setup */}
        <VectorStoreSetup />

        {/* AI World Building Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-purple-300 mb-3">Character Tools</h3>
            <CharacterBackstoryGenerator worldId={worldId} worldLore={loreEntries || []} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-orange-300 mb-3">Faction Tools</h3>
            <FactionSummaryGenerator worldId={worldId} relationships={relationships || []} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-cyan-300 mb-3">Adventure Tools</h3>
            <PlotHookSuggester worldId={worldId} loreEntries={loreEntries || []} events={events || []} />
          </div>
        </div>

        {/* Visual Builders */}
        <RelationshipMapBuilder worldId={worldId} />
        <TimelineBuilder 
          worldId={worldId} 
          onEventsChange={setTimelineEvents}
          relationships={relationships}
          characters={[]}
        />

        {/* AI Campaign Assistant */}
         {world && (
          <EnhancedCampaignAssistant
            campaign={{ title: world.name, current_scene: "World Overview" }}
            character={{ name: "World Creator", level: 20 }}
            world={world}
            relationships={relationships}
            timeline={timelineEvents}
            sessionRecaps={sessionRecaps}
          />
        )}

        {/* AI Story Weaver */}
        {campaigns.length > 0 && (
          <AIStoryWeaver 
            campaign={campaigns[0]}
            characters={characters}
            world={world}
          />
        )}

        {/* World Simulation Module */}
        <WorldSimulationModule 
          world={world}
          worldState={worldStateData[0]}
          factions={relationships}
        />

        {/* Rules Converters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-500/30">
            <CardHeader>
              <CardTitle className="text-slate-300">MLP Rules Converter</CardTitle>
            </CardHeader>
            <CardContent>
              <MLPRulesConverter worldId={worldId} />
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-500/30">
            <CardHeader>
              <CardTitle className="text-slate-300">General Rule Converter</CardTitle>
            </CardHeader>
            <CardContent>
              <GeneralRuleConverter worldId={worldId} gameSystem={world?.game_system} />
            </CardContent>
          </Card>
        </div>

        {/* Help Text */}
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <p className="text-xs text-amber-300">
            <span className="font-semibold">💡 Tip:</span> You can toggle between Sandbox and Goal-Driven modes for each world independently. This allows different campaigns to have different styles while using the same world.
          </p>
        </div>
      </div>
    </div>
  );
}