import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function CampaignQuestGenerator({ worldId, campaignId, loreEntries = [], characters = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [questlines, setQuestlines] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [twists, setTwists] = useState([]);

  const generateContent = async () => {
    if (!worldId) {
      toast.error("World ID required");
      return;
    }

    setIsGenerating(true);
    try {
      const loreContext = loreEntries.slice(0, 5).map(e => `${e.title}: ${e.content?.substring(0, 200)}`).join("\n");
      const characterContext = characters.slice(0, 3).map(c => `${c.name} (${c.class_role})`).join(", ");

      const prompt = `As a campaign master AI, generate engaging campaign content for a tabletop RPG.

World Context: The campaign is set in a world with the following lore:
${loreContext}

Key Characters: ${characterContext || "No characters specified"}

Generate ONLY valid JSON with no markdown:
{
  "questlines": [
    {
      "title": "Quest name",
      "description": "2-3 sentence quest hook",
      "objectives": ["objective 1", "objective 2"],
      "rewards": "XP, loot, or story consequences",
      "difficulty": "easy|medium|hard"
    }
  ],
  "encounters": [
    {
      "name": "Encounter name",
      "type": "combat|social|exploration|puzzle",
      "description": "2 sentence encounter setup",
      "difficulty": "easy|medium|hard|deadly"
    }
  ],
  "npc_motivations": [
    {
      "npc_name": "NPC name",
      "motivation": "What they want",
      "conflict": "What might oppose them",
      "potential_ally": true
    }
  ],
  "plot_twists": [
    {
      "title": "Twist name",
      "description": "How this changes the narrative",
      "severity": "minor|moderate|major"
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            questlines: { type: "array" },
            encounters: { type: "array" },
            npc_motivations: { type: "array" },
            plot_twists: { type: "array" }
          }
        }
      });

      setQuestlines(result.questlines || []);
      setEncounters(result.encounters || []);
      setNpcs(result.npc_motivations || []);
      setTwists(result.plot_twists || []);
      toast.success("Campaign content generated!");
    } catch (error) {
      toast.error("Failed to generate content");
      console.error(error);
    }
    setIsGenerating(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wand2 className="w-4 h-4" />
          Generate Campaign Content
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-300">AI Campaign Content Generator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={generateContent}
            disabled={isGenerating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {isGenerating ? "Generating..." : "Generate Content"}
          </Button>

          {questlines.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-300">Questlines</h3>
              {questlines.map((q, idx) => (
                <Card key={idx} className="bg-slate-700/50 border-slate-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-200">{q.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-slate-400">{q.description}</p>
                    <Badge className="bg-purple-600/50">{q.difficulty}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {encounters.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-300">Encounters</h3>
              {encounters.map((e, idx) => (
                <Card key={idx} className="bg-slate-700/50 border-slate-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-200">{e.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-xs text-slate-400">{e.description}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{e.type}</Badge>
                      <Badge className="bg-blue-600/50 text-xs">{e.difficulty}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {npcs.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-300">NPC Motivations</h3>
              {npcs.map((npc, idx) => (
                <Card key={idx} className="bg-slate-700/50 border-slate-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-200">{npc.npc_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-400 space-y-1">
                    <p><span className="text-slate-300">Motivation:</span> {npc.motivation}</p>
                    <p><span className="text-slate-300">Conflict:</span> {npc.conflict}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {twists.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-300">Plot Twists</h3>
              {twists.map((twist, idx) => (
                <Card key={idx} className="bg-slate-700/50 border-slate-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-200">{twist.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-slate-400">{twist.description}</p>
                    <Badge className={twist.severity === 'major' ? 'bg-red-600/50' : twist.severity === 'moderate' ? 'bg-yellow-600/50' : 'bg-blue-600/50'}>
                      {twist.severity}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}