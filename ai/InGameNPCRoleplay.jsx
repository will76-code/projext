import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, User, Bot, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function InGameNPCRoleplay({ campaignId, worldId }) {
  const [npcs, setNpcs] = useState([]);
  const [selectedNPCId, setSelectedNPCId] = useState("");
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [campaignContext, setCampaignContext] = useState(null);

  useEffect(() => {
    loadNPCs();
    loadCampaignContext();
  }, [worldId, campaignId]);

  const loadNPCs = async () => {
    const allChars = await base44.entities.Character.list();
    const worldNPCs = allChars.filter(c => c.world_id === worldId && c.is_npc);
    setNpcs(worldNPCs);
  };

  const loadCampaignContext = async () => {
    if (!campaignId) return;
    const campaign = await base44.entities.Campaign.list();
    const current = campaign.find(c => c.id === campaignId);
    setCampaignContext(current);
  };

  const getNPCResponse = async () => {
    if (!userInput.trim() || !selectedNPCId) return;

    const npc = npcs.find(n => n.id === selectedNPCId);
    if (!npc) return;

    setIsResponding(true);
    const newMessages = [...messages, { role: "player", content: userInput, npc_id: selectedNPCId }];
    setMessages(newMessages);
    setUserInput("");

    try {
      const npcData = npc.npc_data || {};
      
      // Build context from campaign
      const contextPrompt = `You are ${npc.name}, an NPC in an ongoing TTRPG campaign.

YOUR CHARACTER:
- Backstory: ${npc.backstory}
- Role: ${npc.class_role}
- Personality: ${(npcData.personality || []).join(", ")}
- Speech Pattern: ${npcData.speech_pattern}
- Motivation: ${npcData.motivation}
- Knowledge Areas: ${(npcData.knowledge || []).join(", ")}
- Secrets: ${(npcData.secrets || []).join(", ")} (only reveal if appropriate)

CAMPAIGN CONTEXT:
${campaignContext ? `
- Current Scene: ${campaignContext.current_scene || "Unknown location"}
- Campaign Summary: ${campaignContext.story_summary}
- Active Quests: ${(campaignContext.active_quests || []).map(q => q.title).join(", ")}
` : "No campaign context available"}

RECENT CONVERSATION:
${newMessages.slice(-6).map(m => `${m.role === 'player' ? 'Player' : npc.name}: ${m.content}`).join("\n")}

GUIDELINES:
1. Stay in character - use your speech pattern and personality
2. Only share knowledge you would realistically have
3. React to the campaign context and current situation
4. Your secrets should influence your responses subtly
5. If asked about things outside your knowledge, admit it in-character

Player says: "${userInput}"

Respond as ${npc.name}:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt,
        add_context_from_internet: false
      });

      const npcMessage = { role: "npc", content: response, npc_id: selectedNPCId, npc_name: npc.name };
      setMessages([...newMessages, npcMessage]);

      // Update NPC chat history
      await base44.entities.Character.update(npc.id, {
        npc_data: {
          ...npcData,
          chat_history: [
            ...(npcData.chat_history || []),
            { player: userInput, npc: response, scene: campaignContext?.current_scene, timestamp: new Date().toISOString() }
          ].slice(-30)
        }
      });

    } catch (error) {
      toast.error("NPC couldn't respond");
      console.error(error);
    }
    setIsResponding(false);
  };

  const selectedNPC = npcs.find(n => n.id === selectedNPCId);

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          In-Game NPC Roleplay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NPC Selection */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Select NPC</label>
          <Select value={selectedNPCId} onValueChange={setSelectedNPCId}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Choose an NPC..." />
            </SelectTrigger>
            <SelectContent>
              {npcs.map(npc => (
                <SelectItem key={npc.id} value={npc.id}>
                  {npc.name} - {npc.class_role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* NPC Info */}
        {selectedNPC && (
          <div className="bg-slate-700/30 rounded p-3 text-xs">
            <p className="text-white font-semibold">{selectedNPC.name}</p>
            <p className="text-slate-400 italic mb-2">{selectedNPC.npc_data?.speech_pattern}</p>
            <div className="flex flex-wrap gap-1">
              {selectedNPC.npc_data?.personality?.slice(0, 3).map((trait, i) => (
                <Badge key={i} variant="outline" className="text-xs">{trait}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Campaign Context */}
        {campaignContext && (
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-2 text-xs">
            <p className="text-indigo-300"><strong>Scene:</strong> {campaignContext.current_scene || "Unknown"}</p>
          </div>
        )}

        {/* Chat Area */}
        <div className="bg-slate-900/50 rounded p-3 min-h-[300px] max-h-[400px] overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              {selectedNPCId ? `Start a conversation with ${selectedNPC?.name}` : "Select an NPC to begin"}
            </p>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'player' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'player' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'player' ? 'bg-blue-600' : 'bg-purple-600'
                  }`}>
                    {msg.role === 'player' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                  <div className={`rounded-lg px-3 py-2 text-xs ${
                    msg.role === 'player' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-200'
                  }`}>
                    {msg.role === 'npc' && (
                      <p className="font-semibold mb-1 text-purple-300">{msg.npc_name}</p>
                    )}
                    <p>{msg.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={selectedNPCId ? "What do you say?" : "Select an NPC first"}
            disabled={!selectedNPCId || isResponding}
            className="bg-slate-700/50 border-slate-600 text-white"
            onKeyDown={(e) => e.key === 'Enter' && getNPCResponse()}
          />
          <Button 
            onClick={getNPCResponse} 
            disabled={!userInput.trim() || !selectedNPCId || isResponding}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isResponding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          NPCs remember past interactions and campaign events
        </p>
      </CardContent>
    </Card>
  );
}