import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Map, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AdventureGenerator({ worldId }) {
  const [params, setParams] = useState({
    genre: "fantasy",
    tone: "epic",
    mainConflict: "",
    partyLevel: 5,
    sessionCount: 5
  });
  const [adventure, setAdventure] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAdventure = async () => {
    if (!params.mainConflict.trim()) {
      toast.error("Please describe the main conflict");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a complete tabletop RPG adventure outline.

Parameters:
- Genre: ${params.genre}
- Tone: ${params.tone}
- Main Conflict: ${params.mainConflict}
- Party Level: ${params.partyLevel}
- Expected Sessions: ${params.sessionCount}

Create an adventure with:
1. Plot Hook: A compelling opening that draws players in (2-3 sentences)
2. Key Locations: 3-4 important locations with brief descriptions and significance
3. NPCs: 4-5 important NPCs with name, role, personality, and their connection to the plot
4. Act Structure: 3 acts with key events and milestones
5. Encounters: 4-5 encounter ideas (combat, social, puzzle) appropriate for level ${params.partyLevel}
6. Climax: A dramatic final encounter or choice that concludes the arc
7. Rewards: Potential magical items, XP, or story rewards
8. Consequences: How player choices affect the world

Format as JSON: { plotHook, locations, npcs, acts, encounters, climax, rewards, consequences }`,
        response_json_schema: {
          type: "object",
          properties: {
            plotHook: { type: "string" },
            locations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  significance: { type: "string" }
                }
              }
            },
            npcs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string" },
                  personality: { type: "string" },
                  connection: { type: "string" }
                }
              }
            },
            acts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  events: { type: "array", items: { type: "string" } }
                }
              }
            },
            encounters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" },
                  difficulty: { type: "string" }
                }
              }
            },
            climax: { type: "string" },
            rewards: { type: "array", items: { type: "string" } },
            consequences: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAdventure(result);
      toast.success('Adventure generated!');
    } catch (error) {
      toast.error('Failed to generate adventure');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {!adventure ? (
        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-purple-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Adventure Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-1 block">Genre</label>
                <select
                  value={params.genre}
                  onChange={(e) => setParams({ ...params, genre: e.target.value })}
                  className="w-full bg-slate-700/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-slate-200"
                >
                  <option value="fantasy">Fantasy</option>
                  <option value="scifi">Sci-Fi</option>
                  <option value="horror">Horror</option>
                  <option value="mystery">Mystery</option>
                  <option value="steampunk">Steampunk</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300 mb-1 block">Tone</label>
                <select
                  value={params.tone}
                  onChange={(e) => setParams({ ...params, tone: e.target.value })}
                  className="w-full bg-slate-700/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-slate-200"
                >
                  <option value="epic">Epic</option>
                  <option value="dark">Dark</option>
                  <option value="comedic">Comedic</option>
                  <option value="intrigue">Intrigue</option>
                  <option value="exploration">Exploration</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300 mb-1 block">Party Level</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={params.partyLevel}
                  onChange={(e) => setParams({ ...params, partyLevel: parseInt(e.target.value) })}
                  className="w-full bg-slate-700/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300 mb-1 block">Sessions</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={params.sessionCount}
                  onChange={(e) => setParams({ ...params, sessionCount: parseInt(e.target.value) })}
                  className="w-full bg-slate-700/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-1 block">Main Conflict</label>
              <textarea
                value={params.mainConflict}
                onChange={(e) => setParams({ ...params, mainConflict: e.target.value })}
                placeholder="What's the central conflict? (e.g., 'A necromancer is raising an undead army')"
                className="w-full bg-slate-700/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-slate-200 min-h-20"
              />
            </div>

            <Button
              onClick={generateAdventure}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Adventure
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-100">Your Adventure</h3>
            <Button
              onClick={() => setAdventure(null)}
              variant="outline"
              className="border-purple-500/50"
            >
              Generate New
            </Button>
          </div>

          {/* Plot Hook */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-300">Plot Hook</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">{adventure.plotHook}</p>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-300 flex items-center gap-2">
                <Map className="w-5 h-5" />
                Key Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {adventure.locations?.map((loc, i) => (
                <div key={i} className="bg-slate-700/30 rounded p-3 border border-slate-600">
                  <h5 className="font-semibold text-slate-200">{loc.name}</h5>
                  <p className="text-sm text-slate-400 mt-1">{loc.description}</p>
                  <Badge className="mt-2 bg-slate-700">{loc.significance}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* NPCs */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-300">Important NPCs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {adventure.npcs?.map((npc, i) => (
                <div key={i} className="bg-slate-700/30 rounded p-3 border border-slate-600">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-semibold text-slate-200">{npc.name}</h5>
                    <Badge className="bg-purple-900 text-xs">{npc.role}</Badge>
                  </div>
                  <p className="text-sm text-slate-400">💬 {npc.personality}</p>
                  <p className="text-sm text-slate-400 mt-1">🔗 {npc.connection}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Acts */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-300">Story Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {adventure.acts?.map((act, i) => (
                <div key={i} className="space-y-1">
                  <h5 className="font-semibold text-slate-200">Act {i + 1}: {act.title}</h5>
                  <ul className="text-sm text-slate-400 space-y-1 ml-4">
                    {act.events?.map((evt, j) => (
                      <li key={j}>• {evt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Encounters */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-300">Potential Encounters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {adventure.encounters?.map((enc, i) => (
                <div key={i} className="bg-slate-700/30 rounded p-3 border border-slate-600">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-semibold text-slate-200">{enc.title}</h5>
                    <Badge className="bg-blue-900 text-xs">{enc.type}</Badge>
                  </div>
                  <p className="text-sm text-slate-400">{enc.description}</p>
                  <Badge className="mt-2 bg-yellow-900 text-xs">{enc.difficulty}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Climax */}
          <Card className="bg-slate-800/50 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-300">Climax</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">{adventure.climax}</p>
            </CardContent>
          </Card>

          {/* Rewards & Consequences */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-300 text-sm">Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-slate-400 space-y-1">
                  {adventure.rewards?.map((r, i) => (
                    <li key={i}>✓ {r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-orange-300 text-sm">Consequences</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-slate-400 space-y-1">
                  {adventure.consequences?.map((c, i) => (
                    <li key={i}>⚡ {c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}