import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, BookOpen, Globe, Skull, Zap } from "lucide-react";
import { toast } from "sonner";

export default function DeepLoreGenerator({ world }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pantheon, setPantheon] = useState(null);
  const [prophecy, setProphecy] = useState(null);
  const [ancientEvil, setAncientEvil] = useState(null);
  const [cosmicConflict, setCosmicConflict] = useState(null);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");

  const generatePantheon = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a COMPLEX PANTHEON for ${world.name}:

World: ${world.name}
Genre: ${world.genre}
Description: ${world.description}

Generate:
- 7-10 major deities with detailed domains
- Creation mythology
- Divine relationships (alliances, rivalries, romances)
- Religious orders and practices
- Holy symbols and artifacts
- Theological schisms and heresies
- How mortals interact with divinity
- Divine intervention mechanics

Return comprehensive JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            creation_myth: { type: "string" },
            deities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  title: { type: "string" },
                  domains: { type: "array", items: { type: "string" } },
                  description: { type: "string" },
                  personality: { type: "string" },
                  relationships: { type: "string" },
                  symbols: { type: "array", items: { type: "string" } },
                  worshippers: { type: "string" }
                }
              }
            },
            religious_orders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  deity: { type: "string" },
                  practices: { type: "string" },
                  influence: { type: "string" }
                }
              }
            },
            theological_conflicts: { type: "array", items: { type: "string" } }
          }
        }
      });

      setPantheon(response);
      toast.success("Pantheon created!");
    } catch (error) {
      toast.error("Failed to generate pantheon");
    }
    setIsGenerating(false);
  };

  const generateProphecy = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create world-shaping PROPHECIES for ${world.name}:

Generate 3 ancient prophecies that:
- Have cryptic, interpretable wording
- Affect multiple factions
- Can be fulfilled in unexpected ways
- Create dramatic tension
- Link to current events

Include origins, interpretations, and how they drive conflict.`,
        response_json_schema: {
          type: "object",
          properties: {
            prophecies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  text: { type: "string" },
                  origin: { type: "string" },
                  age: { type: "string" },
                  interpretations: { type: "array", items: { type: "string" } },
                  signs_of_fulfillment: { type: "array", items: { type: "string" } },
                  factions_involved: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setProphecy(response);
      toast.success("Prophecies generated!");
    } catch (error) {
      toast.error("Failed to generate prophecies");
    }
    setIsGenerating(false);
  };

  const generateAncientEvil = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an ANCIENT EVIL for ${world.name}:

Genre: ${world.genre}

Generate:
- Ancient threat with vast scope
- How it was sealed/defeated
- Signs of its return
- Cultists and followers
- Artifacts of power
- World-ending plans
- Connection to world history
- Campaign hooks

Make it terrifying and epic.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            origin: { type: "string" },
            nature: { type: "string" },
            first_age: { type: "string" },
            defeat_method: { type: "string" },
            prison_location: { type: "string" },
            signs_of_return: { type: "array", items: { type: "string" } },
            cultists: { type: "string" },
            artifacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  power: { type: "string" },
                  corruption: { type: "string" }
                }
              }
            },
            endgame_plan: { type: "string" },
            campaign_hooks: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAncientEvil(response);
      toast.success("Ancient evil awakens!");
    } catch (error) {
      toast.error("Failed to generate ancient evil");
    }
    setIsGenerating(false);
  };

  const generateCosmicConflict = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a COSMIC CONFLICT for ${world.name}:

Generate an overarching multiversal/planar conflict:
- Opposing cosmic forces
- Stakes that transcend this world
- Multiple fronts of conflict
- How mortals are pawns
- Secret conspiracies
- Neutral factions
- Endgame scenarios

This should be epic, spanning campaigns.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            scope: { type: "string" },
            opposing_forces: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  goal: { type: "string" },
                  methods: { type: "string" },
                  champions: { type: "array", items: { type: "string" } }
                }
              }
            },
            stakes: { type: "string" },
            battlegrounds: { type: "array", items: { type: "string" } },
            mortal_role: { type: "string" },
            hidden_truths: { type: "array", items: { type: "string" } },
            possible_endings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  outcome: { type: "string" },
                  consequence: { type: "string" }
                }
              }
            }
          }
        }
      });

      setCosmicConflict(response);
      toast.success("Cosmic conflict revealed!");
    } catch (error) {
      toast.error("Failed to generate cosmic conflict");
    }
    setIsGenerating(false);
  };

  const askFollowUp = async () => {
    if (!followUpQuery.trim()) return;
    setIsGenerating(true);
    try {
      const context = `
Pantheon: ${JSON.stringify(pantheon)}
Prophecies: ${JSON.stringify(prophecy)}
Ancient Evil: ${JSON.stringify(ancientEvil)}
Cosmic Conflict: ${JSON.stringify(cosmicConflict)}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on the generated lore for ${world.name}, answer this question in detail:

${context}

Question: ${followUpQuery}

Provide deep, consistent answers that enhance the lore.`,
        add_context_from_internet: false
      });

      setFollowUpAnswer(response);
    } catch (error) {
      toast.error("Failed to answer question");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Deep Lore Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pantheon" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-700/50">
            <TabsTrigger value="pantheon">Pantheon</TabsTrigger>
            <TabsTrigger value="prophecy">Prophecies</TabsTrigger>
            <TabsTrigger value="evil">Ancient Evil</TabsTrigger>
            <TabsTrigger value="cosmic">Cosmic</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
          </TabsList>

          <TabsContent value="pantheon" className="space-y-3 mt-4">
            <Button
              onClick={generatePantheon}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Complex Pantheon
            </Button>

            {pantheon && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                  <h5 className="font-semibold text-purple-300 mb-2">Creation Myth</h5>
                  <p className="text-sm text-white">{pantheon.creation_myth}</p>
                </div>

                {pantheon.deities?.map((deity, i) => (
                  <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                    <h5 className="font-semibold text-purple-300">{deity.name}</h5>
                    <p className="text-xs text-purple-400 italic mb-2">{deity.title}</p>
                    <p className="text-xs text-white mb-2">{deity.description}</p>
                    <div className="text-xs space-y-1">
                      <p><span className="text-purple-400">Domains:</span> {deity.domains?.join(', ')}</p>
                      <p><span className="text-purple-400">Symbols:</span> {deity.symbols?.join(', ')}</p>
                      <p><span className="text-purple-400">Relationships:</span> {deity.relationships}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="prophecy" className="space-y-3 mt-4">
            <Button
              onClick={generateProphecy}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
              Generate Prophecies
            </Button>

            {prophecy?.prophecies?.map((prop, i) => (
              <div key={i} className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                <h5 className="font-semibold text-indigo-300 mb-2">{prop.title}</h5>
                <p className="text-sm italic text-indigo-200 mb-3">"{prop.text}"</p>
                <div className="space-y-2 text-xs">
                  <p><span className="text-indigo-400">Origin:</span> {prop.origin}</p>
                  <p><span className="text-indigo-400">Age:</span> {prop.age}</p>
                  <div>
                    <p className="text-indigo-400 mb-1">Interpretations:</p>
                    <ul className="ml-3 space-y-1">
                      {prop.interpretations?.map((int, j) => (
                        <li key={j}>• {int}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="evil" className="space-y-3 mt-4">
            <Button
              onClick={generateAncientEvil}
              disabled={isGenerating}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Skull className="w-4 h-4 mr-2" />}
              Generate Ancient Evil
            </Button>

            {ancientEvil && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <h5 className="font-semibold text-red-300 text-lg mb-1">{ancientEvil.name}</h5>
                <p className="text-sm text-red-400 italic mb-3">{ancientEvil.title}</p>
                <div className="space-y-2 text-xs text-white">
                  <p><span className="text-red-400">Nature:</span> {ancientEvil.nature}</p>
                  <p><span className="text-red-400">Origin:</span> {ancientEvil.origin}</p>
                  <p><span className="text-red-400">Sealed:</span> {ancientEvil.defeat_method}</p>
                  <p><span className="text-red-400">Prison:</span> {ancientEvil.prison_location}</p>
                  
                  <div>
                    <p className="text-red-400 mb-1">Signs of Return:</p>
                    <ul className="ml-3 space-y-1">
                      {ancientEvil.signs_of_return?.map((sign, i) => (
                        <li key={i}>⚠ {sign}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-950/50 rounded p-2 mt-2">
                    <p className="text-red-300 font-semibold mb-1">Endgame:</p>
                    <p>{ancientEvil.endgame_plan}</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cosmic" className="space-y-3 mt-4">
            <Button
              onClick={generateCosmicConflict}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Generate Cosmic Conflict
            </Button>

            {cosmicConflict && (
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-4">
                <h5 className="font-semibold text-purple-300 text-lg mb-2">{cosmicConflict.title}</h5>
                <p className="text-sm text-white mb-3">{cosmicConflict.scope}</p>
                
                <div className="space-y-3 text-xs">
                  {cosmicConflict.opposing_forces?.map((force, i) => (
                    <div key={i} className="bg-slate-800/50 rounded p-2">
                      <p className="font-semibold text-purple-300">{force.name}</p>
                      <p className="text-white mt-1">{force.goal}</p>
                    </div>
                  ))}

                  <p><span className="text-pink-400 font-semibold">Stakes:</span> {cosmicConflict.stakes}</p>
                  
                  <div>
                    <p className="text-purple-400 mb-1">Hidden Truths:</p>
                    <ul className="ml-3 space-y-1 text-white">
                      {cosmicConflict.hidden_truths?.map((truth, i) => (
                        <li key={i}>• {truth}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="explore" className="space-y-3 mt-4">
            <p className="text-sm text-purple-300 mb-2">
              Ask follow-up questions to explore the lore deeper
            </p>
            <Textarea
              value={followUpQuery}
              onChange={(e) => setFollowUpQuery(e.target.value)}
              placeholder="e.g., 'How do the prophecies relate to the ancient evil?'"
              className="bg-slate-700/50 border-purple-500/30 text-white"
            />
            <Button
              onClick={askFollowUp}
              disabled={isGenerating || !followUpQuery.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Explore Lore
            </Button>

            {followUpAnswer && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-white whitespace-pre-wrap">{followUpAnswer}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}