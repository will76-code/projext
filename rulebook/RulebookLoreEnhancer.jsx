import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, MapPin, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RulebookLoreEnhancer({ rulebookId, worldId }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);

  const { data: rulebook } = useQuery({
    queryKey: ['rulebook', rulebookId],
    queryFn: async () => {
      const books = await base44.entities.Rulebook.filter({ id: rulebookId });
      return books[0];
    },
    enabled: !!rulebookId
  });

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      if (!worldId) return null;
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const generateLoreSnippets = async () => {
    setIsGenerating(true);
    try {
      const content = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate contextually relevant lore snippets using rulebook and world evolution:

Rulebook: ${rulebook?.title}
Category: ${rulebook?.category}
Game System: ${rulebook?.game_system}

Extracted Content:
- NPCs: ${rulebook?.npcs?.length || 0} entries
- Locations: ${rulebook?.locations?.length || 0} entries
- Character Options: ${JSON.stringify(rulebook?.character_options || {})}

World Evolution Context:
${JSON.stringify(worldEvolution || {})}

Generate:
1. 3-5 lore snippets that blend rulebook content with world evolution
2. Historical timeline connecting rulebook lore to current world state
3. Faction details that incorporate rulebook and world changes
4. Quest hooks tied to both rulebook and evolved world`,
        response_json_schema: {
          type: "object",
          properties: {
            lore_snippets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  rulebook_reference: { type: "string" },
                  world_relevance: { type: "string" }
                }
              }
            },
            historical_timeline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  era: { type: "string" },
                  events: { type: "array", items: { type: "string" } },
                  world_state: { type: "string" }
                }
              }
            },
            faction_details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  origin: { type: "string" },
                  current_status: { type: "string" },
                  goals: { type: "array", items: { type: "string" } }
                }
              }
            },
            quest_hooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  level_range: { type: "string" },
                  connections: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setGeneratedContent(content);
      toast.success('Lore content generated!');
    } catch (error) {
      toast.error('Failed to generate lore');
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Rulebook Lore Enhancer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-700/30 rounded p-3">
          <p className="text-xs text-slate-400">
            <span className="text-purple-400 font-semibold">{rulebook?.title}</span> - {rulebook?.category}
          </p>
        </div>

        <Button
          onClick={generateLoreSnippets}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
          Generate Enhanced Lore
        </Button>

        {generatedContent && (
          <Tabs defaultValue="snippets" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
              <TabsTrigger value="snippets" className="text-xs">Snippets</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="factions" className="text-xs">Factions</TabsTrigger>
              <TabsTrigger value="quests" className="text-xs">Quests</TabsTrigger>
            </TabsList>

            {/* Lore Snippets */}
            <TabsContent value="snippets" className="space-y-2 mt-3">
              {generatedContent.lore_snippets?.map((snippet, i) => (
                <div key={i} className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 space-y-2">
                  <h5 className="font-semibold text-emerald-300 text-sm">{snippet.title}</h5>
                  <p className="text-xs text-emerald-200">{snippet.content}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-emerald-600 text-xs">{snippet.rulebook_reference}</Badge>
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-300 text-xs">{snippet.world_relevance}</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Historical Timeline */}
            <TabsContent value="timeline" className="space-y-2 mt-3">
              {generatedContent.historical_timeline?.map((era, i) => (
                <div key={i} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                  <Badge className="bg-blue-600 mb-2">{era.era}</Badge>
                  <ul className="ml-3 text-xs text-blue-300 space-y-1">
                    {era.events.map((event, j) => (
                      <li key={j}>• {event}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-blue-400 mt-2">🌍 {era.world_state}</p>
                </div>
              ))}
            </TabsContent>

            {/* Faction Details */}
            <TabsContent value="factions" className="space-y-2 mt-3">
              {generatedContent.faction_details?.map((faction, i) => (
                <div key={i} className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-3 space-y-2">
                  <h5 className="font-semibold text-pink-300">{faction.name}</h5>
                  <div className="text-xs text-pink-200 space-y-1">
                    <p><span className="text-pink-400">Origin:</span> {faction.origin}</p>
                    <p><span className="text-pink-400">Status:</span> {faction.current_status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-400 mb-1">Goals:</p>
                    <ul className="ml-3 text-xs text-pink-300">
                      {faction.goals.map((goal, j) => (
                        <li key={j}>• {goal}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Quest Hooks */}
            <TabsContent value="quests" className="space-y-2 mt-3">
              {generatedContent.quest_hooks?.map((quest, i) => (
                <div key={i} className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-orange-300">{quest.title}</h5>
                    <Badge className="bg-orange-600 text-xs">{quest.level_range}</Badge>
                  </div>
                  <p className="text-xs text-orange-200">{quest.description}</p>
                  {quest.connections?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {quest.connections.map((conn, j) => (
                        <Badge key={j} variant="outline" className="border-orange-500/50 text-orange-300 text-xs">
                          {conn}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}