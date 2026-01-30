import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function CharacterBackstoryGenerator({ worldId, worldLore = [] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backstory, setBackstory] = useState(null);
  const [characterName, setCharacterName] = useState("");

  const generateBackstory = async () => {
    if (!characterName.trim()) {
      toast.error("Enter character name");
      return;
    }

    setLoading(true);
    try {
      const loreContext = worldLore
        .slice(0, 5)
        .map(l => `${l.title}: ${l.content?.substring(0, 200)}`)
        .join("\n\n");

      const prompt = `Create a detailed character backstory for ${characterName} in this world context:

${loreContext || "A fantasy world"}

Generate a compelling backstory including:
- Early life and family
- Formative experiences
- Key motivations
- Personal conflicts
- Connection to world lore
- Current status and goals

Make it immersive and specific to the world.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            backstory: { type: "string" },
            personality: { type: "string" },
            motivations: { type: "array", items: { type: "string" } },
            flaws: { type: "array", items: { type: "string" } }
          }
        }
      });

      setBackstory(result);
    } catch (error) {
      toast.error("Failed to generate backstory");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Backstory
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Character Backstory Generator</DialogTitle>
        </DialogHeader>

        {!backstory ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Character name..."
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateBackstory()}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-slate-300 text-sm"
            />
            <Button
              onClick={generateBackstory}
              disabled={loading || !characterName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Backstory
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">Backstory</h3>
                <p className="text-sm text-slate-300 bg-slate-700/30 rounded p-3">{backstory.backstory}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">Personality</h3>
                <p className="text-sm text-slate-300 bg-slate-700/30 rounded p-3">{backstory.personality}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">Motivations</h3>
                <ul className="text-sm space-y-1">
                  {backstory.motivations?.map((m, i) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">Flaws</h3>
                <ul className="text-sm space-y-1">
                  {backstory.flaws?.map((f, i) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(backstory, null, 2));
                toast.success("Copied to clipboard");
              }}
              variant="outline"
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Backstory
            </Button>
            <Button
              onClick={() => setBackstory(null)}
              variant="outline"
              className="w-full"
            >
              Generate New
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}