import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, MapPin, Users, BookText } from "lucide-react";
import { toast } from "sonner";

export default function CampaignAIAssistant({ campaign, character, world }) {
  const [generating, setGenerating] = useState(false);
  const [plotHooks, setPlotHooks] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [npcDialogues, setNpcDialogues] = useState([]);
  const [summary, setSummary] = useState("");

  const generatePlotHooks = async () => {
    setGenerating(true);
    try {
      const context = `
Campaign: ${campaign.title}
World: ${world.name} (${world.genre}, ${world.game_system})
Current Scene: ${campaign.current_scene}
Story Summary: ${campaign.story_summary}
Character: ${character.name} - ${character.race} ${character.class_role}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 compelling plot hooks for this ongoing campaign. Make them specific to the world and character.

${context}

Return as JSON array of objects with "title" and "description" fields.`,
        response_json_schema: {
          type: "object",
          properties: {
            hooks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      setPlotHooks(response.hooks || []);
      toast.success("Plot hooks generated!");
    } catch (error) {
      toast.error("Failed to generate plot hooks");
    }
    setGenerating(false);
  };

  const generateEncounters = async () => {
    setGenerating(true);
    try {
      const context = `
Campaign: ${campaign.title}
World: ${world.name} (${world.genre}, ${world.game_system})
Character Level: ${character.level}
Current Scene: ${campaign.current_scene}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 exciting encounter ideas appropriate for this character's level and campaign setting.

${context}

Return as JSON array with "title", "description", and "difficulty" fields.`,
        response_json_schema: {
          type: "object",
          properties: {
            encounters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  difficulty: { type: "string" }
                }
              }
            }
          }
        }
      });

      setEncounters(response.encounters || []);
      toast.success("Encounters generated!");
    } catch (error) {
      toast.error("Failed to generate encounters");
    }
    setGenerating(false);
  };

  const generateNPCDialogue = async () => {
    setGenerating(true);
    try {
      const npcs = campaign.npcs || [];
      const context = `
Campaign: ${campaign.title}
World: ${world.name}
NPCs: ${JSON.stringify(npcs)}
Current Scene: ${campaign.current_scene}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate interesting dialogue snippets for 3 NPCs in this campaign. Include their personality and how they might interact with the player.

${context}

Return as JSON array with "npc_name", "personality", and "dialogue" fields.`,
        response_json_schema: {
          type: "object",
          properties: {
            dialogues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  npc_name: { type: "string" },
                  personality: { type: "string" },
                  dialogue: { type: "string" }
                }
              }
            }
          }
        }
      });

      setNpcDialogues(response.dialogues || []);
      toast.success("NPC dialogues generated!");
    } catch (error) {
      toast.error("Failed to generate dialogues");
    }
    setGenerating(false);
  };

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const context = `
Campaign: ${campaign.title}
Story So Far: ${campaign.story_summary}
Current Scene: ${campaign.current_scene}
Active Quests: ${JSON.stringify(campaign.active_quests)}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize the campaign progress and suggest 3 compelling next steps for the story.

${context}

Provide a brief summary and actionable next steps.`,
        add_context_from_internet: false
      });

      setSummary(response);
      toast.success("Summary generated!");
    } catch (error) {
      toast.error("Failed to generate summary");
    }
    setGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Campaign AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hooks" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
            <TabsTrigger value="hooks">Plot Hooks</TabsTrigger>
            <TabsTrigger value="encounters">Encounters</TabsTrigger>
            <TabsTrigger value="npcs">NPCs</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="hooks" className="space-y-3">
            <Button
              onClick={generatePlotHooks}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
              Generate Plot Hooks
            </Button>
            {plotHooks.map((hook, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                <h4 className="font-semibold text-purple-300">{hook.title}</h4>
                <p className="text-sm text-white mt-1">{hook.description}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="encounters" className="space-y-3">
            <Button
              onClick={generateEncounters}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Encounters
            </Button>
            {encounters.map((enc, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-purple-300">{enc.title}</h4>
                  <span className="text-xs bg-purple-600/50 px-2 py-1 rounded">{enc.difficulty}</span>
                </div>
                <p className="text-sm text-white mt-1">{enc.description}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="npcs" className="space-y-3">
            <Button
              onClick={generateNPCDialogue}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Generate NPC Dialogues
            </Button>
            {npcDialogues.map((npc, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                <h4 className="font-semibold text-purple-300">{npc.npc_name}</h4>
                <p className="text-xs text-purple-400 italic mb-1">{npc.personality}</p>
                <p className="text-sm text-white">{npc.dialogue}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="summary" className="space-y-3">
            <Button
              onClick={generateSummary}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookText className="w-4 h-4 mr-2" />}
              Generate Summary & Next Steps
            </Button>
            {summary && (
              <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-sm text-white whitespace-pre-wrap">{summary}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}