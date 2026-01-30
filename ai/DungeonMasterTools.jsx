import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Map, Users, Zap } from "lucide-react";
import { toast } from "sonner";

export default function DungeonMasterTools({ messages }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [mapDescription, setMapDescription] = useState("");
  const [generatedMap, setGeneratedMap] = useState(null);
  const [npcData, setNpcData] = useState(null);
  const [plotTwist, setPlotTwist] = useState("");
  const [toolLevel, setToolLevel] = useState(1);
  const [usageCount, setUsageCount] = useState(0);

  const generateMap = async () => {
    if (!mapDescription.trim()) return;
    setIsGenerating(true);
    setUsageCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 10 && toolLevel < 3) setToolLevel(prev => prev + 1);
      return newCount;
    });
    try {
      const qualityBoost = toolLevel > 1 ? `\n\nQUALITY LEVEL ${toolLevel}: Generate EXCEPTIONALLY detailed and creative content with ${toolLevel === 2 ? 'intricate' : 'masterful'} design.` : '';
      const varietyNote = Math.random() > 0.7 ? "\n\nADD UNEXPECTED TWIST: Include a surprising or unique element." : "";
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a detailed map layout based on this description: "${mapDescription}"

Include:
- Room/area names with descriptions
- Points of interest
- Hidden secrets or traps
- Connection between areas
- Suggested encounters
${qualityBoost}${varietyNote}

Return as JSON with areas array.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            areas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  points_of_interest: { type: "array", items: { type: "string" } },
                  secrets: { type: "string" },
                  connections: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setGeneratedMap(response);
      toast.success("Map generated!");
    } catch (error) {
      toast.error("Failed to generate map");
    }
    setIsGenerating(false);
  };

  const generateNPC = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a unique and memorable NPC with:
- Distinctive personality and quirks
- Complete stat block (HP, AC, abilities)
- Motivations and secrets
- Potential plot hooks
- Voice/mannerism suggestions

Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            personality: { type: "string" },
            quirks: { type: "string" },
            stats: {
              type: "object",
              properties: {
                hp: { type: "number" },
                ac: { type: "number" },
                abilities: { type: "string" }
              }
            },
            motivations: { type: "string" },
            secrets: { type: "string" },
            plot_hooks: { type: "array", items: { type: "string" } },
            voice: { type: "string" }
          }
        }
      });

      setNpcData(response);
      toast.success("NPC created!");
    } catch (error) {
      toast.error("Failed to generate NPC");
    }
    setIsGenerating(false);
  };

  const generatePlotTwist = async () => {
    setIsGenerating(true);
    try {
      const recentStory = messages.slice(-20).map(m => m.content).join('\n');
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the recent campaign events, suggest 3 dynamic plot twists that:
- Build on existing story threads
- Subvert player expectations
- Create new narrative opportunities
- Feel organic to the story

Recent Events:
${recentStory}

Provide twists with different intensity levels (minor, moderate, major).`,
        add_context_from_internet: false
      });

      setPlotTwist(response);
      toast.success("Plot twists generated!");
    } catch (error) {
      toast.error("Failed to generate twists");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            DM Tools
          </CardTitle>
          <div className="text-xs text-purple-400">
            Level {toolLevel} • {usageCount} uses
          </div>
        </div>
        {toolLevel > 1 && (
          <p className="text-xs text-green-400 mt-2">
            ✨ Enhanced quality unlocked! Your tools now generate {toolLevel === 2 ? 'better' : 'exceptional'} content.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="npc">NPC</TabsTrigger>
            <TabsTrigger value="twist">Plot Twist</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-3 mt-4">
            <Textarea
              value={mapDescription}
              onChange={(e) => setMapDescription(e.target.value)}
              placeholder="Describe the location (e.g., 'A haunted castle with 5 rooms, secret passages, and a dungeon')"
              className="bg-slate-700/50 border-purple-500/30 text-white min-h-[80px]"
            />
            <Button
              onClick={generateMap}
              disabled={isGenerating || !mapDescription.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Map className="w-4 h-4 mr-2" />}
              Generate Map
            </Button>

            {generatedMap && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-300 text-lg mb-3">{generatedMap.name}</h4>
                <div className="space-y-3">
                  {generatedMap.areas?.map((area, i) => (
                    <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                      <h5 className="font-semibold text-purple-300">{area.name}</h5>
                      <p className="text-xs text-white mt-1">{area.description}</p>
                      {area.points_of_interest?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-purple-400 font-semibold">Points of Interest:</p>
                          <ul className="text-xs text-white ml-3">
                            {area.points_of_interest.map((poi, j) => (
                              <li key={j}>• {poi}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {area.secrets && (
                        <p className="text-xs text-red-400 italic mt-1">Secret: {area.secrets}</p>
                      )}
                      {area.connections?.length > 0 && (
                        <p className="text-xs text-purple-400 mt-1">Connects to: {area.connections.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="npc" className="space-y-3 mt-4">
            <Button
              onClick={generateNPC}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Generate Random NPC
            </Button>

            {npcData && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-300 text-lg mb-2">{npcData.name}</h4>
                <p className="text-sm text-white mb-3">{npcData.description}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-slate-700/30 rounded p-2">
                    <p className="text-xs text-purple-400 font-semibold">HP</p>
                    <p className="text-sm text-white">{npcData.stats?.hp}</p>
                  </div>
                  <div className="bg-slate-700/30 rounded p-2">
                    <p className="text-xs text-purple-400 font-semibold">AC</p>
                    <p className="text-sm text-white">{npcData.stats?.ac}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div><span className="text-purple-400 font-semibold">Personality:</span> <span className="text-white">{npcData.personality}</span></div>
                  <div><span className="text-purple-400 font-semibold">Quirks:</span> <span className="text-white">{npcData.quirks}</span></div>
                  <div><span className="text-purple-400 font-semibold">Voice:</span> <span className="text-white">{npcData.voice}</span></div>
                  <div><span className="text-purple-400 font-semibold">Abilities:</span> <span className="text-white">{npcData.stats?.abilities}</span></div>
                  <div><span className="text-purple-400 font-semibold">Motivations:</span> <span className="text-white">{npcData.motivations}</span></div>
                  <div><span className="text-red-400 font-semibold">Secrets:</span> <span className="text-white">{npcData.secrets}</span></div>
                </div>

                {npcData.plot_hooks?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-purple-400 font-semibold mb-1">Plot Hooks:</p>
                    <ul className="text-xs text-white ml-3">
                      {npcData.plot_hooks.map((hook, i) => (
                        <li key={i}>• {hook}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="twist" className="space-y-3 mt-4">
            <Button
              onClick={generatePlotTwist}
              disabled={isGenerating || messages.length < 5}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Generate Plot Twists
            </Button>

            {plotTwist && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-white whitespace-pre-wrap">{plotTwist}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}