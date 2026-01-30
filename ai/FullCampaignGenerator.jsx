import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Save, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function FullCampaignGenerator({ world, rulebooks }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [themes, setThemes] = useState("");
  const [playerCount, setPlayerCount] = useState(4);
  const [campaignLength, setCampaignLength] = useState("medium");
  const [plotHooks, setPlotHooks] = useState("");
  const [npcArchetypes, setNpcArchetypes] = useState("");
  const [customLore, setCustomLore] = useState("");
  const [generatedCampaign, setGeneratedCampaign] = useState(null);

  const saveCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success("Campaign saved!");
    }
  });

  const generateCampaign = async () => {
    if (!world) {
      toast.error("Please select a world first");
      return;
    }

    setLoading(true);
    try {
      const rulebookContext = rulebooks
        ?.filter(r => r.content_extracted)
        .slice(0, 3)
        .map(r => `${r.title}:\nLore: ${JSON.stringify(r.lore_snippets || []).substring(0, 300)}\nNPCs: ${JSON.stringify(r.npcs || []).substring(0, 300)}\nLocations: ${JSON.stringify(r.locations || []).substring(0, 300)}`)
        .join("\n\n") || "No rulebooks available";

      const lengthMap = {
        short: "3-5 sessions",
        medium: "10-15 sessions",
        long: "20+ sessions, epic scale"
      };

      const prompt = `Generate a complete TTRPG campaign outline for the world "${world.name}".

World Details:
- Genre: ${world.genre}
- Game System: ${world.game_system}
- Description: ${world.description}

Player Count: ${playerCount}
Campaign Length: ${lengthMap[campaignLength]}
Themes: ${themes || "Classic adventure"}
${plotHooks ? `\nPlot Hooks to Include:\n${plotHooks}` : ''}
${npcArchetypes ? `\nNPC Archetypes to Feature:\n${npcArchetypes}` : ''}
${customLore ? `\nCustom World Lore:\n${customLore}` : ''}

Rulebook Context:
${rulebookContext}

Create a comprehensive campaign with:
1. Campaign title and tagline
2. Core premise (2-3 sentences)
3. Act structure (3-5 acts with key events)
4. 5-7 major NPCs (names, roles, motivations, secrets)
5. 5 key locations (with atmosphere and hooks)
6. 3-5 major plot twists
7. 10 adventure seeds (session ideas)
8. Final boss/climax concept
9. Alternate endings based on player choices

Return ONLY valid JSON:
{
  "title": "Campaign title",
  "tagline": "One-line pitch",
  "premise": "Campaign premise",
  "acts": [
    {
      "act_number": 1,
      "title": "Act title",
      "description": "What happens",
      "key_events": ["event 1", "event 2"]
    }
  ],
  "major_npcs": [
    {
      "name": "NPC name",
      "role": "role",
      "motivation": "what they want",
      "secret": "hidden agenda",
      "first_appearance": "when/where"
    }
  ],
  "key_locations": [
    {
      "name": "Location",
      "type": "city/dungeon/etc",
      "atmosphere": "mood",
      "hooks": ["hook 1", "hook 2"]
    }
  ],
  "plot_twists": [
    {
      "twist": "twist description",
      "trigger": "when it happens",
      "impact": "consequences"
    }
  ],
  "adventure_seeds": [
    {
      "title": "Session title",
      "description": "What happens",
      "level_range": "1-3",
      "rewards": "xp/loot"
    }
  ],
  "climax": {
    "description": "Final confrontation",
    "location": "where",
    "stakes": "what's at risk"
  },
  "endings": [
    {
      "condition": "player choice",
      "outcome": "result"
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            tagline: { type: "string" },
            premise: { type: "string" },
            acts: { type: "array" },
            major_npcs: { type: "array" },
            key_locations: { type: "array" },
            plot_twists: { type: "array" },
            adventure_seeds: { type: "array" },
            climax: { type: "object" },
            endings: { type: "array" }
          }
        }
      });

      setGeneratedCampaign(result);
      toast.success("Campaign generated!");
    } catch (error) {
      toast.error("Failed to generate campaign");
      console.error(error);
    }
    setLoading(false);
  };

  const saveCampaign = async () => {
    if (!generatedCampaign) return;

    await saveCampaignMutation.mutateAsync({
      world_id: world.id,
      title: generatedCampaign.title,
      story_summary: generatedCampaign.premise,
      active_quests: generatedCampaign.adventure_seeds.slice(0, 5).map(seed => ({
        title: seed.title,
        description: seed.description,
        status: "active"
      })),
      npcs: generatedCampaign.major_npcs.map(npc => ({
        name: npc.name,
        description: npc.role,
        relationship: npc.motivation
      }))
    });
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          AI Campaign Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedCampaign ? (
          <>
            <div>
              <Label>Themes</Label>
              <Input
                value={themes}
                onChange={(e) => setThemes(e.target.value)}
                placeholder="e.g., Political intrigue, cosmic horror, epic war"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label>Plot Hooks (one per line)</Label>
              <Textarea
                value={plotHooks}
                onChange={(e) => setPlotHooks(e.target.value)}
                placeholder="e.g., A mysterious artifact is discovered&#10;The king has been replaced by an imposter"
                rows={3}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label>NPC Archetypes</Label>
              <Input
                value={npcArchetypes}
                onChange={(e) => setNpcArchetypes(e.target.value)}
                placeholder="e.g., Wise mentor, cunning villain, mysterious stranger"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label>Custom World Lore</Label>
              <Textarea
                value={customLore}
                onChange={(e) => setCustomLore(e.target.value)}
                placeholder="Add specific lore, factions, or history unique to your campaign..."
                rows={3}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Player Count</Label>
                <Input
                  type="number"
                  value={playerCount}
                  onChange={(e) => setPlayerCount(parseInt(e.target.value) || 1)}
                  min={1}
                  max={8}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label>Campaign Length</Label>
                <select
                  value={campaignLength}
                  onChange={(e) => setCampaignLength(e.target.value)}
                  className="w-full h-10 bg-slate-700/50 border border-slate-600 rounded-md px-3 text-white text-sm"
                >
                  <option value="short">Short (3-5 sessions)</option>
                  <option value="medium">Medium (10-15 sessions)</option>
                  <option value="long">Long (20+ sessions)</option>
                </select>
              </div>
            </div>

            <Button
              onClick={generateCampaign}
              disabled={loading || !world}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              {loading ? "Generating..." : "Generate Full Campaign"}
            </Button>
          </>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-1">{generatedCampaign.title}</h3>
              <p className="text-sm text-purple-300 italic mb-2">{generatedCampaign.tagline}</p>
              <p className="text-sm text-slate-300">{generatedCampaign.premise}</p>
            </div>

            {/* Acts */}
            <div>
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Act Structure
              </h4>
              <div className="space-y-2">
                {generatedCampaign.acts?.map((act, i) => (
                  <Card key={i} className="bg-slate-700/30 border-slate-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-indigo-300">
                        Act {act.act_number}: {act.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-400 mb-2">{act.description}</p>
                      {act.key_events && (
                        <div className="flex flex-wrap gap-1">
                          {act.key_events.map((event, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{event}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* NPCs */}
            <div>
              <h4 className="font-semibold text-white mb-2">Major NPCs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {generatedCampaign.major_npcs?.slice(0, 6).map((npc, i) => (
                  <Card key={i} className="bg-slate-700/30 border-slate-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-white">{npc.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-400">
                      <p><strong>Role:</strong> {npc.role}</p>
                      <p><strong>Wants:</strong> {npc.motivation}</p>
                      <p className="text-red-400"><strong>Secret:</strong> {npc.secret}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div>
              <h4 className="font-semibold text-white mb-2">Key Locations</h4>
              <div className="space-y-2">
                {generatedCampaign.key_locations?.slice(0, 5).map((loc, i) => (
                  <div key={i} className="bg-slate-700/30 rounded p-2">
                    <p className="text-sm font-semibold text-cyan-300">{loc.name}</p>
                    <p className="text-xs text-slate-400">{loc.atmosphere}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plot Twists */}
            <div>
              <h4 className="font-semibold text-white mb-2">Plot Twists</h4>
              <div className="space-y-1">
                {generatedCampaign.plot_twists?.map((twist, i) => (
                  <div key={i} className="bg-red-900/20 border border-red-500/30 rounded p-2">
                    <p className="text-xs text-red-300"><strong>Twist:</strong> {twist.twist}</p>
                    <p className="text-xs text-slate-400"><strong>When:</strong> {twist.trigger}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Adventure Seeds */}
            <div>
              <h4 className="font-semibold text-white mb-2">Adventure Seeds</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {generatedCampaign.adventure_seeds?.slice(0, 8).map((seed, i) => (
                  <div key={i} className="bg-slate-700/30 rounded p-2">
                    <p className="text-xs font-semibold text-white">{seed.title}</p>
                    <p className="text-xs text-slate-400">{seed.description}</p>
                    <Badge className="mt-1 text-xs">{seed.level_range}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setGeneratedCampaign(null)} variant="outline" className="flex-1">
                Generate New
              </Button>
              <Button onClick={saveCampaign} disabled={saveCampaignMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700">
                {saveCampaignMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Campaign
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}