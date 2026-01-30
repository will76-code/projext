import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, BookOpen, Skull, Swords } from "lucide-react";
import { toast } from "sonner";

export default function CampaignGenerator({ world, onSelectCampaign }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  const generateCampaigns = async () => {
    setIsGenerating(true);
    try {
      const context = `
World: ${world.name}
Genre: ${world.genre}
Game System: ${world.game_system}
Description: ${world.description}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 COMPLETELY different long-form campaign concepts for this world with VARIED DESCRIPTIONS:

1. **Epic Saga Campaign** - Grand narrative with world-changing stakes. Descriptions should be ${Math.random() > 0.5 ? 'poetic and grandiose' : 'detailed and atmospheric'}. Multiple story arcs.

2. **Dark Mystery Campaign** - Suspenseful investigation. Use ${Math.random() > 0.5 ? 'terse, noir-style prose' : 'elaborate descriptive passages'}. Red herrings and plot twists.

3. **Chaotic Adventure Campaign** - Unpredictable journey. Narrative style should be ${Math.random() > 0.5 ? 'sporadic and punchy' : 'flowing and dramatic'}. Keep players on edge with surprising tonal shifts.

${context}

Each campaign should include:
- Compelling title
- Hook that grabs players immediately
- 5+ major story arcs with twists
- Key NPCs (allies and antagonists)
- Long-term mysteries to uncover
- Unique mechanics or themes
- Potential endings (good/bad/secret)

Make each campaign playable for 20+ sessions with depth and replayability. Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            campaigns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  title: { type: "string" },
                  tagline: { type: "string" },
                  hook: { type: "string" },
                  story_arcs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        arc_name: { type: "string" },
                        description: { type: "string" },
                        twist: { type: "string" }
                      }
                    }
                  },
                  key_npcs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string" },
                        secret: { type: "string" }
                      }
                    }
                  },
                  mysteries: { type: "array", items: { type: "string" } },
                  unique_mechanics: { type: "string" },
                  endings: {
                    type: "object",
                    properties: {
                      good: { type: "string" },
                      bad: { type: "string" },
                      secret: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setCampaigns(response.campaigns || []);
      toast.success("Campaigns generated!");
    } catch (error) {
      toast.error("Failed to generate campaigns");
    }
    setIsGenerating(false);
  };

  const campaignIcons = {
    "Epic Saga": BookOpen,
    "Dark Mystery": Skull,
    "Chaotic Adventure": Swords
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Campaign Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-purple-300">
          Generate three unique long-form campaigns with depth, twists, and replayability
        </p>

        <Button
          onClick={generateCampaigns}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Campaigns...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate 3 Campaign Types
            </>
          )}
        </Button>

        {campaigns.map((campaign, i) => {
          const Icon = campaignIcons[campaign.type] || BookOpen;
          
          return (
            <Card key={i} className="bg-slate-700/30 border-purple-500/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-6 h-6 text-purple-400" />
                    <div>
                      <CardTitle className="text-lg text-purple-300">{campaign.title}</CardTitle>
                      <p className="text-xs text-purple-400 italic">{campaign.tagline}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-purple-500/50">{campaign.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-purple-400 mb-1">Opening Hook</p>
                  <p className="text-sm text-white">{campaign.hook}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-purple-400 mb-2">Story Arcs ({campaign.story_arcs?.length || 0})</p>
                  <div className="space-y-2">
                    {campaign.story_arcs?.slice(0, 3).map((arc, j) => (
                      <div key={j} className="bg-slate-800/50 rounded p-2">
                        <p className="text-xs font-semibold text-purple-300">{arc.arc_name}</p>
                        <p className="text-xs text-white mt-1">{arc.description}</p>
                        <p className="text-xs text-red-400 italic mt-1">⚠ {arc.twist}</p>
                      </div>
                    ))}
                    {campaign.story_arcs?.length > 3 && (
                      <p className="text-xs text-purple-400 italic">+ {campaign.story_arcs.length - 3} more arcs...</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-purple-400 mb-1">Key NPCs</p>
                  <div className="grid grid-cols-2 gap-2">
                    {campaign.key_npcs?.slice(0, 4).map((npc, j) => (
                      <div key={j} className="bg-slate-800/50 rounded p-2">
                        <p className="text-xs font-semibold text-purple-300">{npc.name}</p>
                        <p className="text-xs text-white">{npc.role}</p>
                        <p className="text-xs text-red-400 italic mt-1">🤫 {npc.secret}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {campaign.mysteries?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-purple-400 mb-1">Mysteries to Uncover</p>
                    <ul className="text-xs text-white ml-3 space-y-1">
                      {campaign.mysteries.slice(0, 3).map((mystery, j) => (
                        <li key={j}>• {mystery}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-purple-400 mb-1">Unique Mechanics</p>
                  <p className="text-xs text-white">{campaign.unique_mechanics}</p>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3">
                  <p className="text-xs font-semibold text-purple-400 mb-2">Possible Endings</p>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-green-400">✓ Good:</span> <span className="text-white">{campaign.endings?.good}</span></p>
                    <p><span className="text-red-400">✗ Bad:</span> <span className="text-white">{campaign.endings?.bad}</span></p>
                    <p><span className="text-purple-400">★ Secret:</span> <span className="text-white">{campaign.endings?.secret}</span></p>
                  </div>
                </div>

                <Button
                  onClick={() => onSelectCampaign(campaign)}
                  className="w-full bg-green-600 hover:bg-green-700 mt-2"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Use This Campaign
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}