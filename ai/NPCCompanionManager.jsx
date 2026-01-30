import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, MessageSquare, Loader2, Wand2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function NPCCompanionManager({ worldId, campaignId, rulebooks }) {
  const queryClient = useQueryClient();
  const [selectedNPC, setSelectedNPC] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  const { data: npcs = [] } = useQuery({
    queryKey: ['npc-companions', worldId],
    queryFn: async () => {
      const all = await base44.entities.Character.list();
      return all.filter(c => c.world_id === worldId && c.is_npc === true);
    }
  });

  const createNPCMutation = useMutation({
    mutationFn: (data) => base44.entities.Character.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['npc-companions'] });
      toast.success("NPC created!");
    }
  });

  const deleteNPCMutation = useMutation({
    mutationFn: (id) => base44.entities.Character.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['npc-companions'] });
      toast.success("NPC deleted");
    }
  });

  const generateNPC = async (formData) => {
    setIsGenerating(true);
    try {
      const rulebookContext = rulebooks
        ?.filter(r => r.content_extracted)
        .slice(0, 2)
        .map(r => `NPCs: ${JSON.stringify(r.npcs || []).substring(0, 500)}`)
        .join("\n") || "";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a detailed NPC for a ${formData.gameSystem} campaign.

Context:
- Name: ${formData.name}
- Role: ${formData.role}
- Motivation: ${formData.motivation}

Rulebook NPCs for reference:
${rulebookContext}

Generate:
1. Detailed backstory (2-3 paragraphs)
2. Personality traits (3-5 traits)
3. Speech patterns/quirks
4. Knowledge areas (what they know about the world)
5. Secrets (2-3 hidden facts)
6. Stats appropriate for ${formData.gameSystem}

Return JSON:
{
  "backstory": "...",
  "personality": ["trait1", "trait2"],
  "speech_pattern": "...",
  "knowledge": ["topic1", "topic2"],
  "secrets": ["secret1", "secret2"],
  "stats": { "level": 5, "attributes": {...} }
}`,
        response_json_schema: {
          type: "object",
          properties: {
            backstory: { type: "string" },
            personality: { type: "array" },
            speech_pattern: { type: "string" },
            knowledge: { type: "array" },
            secrets: { type: "array" },
            stats: { type: "object" }
          }
        }
      });

      await createNPCMutation.mutateAsync({
        world_id: worldId,
        name: formData.name,
        race: formData.race || "Human",
        class_role: formData.role,
        backstory: result.backstory,
        is_npc: true,
        npc_data: {
          motivation: formData.motivation,
          personality: result.personality,
          speech_pattern: result.speech_pattern,
          knowledge: result.knowledge,
          secrets: result.secrets,
          chat_history: []
        },
        attributes: result.stats.attributes || {},
        level: result.stats.level || 1
      });
    } catch (error) {
      toast.error("Failed to generate NPC");
      console.error(error);
    }
    setIsGenerating(false);
  };

  const chatWithNPC = async () => {
    if (!userMessage.trim() || !selectedNPC) return;

    setIsChatting(true);
    const newMessages = [...chatMessages, { role: "user", content: userMessage }];
    setChatMessages(newMessages);
    setUserMessage("");

    try {
      const npcData = selectedNPC.npc_data || {};
      const context = {
        name: selectedNPC.name,
        backstory: selectedNPC.backstory,
        personality: npcData.personality || [],
        speech_pattern: npcData.speech_pattern || "",
        knowledge: npcData.knowledge || [],
        motivation: npcData.motivation || "",
        recent_chat: newMessages.slice(-6)
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are ${selectedNPC.name}, an NPC in a TTRPG campaign.

Your details:
- Backstory: ${selectedNPC.backstory}
- Personality: ${(npcData.personality || []).join(", ")}
- Speech pattern: ${npcData.speech_pattern}
- Motivation: ${npcData.motivation}
- Knowledge areas: ${(npcData.knowledge || []).join(", ")}

Recent conversation:
${newMessages.slice(-6).map(m => `${m.role === 'user' ? 'Player' : selectedNPC.name}: ${m.content}`).join("\n")}

Respond in character. Stay true to your personality and speech patterns. Only share knowledge you would realistically have.

Player asks: ${userMessage}

Your response:`,
        add_context_from_internet: false
      });

      const npcMessage = { role: "assistant", content: response };
      setChatMessages([...newMessages, npcMessage]);

      // Update chat history in database
      await base44.entities.Character.update(selectedNPC.id, {
        npc_data: {
          ...npcData,
          chat_history: [...(npcData.chat_history || []), { user: userMessage, npc: response, timestamp: new Date().toISOString() }].slice(-20)
        }
      });
    } catch (error) {
      toast.error("Failed to get NPC response");
      console.error(error);
    }
    setIsChatting(false);
  };

  return (
    <Card className="bg-slate-800/50 border-indigo-500/30">
      <CardHeader>
        <CardTitle className="text-indigo-300 flex items-center gap-2">
          <Users className="w-5 h-5" />
          AI NPC Companions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
            <TabsTrigger value="list">NPCs ({npcs.length})</TabsTrigger>
            <TabsTrigger value="create">Create NPC</TabsTrigger>
            <TabsTrigger value="chat" disabled={!selectedNPC}>Chat</TabsTrigger>
          </TabsList>

          {/* NPC List */}
          <TabsContent value="list" className="space-y-2">
            {npcs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No NPCs yet. Create one to get started!</p>
            ) : (
              npcs.map(npc => (
                <Card key={npc.id} className="bg-slate-700/30 border-slate-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm text-white">{npc.name}</CardTitle>
                        <p className="text-xs text-slate-400 mt-1">{npc.class_role}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-400 hover:text-red-300"
                        onClick={() => deleteNPCMutation.mutate(npc.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-slate-300 line-clamp-2">{npc.backstory}</p>
                    {npc.npc_data?.personality && (
                      <div className="flex flex-wrap gap-1">
                        {npc.npc_data.personality.slice(0, 3).map((trait, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{trait}</Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => {
                        setSelectedNPC(npc);
                        setChatMessages([]);
                      }}
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Talk to {npc.name}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Create NPC */}
          <TabsContent value="create">
            <NPCCreationForm onGenerate={generateNPC} isGenerating={isGenerating} worldId={worldId} />
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat">
            {selectedNPC && (
              <div className="space-y-3">
                <div className="bg-slate-700/30 rounded p-3">
                  <h4 className="text-sm font-semibold text-white mb-1">{selectedNPC.name}</h4>
                  <p className="text-xs text-slate-400">{selectedNPC.npc_data?.speech_pattern}</p>
                </div>

                <div className="bg-slate-900/50 rounded p-3 max-h-[400px] overflow-y-auto space-y-2">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Start a conversation with {selectedNPC.name}</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`text-xs ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block rounded px-3 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Ask something..."
                    className="bg-slate-700/50 border-slate-600 text-white"
                    onKeyDown={(e) => e.key === 'Enter' && chatWithNPC()}
                  />
                  <Button onClick={chatWithNPC} disabled={isChatting || !userMessage.trim()}>
                    {isChatting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function NPCCreationForm({ onGenerate, isGenerating }) {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    race: "",
    motivation: "",
    gameSystem: "dnd5e"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.role) {
      toast.error("Name and role are required");
      return;
    }
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label className="text-slate-300">Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Elara Moonshadow"
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <div>
        <Label className="text-slate-300">Role *</Label>
        <Input
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          placeholder="e.g., Town Guard Captain, Merchant, Spy"
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <div>
        <Label className="text-slate-300">Race</Label>
        <Input
          value={formData.race}
          onChange={(e) => setFormData({ ...formData, race: e.target.value })}
          placeholder="e.g., Elf, Human, Dragon"
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <div>
        <Label className="text-slate-300">Motivation</Label>
        <Textarea
          value={formData.motivation}
          onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
          placeholder="What drives this NPC? What do they want?"
          className="bg-slate-700/50 border-slate-600 text-white h-20"
        />
      </div>

      <Button type="submit" disabled={isGenerating} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
        {isGenerating ? "Generating..." : "Generate NPC with AI"}
      </Button>
    </form>
  );
}