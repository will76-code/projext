import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Package, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

export default function AdvancedCharacterCustomization({ character, world, onApply }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [skillTree, setSkillTree] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [aiLevel, setAiLevel] = useState(1);
  const [usageCount, setUsageCount] = useState(0);

  const generateEquipment = async () => {
    setIsGenerating(true);
    setUsageCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5 && aiLevel < 3) setAiLevel(prev => prev + 1);
      return newCount;
    });
    try {
      const uniqueness = aiLevel === 3 ? '\n\nLEGENDARY MODE: Create truly one-of-a-kind items with extraordinary abilities.' : aiLevel === 2 ? '\n\nRARE MODE: Create highly unique items.' : '';
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 unique equipment items for this character:

Character: ${character.name} - ${character.race} ${character.class_role}
World: ${world.name} (${world.genre})
Backstory: ${character.backstory}

Each item should:
- Fit the character's theme and story
- Have unique abilities or properties
- Include lore/history
- Be visually distinctive
${uniqueness}

Return as JSON array.`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" },
                  abilities: { type: "string" },
                  lore: { type: "string" }
                }
              }
            }
          }
        }
      });

      setEquipment(response.items || []);
      toast.success("Equipment generated!");
    } catch (error) {
      toast.error("Failed to generate equipment");
    }
    setIsGenerating(false);
  };

  const generateSkillTree = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a personalized skill tree for this character based on their playstyle:

Character: ${character.name} - ${character.race} ${character.class_role}
Attributes: ${JSON.stringify(character.attributes)}

Generate 3 skill paths (trees), each with 4 tiers of abilities that build upon each other. Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            paths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  focus: { type: "string" },
                  tiers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tier: { type: "number" },
                        name: { type: "string" },
                        description: { type: "string" },
                        requirements: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setSkillTree(response);
      toast.success("Skill tree generated!");
    } catch (error) {
      toast.error("Failed to generate skill tree");
    }
    setIsGenerating(false);
  };

  const generateCompanion = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a companion NPC that fits this character's theme and backstory:

Character: ${character.name} - ${character.race} ${character.class_role}
Backstory: ${character.backstory}
World: ${world.name}

The companion should:
- Have a meaningful connection to the character
- Complement their abilities
- Have their own personality and goals
- Include stats and abilities

Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            species: { type: "string" },
            appearance: { type: "string" },
            personality: { type: "string" },
            connection: { type: "string" },
            abilities: { type: "array", items: { type: "string" } },
            stats: { type: "object" },
            backstory: { type: "string" }
          }
        }
      });

      setCompanion(response);
      toast.success("Companion created!");
    } catch (error) {
      toast.error("Failed to generate companion");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Advanced Customization
          </CardTitle>
          <div className="text-xs text-purple-400">Lvl {aiLevel} • {usageCount} uses</div>
        </div>
        {aiLevel > 1 && (
          <p className="text-xs text-green-400 mt-1">✨ {aiLevel === 3 ? 'Legendary' : 'Rare'} quality unlocked!</p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="equipment" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="skills">Skill Tree</TabsTrigger>
            <TabsTrigger value="companion">Companion</TabsTrigger>
          </TabsList>

          <TabsContent value="equipment" className="space-y-3 mt-4">
            <Button
              onClick={generateEquipment}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
              Generate Unique Equipment
            </Button>
            {equipment.map((item, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                <h5 className="font-semibold text-purple-300">{item.name}</h5>
                <p className="text-xs text-purple-400 mb-1">{item.type}</p>
                <p className="text-xs text-white mb-2">{item.description}</p>
                <p className="text-xs text-green-400 mb-1"><strong>Abilities:</strong> {item.abilities}</p>
                <p className="text-xs text-purple-400 italic">{item.lore}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="skills" className="space-y-3 mt-4">
            <Button
              onClick={generateSkillTree}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Generate Skill Tree
            </Button>
            {skillTree?.paths?.map((path, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                <h5 className="font-semibold text-purple-300">{path.name}</h5>
                <p className="text-xs text-purple-400 mb-2">{path.focus}</p>
                <div className="space-y-2">
                  {path.tiers?.map((tier, j) => (
                    <div key={j} className="bg-slate-800/50 rounded p-2 pl-4 border-l-2 border-purple-500">
                      <p className="text-xs font-semibold text-purple-300">Tier {tier.tier}: {tier.name}</p>
                      <p className="text-xs text-white">{tier.description}</p>
                      <p className="text-xs text-purple-400 italic mt-1">Requires: {tier.requirements}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="companion" className="space-y-3 mt-4">
            <Button
              onClick={generateCompanion}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Generate Companion NPC
            </Button>
            {companion && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h5 className="font-semibold text-purple-300 text-lg mb-2">{companion.name}</h5>
                <p className="text-sm text-purple-400 mb-3">{companion.species}</p>
                <div className="space-y-2 text-xs">
                  <div><span className="text-purple-400 font-semibold">Appearance:</span> <span className="text-white">{companion.appearance}</span></div>
                  <div><span className="text-purple-400 font-semibold">Personality:</span> <span className="text-white">{companion.personality}</span></div>
                  <div><span className="text-green-400 font-semibold">Connection:</span> <span className="text-white">{companion.connection}</span></div>
                  <div><span className="text-purple-400 font-semibold">Backstory:</span> <span className="text-white">{companion.backstory}</span></div>
                  {companion.abilities && (
                    <div>
                      <span className="text-purple-400 font-semibold">Abilities:</span>
                      <ul className="ml-3 mt-1">
                        {companion.abilities.map((ability, i) => (
                          <li key={i} className="text-white">• {ability}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}