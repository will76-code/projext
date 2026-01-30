import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function CampaignStorytellerAI({ campaign, character, world, worldEvolution }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrative, setNarrative] = useState(null);
  const [npcDialogue, setNpcDialogue] = useState(null);
  const [plotHooks, setPlotHooks] = useState(null);
  const [encounter, setEncounter] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [ambientMusic, setAmbientMusic] = useState(null);

  const { data: messages } = useQuery({
    queryKey: ['messages', campaign?.id],
    queryFn: async () => {
      const msgs = await base44.entities.ConversationMessage.filter({ campaign_id: campaign?.id });
      return msgs.slice(-50);
    },
    enabled: !!campaign?.id
  });

  const generateNarrative = async () => {
    setIsGenerating(true);
    try {
      const recentEvents = messages?.slice(-10).map(m => m.content).join('\n') || '';

      const generated = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate compelling narrative prose that continues the campaign, maintaining narrative coherence and tone:

Campaign: ${campaign?.title}
Campaign Tones: ${campaign?.campaign_tones?.join(', ') || 'Epic Adventure'}
Character: ${character?.name} (${character?.race} ${character?.class_role})
World: ${world?.name}

Recent Events:
${recentEvents.slice(0, 500)}

World Evolution Context:
${JSON.stringify(worldEvolution?.world_state || {})}

Current Emergent Lore:
${JSON.stringify(worldEvolution?.emergent_lore?.slice(0, 3) || [])}

Generate a narrative paragraph (200-300 words) that:
1. Follows the established campaign tone (${campaign?.campaign_tones?.join(', ')})
2. References recent player actions and decisions
3. Builds on the world's existing lore
4. Sets up future challenges or opportunities
5. Maintains dramatic pacing appropriate to the narrative
6. Includes sensory details and atmosphere`,
      });

      setNarrative(generated);
      toast.success('Narrative generated!');
    } catch (error) {
      toast.error('Failed to generate narrative');
    }
    setIsGenerating(false);
  };

  const generateNPCDialogue = async () => {
    setIsGenerating(true);
    try {
      const npcs = campaign?.npcs || [];
      const selectedNPC = npcs[Math.floor(Math.random() * npcs.length)];

      if (!selectedNPC) {
        toast.error('No NPCs in this campaign');
        setIsGenerating(false);
        return;
      }

      // Get character's past actions and traits
      const pastActions = messages?.slice(-20).map(m => m.content).join('\n') || '';
      
      const dialogue = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate authentic NPC dialogue that is personalized to the character and advances the narrative:

NPC: ${selectedNPC.name}
Description: ${selectedNPC.description}
Relationship: ${selectedNPC.relationship}

Character Details:
- Name: ${character?.name}
- Race: ${character?.race}
- Class: ${character?.class_role}
- Traits: ${character?.special_things?.map(t => t.name).join(', ') || 'None specified'}
- Backstory: ${character?.backstory?.slice(0, 200) || 'Unknown'}

Recent Character Actions:
${pastActions.slice(0, 500)}

Campaign Tones: ${campaign?.campaign_tones?.join(', ')}

World Context:
${JSON.stringify(worldEvolution?.world_state || {})}

Generate 3-4 lines of dialogue for this NPC that:
1. References something specific about the CHARACTER'S traits, backstory, or past actions
2. Reacts personally to who this character is and what they've done
3. Advances a subplot or main plot
4. Maintains tone consistency (${campaign?.campaign_tones?.join(', ')})
5. Creates emotional connection or dramatic impact`,
        response_json_schema: {
          type: "object",
          properties: {
            npc_name: { type: "string" },
            dialogue_lines: { type: "array", items: { type: "string" } },
            subtext: { type: "string" }
          }
        }
      });

      setNpcDialogue(dialogue);
      toast.success('NPC dialogue generated!');
    } catch (error) {
      toast.error('Failed to generate dialogue');
    }
    setIsGenerating(false);
  };

  const generateEncounter = async () => {
    setIsGenerating(true);
    try {
      const enc = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a dynamic combat or narrative encounter tailored to the character:

Character: ${character?.name} (${character?.race} ${character?.class_role})
Level: ${character?.level}
Strengths: ${character?.skills ? Object.keys(character.skills).slice(0, 3).join(', ') : 'Unknown'}
Weaknesses: ${character?.special_things?.find(s => s.flaw)?.flaw || 'Unknown'}

Campaign Tones: ${campaign?.campaign_tones?.join(', ')}
Current Scene: ${campaign?.current_scene || 'Unknown'}

World Context:
${JSON.stringify(worldEvolution?.world_state || {})}

Design an encounter that:
1. Is appropriately challenging for a level ${character?.level} character
2. Tests character weaknesses while rewarding strengths
3. Offers multiple approaches (combat, diplomacy, stealth, magic)
4. Fits the tone (${campaign?.campaign_tones?.join(', ')})
5. Includes environmental interactions and storytelling opportunities`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            enemies: {
              type: "array",
              items: { type: "object", properties: { name: { type: "string" }, hp: { type: "number" }, abilities: { type: "array", items: { type: "string" } } } }
            },
            environment: { type: "string" },
            challenges: { type: "array", items: { type: "string" } },
            rewards: { type: "array", items: { type: "string" } }
          }
        }
      });

      setEncounter(enc);
      toast.success('Encounter generated!');
    } catch (error) {
      toast.error('Failed to generate encounter');
    }
    setIsGenerating(false);
  };

  const generatePuzzle = async () => {
    setIsGenerating(true);
    try {
      const puzz = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a meaningful puzzle or riddle based on campaign lore and character skills:

Character: ${character?.name}
Skills: ${character?.skills ? Object.keys(character.skills).join(', ') : 'Unknown'}
Interests: ${character?.backstory?.slice(0, 100) || 'Unknown'}

Campaign Lore:
${JSON.stringify(worldEvolution?.emergent_lore?.slice(0, 3) || [])}

World Context:
${JSON.stringify(worldEvolution?.world_state || {})}

Campaign Tones: ${campaign?.campaign_tones?.join(', ')}

Create a puzzle or riddle that:
1. Incorporates actual campaign lore elements
2. Can be solved using the character's established skills
3. Has multiple solution paths
4. Provides meaningful world-building information
5. Fits the tone (${campaign?.campaign_tones?.join(', ')})`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            clues: { type: "array", items: { type: "string" } },
            solutions: { type: "array", items: { type: "string" } },
            lore_revealed: { type: "string" },
            reward: { type: "string" }
          }
        }
      });

      setPuzzle(puzz);
      toast.success('Puzzle generated!');
    } catch (error) {
      toast.error('Failed to generate puzzle');
    }
    setIsGenerating(false);
  };

  const generateAmbientMusic = async () => {
    setIsGenerating(true);
    try {
      const music = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest atmospheric music and ambient sounds for the current scene:

Scene: ${campaign?.current_scene || 'Unknown location'}
Campaign Tones: ${campaign?.campaign_tones?.join(', ')}
Mood: ${encounter ? 'Combat' : puzzle ? 'Investigation' : 'Exploration'}

World Environment:
${JSON.stringify(worldEvolution?.world_state || {})}

Suggest:
1. 3-4 specific instrumental songs or artists that match the tone
2. Ambient sounds (nature, urban, supernatural, etc.)
3. Volume and intensity recommendations
4. When to transition between tracks`,
        response_json_schema: {
          type: "object",
          properties: {
            scene_description: { type: "string" },
            recommended_music: {
              type: "array",
              items: { type: "object", properties: { title: { type: "string" }, artist: { type: "string" }, mood: { type: "string" } } }
            },
            ambient_sounds: { type: "array", items: { type: "string" } },
            intensity_level: { type: "string", enum: ["soft", "moderate", "intense", "epic"] },
            transition_notes: { type: "string" }
          }
        }
      });

      setAmbientMusic(music);
      toast.success('Ambient music suggested!');
    } catch (error) {
      toast.error('Failed to generate music suggestions');
    }
    setIsGenerating(false);
  };

  const generatePlotHooks = async () => {
    setIsGenerating(true);
    try {
      const hooks = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate plot hooks and adventure seeds that adapt to recent campaign events:

Campaign: ${campaign?.title}
Tones: ${campaign?.campaign_tones?.join(', ')}
Character: ${character?.name}

World State:
${JSON.stringify(worldEvolution?.world_state || {})}

Recent Simulated Events:
${JSON.stringify(worldEvolution?.simulated_events?.slice(0, 3) || [])}

Create 4-5 distinct plot hooks that:
1. Emerge naturally from the world state and recent events
2. Offer different approaches (combat, diplomacy, investigation, etc.)
3. Vary in scope (personal, regional, world-threatening)
4. Match campaign tones (${campaign?.campaign_tones?.join(', ')})
5. Create meaningful choices and consequences`,
        response_json_schema: {
          type: "object",
          properties: {
            hooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  scope: { type: "string", enum: ["personal", "regional", "world"] },
                  suggested_approaches: { type: "array", items: { type: "string" } }
                }
              }
            },
            overall_direction: { type: "string" }
          }
        }
      });

      setPlotHooks(hooks);
      toast.success('Plot hooks generated!');
    } catch (error) {
      toast.error('Failed to generate plot hooks');
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Campaign Storyteller AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generation Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          <Button
            onClick={generateNarrative}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="border-purple-500/50"
          >
            {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
            Narrative
          </Button>
          <Button
            onClick={generateNPCDialogue}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="border-purple-500/50"
          >
            {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <MessageCircle className="w-3 h-3 mr-1" />}
            NPC
          </Button>
          <Button
            onClick={generateEncounter}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="border-purple-500/50"
          >
            ⚔️ Encounter
          </Button>
          <Button
            onClick={generatePlotHooks}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="border-purple-500/50"
          >
            🪝 Hooks
          </Button>
          <Button
            onClick={generatePuzzle}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="border-purple-500/50"
          >
            🔑 Puzzle
          </Button>
          <Button
            onClick={generateAmbientMusic}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="border-purple-500/50"
          >
            🎵 Music
          </Button>
        </div>

        {/* Narrative Display */}
        {narrative && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 space-y-2">
            <h5 className="font-semibold text-purple-300">📖 Narrative</h5>
            <p className="text-sm text-slate-300 leading-relaxed italic">{narrative}</p>
          </div>
        )}

        {/* NPC Dialogue Display */}
        {npcDialogue && (
          <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4 space-y-2">
            <h5 className="font-semibold text-pink-300">💬 {npcDialogue.npc_name}</h5>
            <div className="space-y-2">
              {npcDialogue.dialogue_lines?.map((line, i) => (
                <p key={i} className="text-sm text-slate-300 italic">"{line}"</p>
              ))}
            </div>
            {npcDialogue.subtext && (
              <p className="text-xs text-slate-400 mt-2"><span className="font-semibold">Subtext:</span> {npcDialogue.subtext}</p>
            )}
          </div>
        )}

        {/* Plot Hooks Display */}
        {plotHooks?.hooks?.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-semibold text-yellow-300">🪝 Plot Hooks</h5>
            {plotHooks.hooks.map((hook, i) => (
              <div key={i} className="bg-slate-700/30 border border-slate-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-slate-300">{hook.title}</p>
                  <Badge className="bg-slate-600 text-xs">{hook.scope}</Badge>
                </div>
                <p className="text-sm text-slate-300">{hook.description}</p>
                {hook.suggested_approaches?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {hook.suggested_approaches.map((approach, j) => (
                      <Badge key={j} variant="outline" className="border-slate-500/50 text-xs">
                        {approach}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {plotHooks.overall_direction && (
              <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                <p className="text-xs text-green-300"><span className="font-semibold">Direction:</span> {plotHooks.overall_direction}</p>
              </div>
            )}
          </div>
        )}

        {/* Encounter Display */}
        {encounter && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 space-y-2">
            <h5 className="font-semibold text-red-300">⚔️ {encounter.title}</h5>
            <p className="text-sm text-slate-300">{encounter.description}</p>
            {encounter.enemies?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">Enemies:</p>
                {encounter.enemies.map((e, i) => (
                  <p key={i} className="text-xs text-slate-400">• {e.name} (HP: {e.hp}) - {e.abilities?.join(', ')}</p>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-300"><span className="font-semibold">Environment:</span> {encounter.environment}</p>
          </div>
        )}

        {/* Puzzle Display */}
        {puzzle && (
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 space-y-2">
            <h5 className="font-semibold text-cyan-300">🔑 {puzzle.title}</h5>
            <p className="text-sm text-slate-300">{puzzle.description}</p>
            {puzzle.clues?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">Clues:</p>
                {puzzle.clues.map((c, i) => (
                  <p key={i} className="text-xs text-slate-400">• {c}</p>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-300"><span className="font-semibold">Lore:</span> {puzzle.lore_revealed}</p>
          </div>
        )}

        {/* Ambient Music Display */}
        {ambientMusic && (
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4 space-y-2">
            <h5 className="font-semibold text-indigo-300">🎵 Ambient Soundtrack</h5>
            <p className="text-xs text-slate-300">{ambientMusic.scene_description}</p>
            {ambientMusic.recommended_music?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">Recommended Tracks:</p>
                {ambientMusic.recommended_music.map((m, i) => (
                  <p key={i} className="text-xs text-slate-400">• "{m.title}" by {m.artist}</p>
                ))}
              </div>
            )}
            {ambientMusic.ambient_sounds?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">Ambient Sounds:</p>
                <p className="text-xs text-slate-400">{ambientMusic.ambient_sounds.join(', ')}</p>
              </div>
            )}
            <p className="text-xs text-slate-300"><span className="font-semibold">Intensity:</span> {ambientMusic.intensity_level}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}