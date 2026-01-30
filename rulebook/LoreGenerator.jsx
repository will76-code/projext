import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Loader2, Clock, Users } from "lucide-react";
import { toast } from "sonner";

export default function LoreGenerator({ rulebook }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [loreSnippets, setLoreSnippets] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [factions, setFactions] = useState([]);

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', rulebook.game_system],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ game_system: rulebook.game_system });
      if (worlds.length === 0) return null;
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worlds[0].id });
      return evolution[0] || null;
    },
    initialData: null
  });

  const generateLoreSnippets = async () => {
    setIsGenerating(true);
    try {
      const evolutionContext = worldEvolution?.emergent_lore 
        ? JSON.stringify(worldEvolution.emergent_lore.slice(0, 5))
        : 'No world evolution yet';

      const snippets = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 rich lore snippets for ${rulebook.title} (${rulebook.game_system}):

Rulebook Content: ${JSON.stringify(rulebook.locations?.slice(0, 3))}
NPCs: ${JSON.stringify(rulebook.npcs?.slice(0, 3))}
World Evolution: ${evolutionContext}

Create snippets that:
- Build on existing rulebook lore
- Reference past player actions from evolution
- Feel like natural world-building
- Add depth without contradicting source material

Return as JSON with snippet array containing title and content.`,
        response_json_schema: {
          type: "object",
          properties: {
            snippets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  relevance: { type: "string" }
                }
              }
            }
          }
        }
      });

      setLoreSnippets(snippets.snippets);
      toast.success("Lore snippets generated!");
    } catch (error) {
      toast.error("Failed to generate lore");
    }
    setIsGenerating(false);
  };

  const generateTimeline = async () => {
    setIsGenerating(true);
    try {
      const evolutionContext = worldEvolution ? {
        campaign_states: worldEvolution.campaign_states || [],
        emergent_lore: worldEvolution.emergent_lore?.slice(0, 5) || []
      } : {};

      const timelineData = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a historical timeline for ${rulebook.title}:

Rulebook Campaigns: ${JSON.stringify(rulebook.campaigns)}
World Evolution History: ${JSON.stringify(evolutionContext)}

Generate a timeline that:
- Integrates rulebook canon with player-driven events
- Shows how past campaigns shaped history
- Creates a coherent historical narrative
- Dates events appropriately for the setting

Return as JSON with events array (year, title, description, impact).`,
        response_json_schema: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  year: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" }
                }
              }
            }
          }
        }
      });

      setTimeline(timelineData.events);
      toast.success("Timeline generated!");
    } catch (error) {
      toast.error("Failed to generate timeline");
    }
    setIsGenerating(false);
  };

  const generateFactions = async () => {
    setIsGenerating(true);
    try {
      const evolutionContext = worldEvolution?.world_state || {};

      const factionsData = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate faction details for ${rulebook.title}:

Existing NPCs: ${JSON.stringify(rulebook.npcs?.slice(0, 5))}
Current World State: ${JSON.stringify(evolutionContext)}

Create 3-5 factions that:
- Reflect world state changes from player actions
- Have dynamic relationships shaped by world evolution
- Include key NPCs from rulebook
- Show power shifts from past campaigns

Return as JSON with factions array (name, description, goals, power_level, relationships).`,
        response_json_schema: {
          type: "object",
          properties: {
            factions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  goals: { type: "string" },
                  power_level: { type: "string" },
                  relationships: { type: "object" }
                }
              }
            }
          }
        }
      });

      setFactions(factionsData.factions);
      toast.success("Factions generated!");
    } catch (error) {
      toast.error("Failed to generate factions");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 mt-4">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Contextual Lore Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="snippets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
            <TabsTrigger value="snippets">Lore</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="factions">Factions</TabsTrigger>
          </TabsList>

          <TabsContent value="snippets" className="space-y-3 mt-4">
            <Button
              onClick={generateLoreSnippets}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
              Generate Lore Snippets
            </Button>

            {loreSnippets.map((snippet, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3 border border-indigo-500/20">
                <h5 className="font-semibold text-indigo-300 mb-2">{snippet.title}</h5>
                <p className="text-sm text-white mb-2">{snippet.content}</p>
                <p className="text-xs text-indigo-400 italic">{snippet.relevance}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3 mt-4">
            <Button
              onClick={generateTimeline}
              disabled={isGenerating}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
              Generate Historical Timeline
            </Button>

            <div className="space-y-2">
              {timeline.map((event, i) => (
                <div key={i} className="bg-slate-700/30 rounded-lg p-3 border-l-4 border-amber-500">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-bold text-amber-400">{event.year}</span>
                  </div>
                  <h5 className="font-semibold text-amber-300 text-sm mb-1">{event.title}</h5>
                  <p className="text-xs text-white mb-2">{event.description}</p>
                  <p className="text-xs text-amber-400">Impact: {event.impact}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="factions" className="space-y-3 mt-4">
            <Button
              onClick={generateFactions}
              disabled={isGenerating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Generate Faction Details
            </Button>

            {factions.map((faction, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3 border border-green-500/20">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-green-300">{faction.name}</h5>
                  <span className="text-xs bg-green-600 px-2 py-1 rounded">{faction.power_level}</span>
                </div>
                <p className="text-sm text-white mb-2">{faction.description}</p>
                <div className="text-xs space-y-1">
                  <p className="text-yellow-400">Goals: {faction.goals}</p>
                  {faction.relationships && Object.keys(faction.relationships).length > 0 && (
                    <div className="text-green-300 mt-2">
                      <p className="font-semibold mb-1">Relationships:</p>
                      {Object.entries(faction.relationships).map(([key, value], idx) => (
                        <p key={idx} className="ml-2">• {key}: {value}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}