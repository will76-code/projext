import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function AIStoryWeaver({ campaign, characters = [], world }) {
  const [weaving, setWeaving] = useState(false);
  const [story, setStory] = useState(null);

  const generateStory = async () => {
    setWeaving(true);
    try {
      const characterNames = characters.map(c => c.name).join(", ");

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate evolving questline and branching narrative for campaign. Return JSON:
{
  "main_arc": "overarching story premise",
  "questlines": [
    {
      "title": "quest name",
      "description": "quest hook",
      "stages": ["stage 1", "stage 2"],
      "consequences": ["consequence if accepted", "consequence if refused"]
    }
  ],
  "character_arcs": {
    "character_name": "personal arc"
  },
  "branching_paths": [
    {
      "choice": "player choice",
      "path_1": "consequence 1",
      "path_2": "consequence 2",
      "impact": "world impact"
    }
  ],
  "replayability": "how story changes on replay"
}

Campaign: ${campaign?.title}
Characters: ${characterNames}
World: ${world?.name || 'Unknown'}`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            main_arc: { type: "string" },
            questlines: { type: "array" },
            character_arcs: { type: "object" },
            branching_paths: { type: "array" },
            replayability: { type: "string" }
          }
        }
      });

      setStory(response);
      toast.success("Story arc generated!");
    } catch (error) {
      toast.error(`Story generation failed: ${error.message}`);
    }
    setWeaving(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          AI Story Weaver
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">
          Generate dynamic questlines and branching narratives for {campaign?.title || "your campaign"}.
        </p>

        <Button
          onClick={generateStory}
          disabled={weaving}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600"
        >
          {weaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Weave Story Arc
        </Button>

        {story && (
          <div className="space-y-4 bg-slate-700/30 rounded p-4">
            <div>
              <h4 className="font-semibold text-orange-300">Main Arc</h4>
              <p className="text-sm text-slate-300 mt-1">{story.main_arc}</p>
            </div>

            <div>
              <h4 className="font-semibold text-orange-300 mb-2">Questlines</h4>
              {story.questlines?.map((quest, i) => (
                <div key={i} className="bg-slate-800 rounded p-3 mb-2">
                  <p className="font-semibold text-orange-400">{quest.title}</p>
                  <p className="text-xs text-slate-300 mt-1">{quest.description}</p>
                  <div className="mt-2 space-y-1">
                    {quest.stages?.map((s, j) => (
                      <p key={j} className="text-xs text-slate-400">→ {s}</p>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {quest.consequences?.map((c, j) => (
                      <Badge key={j} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-semibold text-red-300 mb-2">Character Arcs</h4>
              {Object.entries(story.character_arcs || {}).map(([char, arc], i) => (
                <div key={i} className="bg-slate-800 rounded p-2 mb-2">
                  <p className="text-sm font-semibold text-red-400">{char}</p>
                  <p className="text-xs text-slate-300">{arc}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-semibold text-cyan-300 mb-2">Branching Narratives</h4>
              {story.branching_paths?.map((path, i) => (
                <div key={i} className="bg-slate-800 rounded p-2 mb-2">
                  <p className="text-sm font-semibold text-cyan-400">{path.choice}</p>
                  <div className="mt-1 text-xs text-slate-300 space-y-1">
                    <p>✓ Path 1: {path.path_1}</p>
                    <p>✗ Path 2: {path.path_2}</p>
                    <p className="text-purple-300">Impact: {path.impact}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-semibold text-green-300">Replayability</h4>
              <p className="text-sm text-slate-300 mt-1">{story.replayability}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}