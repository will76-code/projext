import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, MessageCircle, TrendingUp, Lightbulb } from "lucide-react";
import { toast } from "sonner";

export default function EnhancedDungeonMaster({ character, campaign, world, messages }) {
  const [npcName, setNpcName] = useState("");
  const [npcDialogue, setNpcDialogue] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrativePacing, setNarrativePacing] = useState(null);
  const [plotTwist, setPlotTwist] = useState(null);

  const analyzeNarrativePacing = async () => {
    if (messages.length < 5) {
      toast.error("Need more message history");
      return;
    }

    setIsGenerating(true);
    try {
      const recentMessages = messages.slice(-15).map(m => m.content).join('\n');
      const worldEvolution = await base44.entities.WorldEvolution.filter({ world_id: world.id }).catch(() => []);

      const pacing = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze narrative pacing and suggest encounter adjustments:

Character: ${character.name} (Level ${character.level}, HP: ${character.resources?.hp_current}/${character.resources?.hp_max})
Recent Narrative: ${recentMessages}
World State: ${JSON.stringify(worldEvolution[0]?.world_state || {})}

Analyze:
1. Narrative tension level (low/medium/high)
2. Player resource status and fatigue
3. Appropriate next encounter difficulty
4. Pacing recommendations (speed up, maintain, slow down)
5. Suggested encounter type based on current flow`,
        response_json_schema: {
          type: "object",
          properties: {
            tension_level: { type: "string" },
            resource_analysis: { type: "string" },
            recommended_difficulty: { type: "string" },
            pacing_advice: { type: "string" },
            suggested_encounter: {
              type: "object",
              properties: {
                type: { type: "string" },
                description: { type: "string" },
                challenge_rating: { type: "string" }
              }
            }
          }
        }
      });

      setNarrativePacing(pacing);
      toast.success("Pacing analyzed!");
    } catch (error) {
      toast.error("Failed to analyze pacing");
    }
    setIsGenerating(false);
  };

  const generatePlotTwist = async () => {
    setIsGenerating(true);
    try {
      const worldEvolution = await base44.entities.WorldEvolution.filter({ world_id: world.id }).catch(() => []);
      const recentMessages = messages.slice(-20).map(m => m.content).join('\n');

      const twist = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a sophisticated plot twist using WorldEvolution data:

Campaign Context: ${recentMessages}
World Events: ${JSON.stringify(worldEvolution[0]?.simulated_events?.slice(0, 5) || [])}
Emergent Lore: ${JSON.stringify(worldEvolution[0]?.emergent_lore?.slice(0, 5) || [])}
Political Landscape: ${worldEvolution[0]?.world_state?.political_landscape || "Unknown"}

Create a plot twist that:
1. Leverages existing world events or lore
2. Feels earned and foreshadowed
3. Recontextualizes recent campaign events
4. Opens new narrative possibilities`,
        response_json_schema: {
          type: "object",
          properties: {
            twist_title: { type: "string" },
            revelation: { type: "string" },
            connected_lore: { type: "array", items: { type: "string" } },
            narrative_implications: { type: "string" },
            suggested_followup: { type: "string" }
          }
        }
      });

      setPlotTwist(twist);
      toast.success("Plot twist generated!");
    } catch (error) {
      toast.error("Failed to generate plot twist");
    }
    setIsGenerating(false);
  };

  const generateNPCDialogue = async () => {
    if (!npcName.trim()) {
      toast.error("Enter NPC name");
      return;
    }

    setIsGenerating(true);
    try {
      const playerHistory = messages.filter(m => m.role === 'user').slice(-10).map(m => m.content).join('\n');
      const worldEvolution = await base44.entities.WorldEvolution.filter({ world_id: world.id }).catch(() => []);

      const dialogue = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate contextual NPC dialogue for ${npcName}:

World: ${world.name} (${world.rulebook_franchise})
Character: ${character.name}
Player Action History: ${playerHistory}
World State: ${JSON.stringify(worldEvolution[0]?.world_state || {})}
NPC Memory: ${JSON.stringify(worldEvolution[0]?.npc_memory?.[npcName] || "First encounter")}

Generate dialogue that:
1. Reflects player's past interactions
2. References current world state
3. Shows NPC personality and motivations
4. Advances narrative or provides hooks`,
        response_json_schema: {
          type: "object",
          properties: {
            greeting: { type: "string" },
            personality_note: { type: "string" },
            context_references: { type: "array", items: { type: "string" } },
            dialogue_options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mood: { type: "string" },
                  line: { type: "string" }
                }
              }
            },
            information_to_reveal: { type: "string" }
          }
        }
      });

      setNpcDialogue(dialogue);
      toast.success("NPC dialogue ready!");
    } catch (error) {
      toast.error("Failed to generate dialogue");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Enhanced AI Dungeon Master
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Narrative Pacing */}
        <div className="space-y-2">
          <Button
            onClick={analyzeNarrativePacing}
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
            Analyze Narrative Pacing
          </Button>

          {narrativePacing && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-400">Tension:</span>
                <Badge className={
                  narrativePacing.tension_level === 'high' ? 'bg-red-600' :
                  narrativePacing.tension_level === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                }>
                  {narrativePacing.tension_level}
                </Badge>
              </div>
              <p className="text-xs text-white"><span className="text-blue-400">Resources:</span> {narrativePacing.resource_analysis}</p>
              <p className="text-xs text-white"><span className="text-blue-400">Pacing:</span> {narrativePacing.pacing_advice}</p>
              {narrativePacing.suggested_encounter && (
                <div className="bg-slate-800/50 rounded p-2 mt-2">
                  <p className="text-xs text-yellow-400 font-semibold mb-1">Suggested: {narrativePacing.suggested_encounter.type}</p>
                  <p className="text-xs text-white">{narrativePacing.suggested_encounter.description}</p>
                  <Badge className="bg-purple-600 mt-1">CR {narrativePacing.suggested_encounter.challenge_rating}</Badge>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Plot Twist Generator */}
        <div className="space-y-2">
          <Button
            onClick={generatePlotTwist}
            disabled={isGenerating}
            className="w-full bg-pink-600 hover:bg-pink-700"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
            Generate Plot Twist
          </Button>

          {plotTwist && (
            <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-3 space-y-2">
              <h5 className="font-semibold text-pink-300">{plotTwist.twist_title}</h5>
              <p className="text-sm text-white">{plotTwist.revelation}</p>
              {plotTwist.connected_lore?.length > 0 && (
                <div className="text-xs">
                  <p className="text-purple-400 mb-1">Connected to:</p>
                  <ul className="ml-3 text-purple-300">
                    {plotTwist.connected_lore.map((lore, i) => (
                      <li key={i}>• {lore}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-pink-400 italic">{plotTwist.narrative_implications}</p>
            </div>
          )}
        </div>

        {/* NPC Dialogue Generator */}
        <div className="space-y-2">
          <Input
            value={npcName}
            onChange={(e) => setNpcName(e.target.value)}
            placeholder="NPC name"
            className="bg-slate-700/50 border-purple-500/30 text-white"
          />
          <Button
            onClick={generateNPCDialogue}
            disabled={isGenerating}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
            Generate NPC Dialogue
          </Button>

          {npcDialogue && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-green-300">{npcName}</h5>
                <Badge className="bg-green-600 text-xs">{npcDialogue.personality_note}</Badge>
              </div>
              <p className="text-sm text-white italic">"{npcDialogue.greeting}"</p>
              
              {npcDialogue.context_references?.length > 0 && (
                <div className="text-xs">
                  <p className="text-green-400">References:</p>
                  <ul className="ml-3 text-green-300">
                    {npcDialogue.context_references.map((ref, i) => (
                      <li key={i}>• {ref}</li>
                    ))}
                  </ul>
                </div>
              )}

              {npcDialogue.dialogue_options?.length > 0 && (
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-green-400">Dialogue Options:</p>
                  {npcDialogue.dialogue_options.map((option, i) => (
                    <div key={i} className="bg-slate-800/50 rounded p-2">
                      <Badge className="bg-slate-600 text-xs mb-1">{option.mood}</Badge>
                      <p className="text-xs text-white">"{option.line}"</p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-yellow-400 mt-2">💡 {npcDialogue.information_to_reveal}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}