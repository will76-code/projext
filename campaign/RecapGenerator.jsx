import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RecapGenerator({ campaign, conversation, onRecapGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateRecap = async () => {
    if (!conversation || !campaign) {
      toast.error('No active session to recap');
      return;
    }

    setIsGenerating(true);
    try {
      // Send a prompt to the AI to generate a recap
      const recapPrompt = `You are the AI Game Master. Generate a concise, in-character session recap.

Campaign: ${campaign.title}
World: ${campaign.world_id}

Review the conversation history and provide:
1. A brief narrative summary (2-3 paragraphs, dramatic and atmospheric)
2. 3-5 key events or plot developments
3. Character progression notes (skills used, growth moments, decisions made)
4. NPCs encountered (list names)
5. Loot or items obtained

Format your response as a story summary that captures the essence of this session, written from the perspective of a chronicler documenting an epic adventure.`;

      const response = await base44.agents.addMessage(conversation, {
        role: "user",
        content: recapPrompt
      });

      // Wait a moment for AI to respond
      setTimeout(async () => {
        // Get the AI's response from the conversation
        const updatedConv = await base44.agents.getConversation(conversation.id);
        const lastMessage = updatedConv.messages[updatedConv.messages.length - 1];
        
        if (lastMessage && lastMessage.role !== 'user') {
          // Extract the recap content
          const recapContent = lastMessage.content;
          
          // Create a SessionRecap entity
          const existingRecaps = await base44.entities.SessionRecap.filter({ 
            campaign_id: campaign.id 
          });
          
          const newRecap = await base44.entities.SessionRecap.create({
            campaign_id: campaign.id,
            session_number: existingRecaps.length + 1,
            session_date: new Date().toISOString(),
            title: `Session ${existingRecaps.length + 1}: The Adventure Continues`,
            summary: recapContent,
            key_events: [],
            character_progression: "Session completed",
            npcs_encountered: [],
            loot_obtained: []
          });

          toast.success('Session recap generated!');
          if (onRecapGenerated) onRecapGenerated(newRecap);
        }
        setIsGenerating(false);
      }, 3000);

    } catch (error) {
      toast.error('Failed to generate recap');
      console.error(error);
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateRecap}
      disabled={isGenerating || !conversation}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      size="sm"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating Recap...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Session Recap
        </>
      )}
    </Button>
  );
}