import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function AutoLoreGenerator({ worldId, rulebooks = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [loreCategory, setLoreCategory] = useState("cosmology");
  const [preview, setPreview] = useState(null);

  const generateLore = async () => {
    if (!worldId) {
      toast.error("World ID required");
      return;
    }

    setIsGenerating(true);
    try {
      const rulebookContext = rulebooks
        .filter(r => r.content_extracted)
        .slice(0, 3)
        .map(r => `${r.title}: ${JSON.stringify(r.game_mechanics || {}).substring(0, 200)}`)
        .join("\n");

      const categoryPrompts = {
        cosmology: "Create a detailed description of the cosmos, celestial bodies, planes of existence, and how magic/technology works",
        history: "Write the major historical epochs and events that shaped this world",
        religions: "Design 3-4 major religions, their beliefs, deities, and conflicts",
        mythology: "Create legendary tales and mythological figures important to this world's culture"
      };

      const prompt = `You are a world-building AI. Based on these game rules and mechanics:

${rulebookContext}

Generate detailed, creative ${loreCategory} for a fantasy world. Make it structured, immersive, and suitable for a tabletop RPG campaign.

${categoryPrompts[loreCategory]}

Provide your response as plain text (not markdown or JSON) suitable for a lore entry.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setPreview({
        title: `${loreCategory.charAt(0).toUpperCase() + loreCategory.slice(1)} - Auto Generated`,
        content: result,
        category: loreCategory
      });
      toast.success("Lore generated! Review and save if desired.");
    } catch (error) {
      toast.error("Failed to generate lore");
      console.error(error);
    }
    setIsGenerating(false);
  };

  const saveLore = async () => {
    if (!preview || !worldId) return;

    try {
      await base44.entities.LoreEntry.create({
        world_id: worldId,
        title: preview.title,
        content: preview.content,
        category: preview.category
      });
      toast.success("Lore entry saved!");
      setPreview(null);
    } catch (error) {
      toast.error("Failed to save lore entry");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookOpen className="w-4 h-4" />
          Auto-Generate Lore
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-300">AI Lore Entry Generator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={loreCategory} onValueChange={setLoreCategory}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cosmology">Cosmology & Universe</SelectItem>
              <SelectItem value="history">History & Timeline</SelectItem>
              <SelectItem value="religions">Religions & Beliefs</SelectItem>
              <SelectItem value="mythology">Mythology & Legends</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={generateLore}
            disabled={isGenerating || !rulebooks.length}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
            {isGenerating ? "Generating..." : "Generate Lore Entry"}
          </Button>

          {preview && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-sm text-slate-200">{preview.title}</CardTitle>
                <Badge className="w-fit mt-2">{preview.category}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-slate-800/50 p-3 rounded text-xs text-slate-300 max-h-32 overflow-y-auto">
                  {preview.content}
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveLore} className="flex-1 bg-green-600 hover:bg-green-700">
                    Save Entry
                  </Button>
                  <Button onClick={() => setPreview(null)} variant="outline" className="flex-1">
                    Discard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}