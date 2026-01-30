import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Wand2, Skull, Map } from "lucide-react";
import { toast } from "sonner";

export default function SupplementaryContentGenerator({ rulebook }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [magicItems, setMagicItems] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [adventureHooks, setAdventureHooks] = useState([]);

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

  const generateMagicItems = async () => {
    setIsGenerating(true);
    try {
      const evolutionContext = worldEvolution?.emergent_lore 
        ? JSON.stringify(worldEvolution.emergent_lore.slice(0, 3))
        : 'No world evolution data yet';

      const items = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 unique magic items for ${rulebook.title} (${rulebook.game_system}):

Franchise: ${rulebook.category}
Game Mechanics: ${JSON.stringify(rulebook.game_mechanics)}
World Evolution Context: ${evolutionContext}

Create items that fit the franchise theme and game balance. Include stats compatible with the game system.`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  rarity: { type: "string" },
                  description: { type: "string" },
                  mechanical_effect: { type: "string" },
                  lore: { type: "string" }
                }
              }
            }
          }
        }
      });

      setMagicItems(items.items);
      toast.success("Magic items generated!");
    } catch (error) {
      toast.error("Failed to generate items");
    }
    setIsGenerating(false);
  };

  const generateMonsters = async () => {
    setIsGenerating(true);
    try {
      const evolutionContext = worldEvolution?.emergent_lore 
        ? JSON.stringify(worldEvolution.emergent_lore.slice(0, 3))
        : 'No world evolution data yet';

      const creatures = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 unique monsters for ${rulebook.title} (${rulebook.game_system}):

Franchise Theme: ${rulebook.category}
Existing NPCs: ${JSON.stringify(rulebook.npcs?.slice(0, 3))}
World Evolution: ${evolutionContext}

Create thematically consistent creatures with stats for ${rulebook.game_system}.`,
        response_json_schema: {
          type: "object",
          properties: {
            monsters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  challenge_rating: { type: "string" },
                  description: { type: "string" },
                  abilities: { type: "array", items: { type: "string" } },
                  tactics: { type: "string" },
                  lore_tie_in: { type: "string" }
                }
              }
            }
          }
        }
      });

      setMonsters(creatures.monsters);
      toast.success("Monsters generated!");
    } catch (error) {
      toast.error("Failed to generate monsters");
    }
    setIsGenerating(false);
  };

  const generateAdventureHooks = async () => {
    setIsGenerating(true);
    try {
      const evolutionContext = worldEvolution?.emergent_lore 
        ? JSON.stringify(worldEvolution.emergent_lore.slice(0, 5))
        : 'No world evolution data yet';

      const hooks = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 adventure hooks for ${rulebook.title} (${rulebook.game_system}):

Setting: ${JSON.stringify(rulebook.locations?.slice(0, 3))}
Existing Campaigns: ${JSON.stringify(rulebook.campaigns)}
World Evolution History: ${evolutionContext}

Create hooks that feel like natural continuations of past player actions and world events.`,
        response_json_schema: {
          type: "object",
          properties: {
            hooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  inciting_incident: { type: "string" },
                  connection_to_world_history: { type: "string" },
                  recommended_level: { type: "string" },
                  key_npcs: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setAdventureHooks(hooks.hooks);
      toast.success("Adventure hooks generated!");
    } catch (error) {
      toast.error("Failed to generate hooks");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 mt-4">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Supplementary Content Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
            <TabsTrigger value="items">Magic Items</TabsTrigger>
            <TabsTrigger value="monsters">Monsters</TabsTrigger>
            <TabsTrigger value="hooks">Adventure Hooks</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-3 mt-4">
            <Button
              onClick={generateMagicItems}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Generate Magic Items
            </Button>

            {magicItems.map((item, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-purple-300">{item.name}</h5>
                  <span className="text-xs bg-purple-600 px-2 py-1 rounded">{item.rarity}</span>
                </div>
                <p className="text-sm text-white mb-2">{item.description}</p>
                <div className="text-xs space-y-1">
                  <p className="text-yellow-400">⚡ {item.mechanical_effect}</p>
                  <p className="text-purple-300 italic">{item.lore}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="monsters" className="space-y-3 mt-4">
            <Button
              onClick={generateMonsters}
              disabled={isGenerating}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Skull className="w-4 h-4 mr-2" />}
              Generate Monsters
            </Button>

            {monsters.map((monster, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3 border border-red-500/20">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-red-300">{monster.name}</h5>
                  <span className="text-xs bg-red-600 px-2 py-1 rounded">CR {monster.challenge_rating}</span>
                </div>
                <p className="text-sm text-white mb-2">{monster.description}</p>
                <div className="text-xs space-y-2">
                  <div>
                    <p className="text-red-300 font-semibold">Abilities:</p>
                    <ul className="list-disc list-inside text-white">
                      {monster.abilities?.map((ability, idx) => (
                        <li key={idx}>{ability}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-yellow-400">Tactics: {monster.tactics}</p>
                  <p className="text-purple-300 italic">{monster.lore_tie_in}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="hooks" className="space-y-3 mt-4">
            <Button
              onClick={generateAdventureHooks}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Map className="w-4 h-4 mr-2" />}
              Generate Adventure Hooks
            </Button>

            {adventureHooks.map((hook, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3 border border-indigo-500/20">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-indigo-300">{hook.title}</h5>
                  <span className="text-xs bg-indigo-600 px-2 py-1 rounded">{hook.recommended_level}</span>
                </div>
                <p className="text-sm text-white mb-2">{hook.summary}</p>
                <div className="text-xs space-y-1">
                  <p className="text-yellow-400">🎭 {hook.inciting_incident}</p>
                  <p className="text-purple-300">📜 {hook.connection_to_world_history}</p>
                  {hook.key_npcs?.length > 0 && (
                    <p className="text-green-400">NPCs: {hook.key_npcs.join(', ')}</p>
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