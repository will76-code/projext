import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export default function NPCPersonalityGenerator({ world }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [npcType, setNpcType] = useState("");
  const [generatedNPC, setGeneratedNPC] = useState(null);

  const generateNPC = async () => {
    if (!npcType.trim()) {
      toast.error("Enter NPC type");
      return;
    }

    setIsGenerating(true);
    try {
      const worldEvolution = await base44.entities.WorldEvolution.filter({ world_id: world.id }).catch(() => []);
      const evolutionContext = worldEvolution[0] ? JSON.stringify(worldEvolution[0].emergent_lore?.slice(0, 5)) : 'No history yet';
      
      const npc = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a unique NPC for ${world.name} (${world.game_system}, Franchise: ${world.rulebook_franchise}):

NPC Type: ${npcType}
World Description: ${world.description}
World History: ${evolutionContext}

Create an NPC personality deeply tied to world events. Include:
- Name fitting the franchise
- Personality shaped by world evolution
- Hidden motivations tied to past events
- Unique quirks reflecting world culture
- Stats/abilities for ${world.game_system}
- Secret that connects to larger world storyline`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            personality: { type: "string" },
            motivations: { type: "string" },
            quirks: { type: "string" },
            stats: { type: "object" },
            secret: { type: "string" },
            world_connection: { type: "string" }
          }
        }
      });

      setGeneratedNPC(npc);
      toast.success("NPC generated!");
    } catch (error) {
      toast.error("Failed to generate NPC");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Users className="w-5 h-5" />
          NPC Personality Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={npcType}
          onChange={(e) => setNpcType(e.target.value)}
          placeholder="NPC type (e.g., 'tavern keeper', 'rival adventurer')"
          className="bg-slate-700/50 border-purple-500/30 text-white"
        />

        <Button
          onClick={generateNPC}
          disabled={isGenerating}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Contextual NPC
        </Button>

        {generatedNPC && (
          <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
            <h4 className="text-xl font-bold text-purple-300">{generatedNPC.name}</h4>
            
            <div>
              <p className="text-xs text-purple-400 font-semibold">Personality</p>
              <p className="text-sm text-white">{generatedNPC.personality}</p>
            </div>

            <div>
              <p className="text-xs text-purple-400 font-semibold">Motivations</p>
              <p className="text-sm text-white">{generatedNPC.motivations}</p>
            </div>

            <div>
              <p className="text-xs text-yellow-400 font-semibold">Quirks</p>
              <p className="text-sm text-white">{generatedNPC.quirks}</p>
            </div>

            <div>
              <p className="text-xs text-green-400 font-semibold">Stats</p>
              <pre className="text-xs text-white bg-slate-800 rounded p-2">
                {JSON.stringify(generatedNPC.stats, null, 2)}
              </pre>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded p-2">
              <p className="text-xs text-red-400 font-semibold">Secret</p>
              <p className="text-sm text-white">{generatedNPC.secret}</p>
            </div>

            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-2">
              <p className="text-xs text-indigo-400 font-semibold">World Connection</p>
              <p className="text-sm text-white">{generatedNPC.world_connection}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}