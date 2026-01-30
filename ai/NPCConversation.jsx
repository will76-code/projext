import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NPCConversation({ npc, world, campaignContext = "" }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState("");

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = { role: "player", content: userInput };
    setConversation(prev => [...prev, userMessage]);
    setUserInput("");
    setIsGenerating(true);

    try {
      const conversationHistory = conversation.map(msg => 
        `${msg.role === 'player' ? 'Player' : npc.name}: ${msg.content}`
      ).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are ${npc.name}, an NPC in ${world.name} (${world.genre}):

NPC Details:
${JSON.stringify(npc)}

World Context: ${world.description}
Campaign Context: ${campaignContext}

Conversation History:
${conversationHistory}
Player: ${userInput}

Respond as ${npc.name} would, staying in character. Be detailed, emotional, and react naturally to the player's words. Reference your background, motivations, and the world around you. Make this conversation feel real and immersive.

${npc.name}:`,
        add_context_from_internet: false
      });

      const npcMessage = { role: "npc", content: response };
      setConversation(prev => [...prev, npcMessage]);
    } catch (error) {
      toast.error("Failed to generate response");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Conversation with {npc.name}
        </CardTitle>
        <p className="text-xs text-purple-400">{npc.role || npc.description}</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 mb-4 bg-slate-900/50 rounded-lg p-3">
          <div className="space-y-3">
            {conversation.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-8">
                Start a conversation with {npc.name}...
              </p>
            )}
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'player' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'player'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 opacity-70">
                    {msg.role === 'player' ? 'You' : npc.name}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={`Say something to ${npc.name}...`}
            className="bg-slate-700/50 border-purple-500/30 text-white resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={isGenerating || !userInput.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}