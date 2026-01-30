import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function AdaptiveNPCDialogue({ campaignId, characterId, npcName, npcDescription = "" }) {
  const [dialogue, setDialogue] = useState(null);
  const [playerInput, setPlayerInput] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: character } = useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      try {
        return await base44.entities.Character.filter({ id: characterId }).then(r => r[0]);
      } catch {
        return null;
      }
    },
    enabled: !!characterId
  });

  const { data: messages } = useQuery({
    queryKey: ['campaignMessages', campaignId],
    queryFn: async () => {
      try {
        return await base44.entities.ConversationMessage.filter({ campaign_id: campaignId }).then(r => r.slice(-10));
      } catch {
        return [];
      }
    },
    enabled: !!campaignId
  });

  const generateAdaptiveDialogue = async (playerSays) => {
    setIsLoading(true);
    try {
      const characterContext = character ? 
        `Character: ${character.name} (${character.class_role} ${character.race}). Traits: ${character.special_things?.map(t => t.name).join(', ') || 'None'}` 
        : 'Unknown character';
      
      const pastInteractions = messages?.map(m => `${m.speaker_name}: ${m.content}`).join('\n') || 'First meeting';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are roleplay an NPC named "${npcName}" in a tabletop RPG.

NPC Description: ${npcDescription}

The player character is: ${characterContext}

Past interactions in this campaign:
${pastInteractions}

The player just said: "${playerSays}"

Respond with:
1. NPC's dialogue response (2-3 sentences, in character)
2. NPC's attitude toward this specific character (based on traits and actions)
3. Information revealed (if any lore/quest info is shared)
4. Emotional state (how the NPC feels right now)

Format as JSON: { dialogue, attitude, infoRevealed, emotionalState }`,
        response_json_schema: {
          type: "object",
          properties: {
            dialogue: { type: "string" },
            attitude: { type: "string" },
            infoRevealed: { type: "string" },
            emotionalState: { type: "string" }
          }
        }
      });

      setHistory([...history, { role: 'player', content: playerSays }, { role: 'npc', ...result }]);
      setDialogue(result);
      setPlayerInput("");
      toast.success('Response generated!');
    } catch (error) {
      toast.error('Failed to generate dialogue');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="text-cyan-300 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {npcName} - Adaptive Dialogue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-64 overflow-y-auto bg-slate-900/30 rounded p-3">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Start a conversation...</p>
          ) : (
            history.map((msg, i) => (
              <div key={i} className={`text-sm ${msg.role === 'player' ? 'text-blue-300' : 'text-cyan-300'}`}>
                <strong>{msg.role === 'player' ? character?.name || 'You' : npcName}:</strong>
                <p className="text-slate-300 mt-1">{msg.content || msg.dialogue}</p>
                {msg.attitude && (
                  <Badge className="mt-1 bg-slate-700 text-xs">{msg.attitude}</Badge>
                )}
              </div>
            ))
          )}
        </div>

        {dialogue && (
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-3 space-y-2">
            <div>
              <h6 className="font-semibold text-cyan-300 text-sm mb-1">Current Response</h6>
              <p className="text-sm text-slate-300">{dialogue.dialogue}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-400 font-semibold">Attitude</p>
                <p className="text-slate-300">{dialogue.attitude}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold">Mood</p>
                <p className="text-slate-300">{dialogue.emotionalState}</p>
              </div>
            </div>
            {dialogue.infoRevealed && (
              <div className="bg-yellow-900/20 rounded p-2">
                <p className="text-xs text-yellow-300"><strong>Info:</strong> {dialogue.infoRevealed}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && generateAdaptiveDialogue(playerInput)}
            placeholder={`What does ${character?.name || 'your character'} say?`}
            className="flex-1 bg-slate-700/50 border border-cyan-500/30 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500"
          />
          <Button
            onClick={() => generateAdaptiveDialogue(playerInput)}
            disabled={isLoading || !playerInput.trim()}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '💬'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}