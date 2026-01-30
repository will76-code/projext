import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, TrendingUp, Sword, Package, Target } from "lucide-react";
import { toast } from "sonner";

export default function CharacterProgressionAI({ character, messages }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [upgrades, setUpgrades] = useState({ skills: [], abilities: [], items: [] });
  const [personalQuest, setPersonalQuest] = useState(null);
  const [aiLevel, setAiLevel] = useState(1);
  const [usageCount, setUsageCount] = useState(0);

  const generateProgressionSuggestions = async () => {
    setIsGenerating(true);
    setUsageCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5 && aiLevel < 3) setAiLevel(prev => prev + 1);
      return newCount;
    });
    try {
      const creativityBoost = aiLevel > 1 ? `\n\nCREATIVITY LEVEL ${aiLevel}: Generate ${aiLevel === 2 ? 'highly creative' : 'exceptionally unique'} options with deep narrative integration.` : '';
      const recentActions = messages.slice(-15).map(m => m.content).join('\n');
      const context = `
Character: ${character.name} - Level ${character.level} ${character.race} ${character.class_role}
Backstory: ${character.backstory}
Attributes: ${JSON.stringify(character.attributes)}
Recent Actions: ${recentActions}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this character's journey, suggest:
1. 3 skill upgrades relevant to their actions and class
2. 3 new abilities that fit their progression
3. 3 items/equipment that would enhance their playstyle

${context}
${creativityBoost}

Make suggestions specific and tied to their recent experiences. Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            abilities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setUpgrades(response);
      toast.success("Progression suggestions generated!");
    } catch (error) {
      toast.error("Failed to generate suggestions");
    }
    setIsGenerating(false);
  };

  const generatePersonalQuest = async () => {
    setIsGenerating(true);
    try {
      const context = `
Character: ${character.name} - ${character.race} ${character.class_role}
Backstory: ${character.backstory}
Special Traits: ${JSON.stringify(character.special_things)}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a deeply personal quest for this character based on their backstory and motivations. The quest should:
- Connect to their past
- Challenge their beliefs or abilities
- Offer meaningful character development
- Have multiple stages with twists

${context}

Return as JSON with title, description, stages array, and potential rewards.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            stages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage_name: { type: "string" },
                  objective: { type: "string" },
                  twist: { type: "string" }
                }
              }
            },
            rewards: { type: "string" }
          }
        }
      });

      setPersonalQuest(response);
      toast.success("Personal quest created!");
    } catch (error) {
      toast.error("Failed to generate quest");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Character Progression AI
          </CardTitle>
          <div className="text-xs text-purple-400">Lvl {aiLevel} • {usageCount} uses</div>
        </div>
        {aiLevel > 1 && (
          <p className="text-xs text-green-400 mt-1">✨ Enhanced creativity! More unique suggestions.</p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="progression" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
            <TabsTrigger value="progression">Upgrades</TabsTrigger>
            <TabsTrigger value="quest">Personal Quest</TabsTrigger>
          </TabsList>

          <TabsContent value="progression" className="space-y-3 mt-4">
            <Button
              onClick={generateProgressionSuggestions}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Progression Suggestions
            </Button>

            {upgrades.skills?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Skill Upgrades
                </h4>
                {upgrades.skills.map((skill, i) => (
                  <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                    <h5 className="font-semibold text-purple-300 text-sm">{skill.name}</h5>
                    <p className="text-xs text-white mt-1">{skill.description}</p>
                    <p className="text-xs text-purple-400 italic mt-1">Why: {skill.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {upgrades.abilities?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                  <Sword className="w-4 h-4" />
                  New Abilities
                </h4>
                {upgrades.abilities.map((ability, i) => (
                  <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                    <h5 className="font-semibold text-purple-300 text-sm">{ability.name}</h5>
                    <p className="text-xs text-white mt-1">{ability.description}</p>
                    <p className="text-xs text-purple-400 italic mt-1">Why: {ability.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {upgrades.items?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Recommended Items
                </h4>
                {upgrades.items.map((item, i) => (
                  <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                    <h5 className="font-semibold text-purple-300 text-sm">{item.name}</h5>
                    <p className="text-xs text-white mt-1">{item.description}</p>
                    <p className="text-xs text-purple-400 italic mt-1">Why: {item.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quest" className="space-y-3 mt-4">
            <Button
              onClick={generatePersonalQuest}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Personal Quest
            </Button>

            {personalQuest && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-300 text-lg mb-2">{personalQuest.title}</h4>
                <p className="text-sm text-white mb-4">{personalQuest.description}</p>
                
                <div className="space-y-2">
                  <h5 className="font-semibold text-purple-400 text-sm">Quest Stages:</h5>
                  {personalQuest.stages?.map((stage, i) => (
                    <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                      <p className="font-semibold text-purple-300 text-sm">Stage {i + 1}: {stage.stage_name}</p>
                      <p className="text-xs text-white mt-1">{stage.objective}</p>
                      <p className="text-xs text-red-400 italic mt-1">Twist: {stage.twist}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-400">Rewards:</p>
                  <p className="text-xs text-white">{personalQuest.rewards}</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}