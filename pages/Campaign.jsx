import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send, Dices, User, Heart, Zap, Book, Save, Settings, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const createPageUrl = (pageName) => `/${pageName}`;
import RecapGenerator from "../components/campaign/RecapGenerator";
import CampaignAIAssistant from "../components/ai/CampaignAIAssistant";
import CampaignStateManager from "../components/ai/CampaignStateManager";
import DungeonMasterTools from "../components/ai/DungeonMasterTools";
import SceneVisualizer from "../components/ai/SceneVisualizer";
import SynergisticUpgrades from "../components/ai/SynergisticUpgrades";
import VillainEncounterGenerator from "../components/ai/VillainEncounterGenerator";
import AIDungeonMaster from "../components/ai/AIDungeonMaster";
import CharacterProgressionAI from "../components/character/CharacterProgressionAI";
import DynamicNPCScaling from "../components/campaign/DynamicNPCScaling";
import ProgressionTimeline from "../components/character/ProgressionTimeline";
import EnhancedDungeonMaster from "../components/ai/EnhancedDungeonMaster";
import CampaignStorytellerAI from "../components/ai/CampaignStorytellerAI";
import CampaignQuestGenerator from "../components/ai/CampaignQuestGenerator";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Campaign() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const characterId = urlParams.get('characterId');

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [diceFormula, setDiceFormula] = useState("1d20");
  const [isSending, setIsSending] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const { data: character } = useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      const chars = await base44.entities.Character.filter({ id: characterId });
      return chars[0];
    },
    enabled: !!characterId
  });

  const { data: world } = useQuery({
    queryKey: ['world', character?.world_id],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ id: character.world_id });
      return worlds[0];
    },
    enabled: !!character?.world_id
  });

  useEffect(() => {
    if (character && world && !conversation) {
      initializeConversation();
    }
  }, [character, world]);

  const initializeConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "multiverse_gm",
        metadata: {
          name: `${character.name}'s Adventure in ${world.name}`,
          character_id: character.id,
          world_id: world.id
        }
      });
      setConversation(conv);

      // Send initial context to AI
      const initialPrompt = `You are the AI Game Master for ${world.name} (${world.genre}, ${world.game_system} system).

Character: ${character.name}, a Level ${character.level} ${character.race} ${character.class_role}
Backstory: ${character.backstory || 'No backstory yet.'}

Special Traits:
${character.special_things?.map(t => `- ${t.name}: ${t.boon} (but ${t.flaw})`).join('\n') || 'None yet.'}

Generate an immersive opening scene for this adventure. Set the stage with vivid description and present an initial hook or challenge.`;

      const response = await base44.agents.addMessage(conv, {
        role: "user",
        content: initialPrompt
      });

      // Subscribe to updates
      base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
      });

    } catch (error) {
      toast.error('Failed to start campaign');
      console.error(error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversation) return;
    
    setIsSending(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: input
      });
      setInput("");
    } catch (error) {
      toast.error('Failed to send message');
    }
    setIsSending(false);
  };

  const rollDice = () => {
    try {
      const match = diceFormula.match(/(\d+)d(\d+)([+-]\d+)?/i);
      if (!match) {
        toast.error('Invalid dice formula (use format: 2d20+5)');
        return;
      }

      const [_, numDice, diceSize, modifier] = match;
      const rolls = [];
      let total = 0;

      for (let i = 0; i < parseInt(numDice); i++) {
        const roll = Math.floor(Math.random() * parseInt(diceSize)) + 1;
        rolls.push(roll);
        total += roll;
      }

      if (modifier) {
        total += parseInt(modifier);
      }

      const resultText = `🎲 ${diceFormula}: [${rolls.join(', ')}] ${modifier || ''} = ${total}`;
      
      if (conversation) {
        base44.agents.addMessage(conversation, {
          role: "user",
          content: resultText
        });
      }
      
      toast.success(resultText);
    } catch (error) {
      toast.error('Dice roll failed');
    }
  };

  if (!character || !world) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p>Loading campaign...</p>
      </div>
    );
  }

  const worldTheme = world?.theme_colors || { primary: '#a855f7', secondary: '#ec4899', accent: '#8b5cf6' };

  return (
    <div 
      className="h-screen text-white flex flex-col"
      style={{
        background: `linear-gradient(to bottom right, ${worldTheme.primary}, ${worldTheme.secondary}, ${worldTheme.primary})`
      }}
    >
      {/* Header */}
      <div 
        className="backdrop-blur-sm border-b px-6 py-4"
        style={{
          backgroundColor: `${worldTheme.primary}cc`,
          borderColor: `${worldTheme.accent}4d`
        }}
      >
        <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-purple-300">{world.name}</h1>
                <p className="text-sm text-purple-400">{character.name} • Level {character.level}</p>
              </div>

              <CampaignStorytellerAI
                campaign={campaign}
                character={character}
                world={world}
                worldEvolution={worldEvolution}
              />

              <div className="flex gap-2">
                <div className="flex gap-2">
                  <Link to={createPageUrl(`CollaborativeCampaignHub?campaignId=${character?.id}`)}>
                    <Button variant="outline" size="sm" className="border-purple-500/50">
                      <Users className="w-4 h-4 mr-2" />
                      Campaign Hub
                    </Button>
                  </Link>
                  <Link to={createPageUrl(`PlayerDashboard?campaignId=${character?.id}`)}>
                    <Button variant="outline" size="sm" className="border-purple-500/50">
                      📊 Dashboard
                    </Button>
                  </Link>
                </div>
            <RecapGenerator 
              campaign={{ id: character?.id, title: `${character?.name}'s Adventure` }}
              conversation={conversation}
              onRecapGenerated={() => toast.success('Recap saved to Chronicle!')}
            />
            <Link to={createPageUrl(`CampaignHistory?campaignId=${character?.id}&characterId=${characterId}`)}>
              <Button variant="outline" size="sm" className="border-purple-500/50">
                <BookOpen className="w-4 h-4 mr-2" />
                Chronicle
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="border-purple-500/50">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-purple-500/50"
              onClick={() => setShowAIAssistant(!showAIAssistant)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Character Sheet Sidebar */}
        <div 
          className="w-80 backdrop-blur-sm border-r p-6 overflow-y-auto"
          style={{
            backgroundColor: `${worldTheme.primary}80`,
            borderColor: `${worldTheme.accent}4d`
          }}
        >
          <div className="space-y-6">
            {/* Character Avatar */}
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-3">
                {character.avatar_url ? (
                  <img src={character.avatar_url} alt={character.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-16 h-16" />
                )}
              </div>
              <h2 className="text-xl font-bold">{character.name}</h2>
              <p className="text-sm text-purple-300">{character.race} {character.class_role}</p>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-400" />
                    HP
                  </span>
                  <span>{character.resources?.hp_current || 0} / {character.resources?.hp_max || 0}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
                    style={{ width: `${((character.resources?.hp_current || 0) / (character.resources?.hp_max || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {character.resources?.mana_max > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-blue-400" />
                      Mana
                    </span>
                    <span>{character.resources?.mana_current || 0} / {character.resources?.mana_max || 0}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                      style={{ width: `${((character.resources?.mana_current || 0) / (character.resources?.mana_max || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Special Things */}
            {character.special_things?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Book className="w-4 h-4 text-purple-400" />
                  Special Traits
                </h3>
                <div className="space-y-2">
                  {character.special_things.map((thing, i) => (
                    <Card key={i} className="bg-slate-700/30 border-purple-500/20 p-3">
                      <p className="font-semibold text-sm text-purple-300">{thing.name}</p>
                      <p className="text-xs text-green-400 mt-1">✓ {thing.boon}</p>
                      <p className="text-xs text-red-400">✗ {thing.flaw}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Dice Roller */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Dices className="w-4 h-4 text-purple-400" />
                Quick Roll
              </h3>
              <div className="flex gap-2">
                <Input
                  value={diceFormula}
                  onChange={(e) => setDiceFormula(e.target.value)}
                  placeholder="1d20+5"
                  className="bg-slate-600/50 border-purple-500/30 text-white text-sm"
                />
                <Button
                  size="sm"
                  onClick={rollDice}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Roll
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Sidebar */}
        {showAIAssistant && (
          <div 
            className="w-96 backdrop-blur-sm border-l p-4 overflow-y-auto"
            style={{
              backgroundColor: `${worldTheme.primary}80`,
              borderColor: `${worldTheme.accent}4d`
            }}
          >
            <div className="space-y-4 overflow-y-auto">
              <SceneVisualizer
                currentScene={messages.length > 0 ? messages[messages.length-1]?.content : "Beginning of the adventure"}
                world={world}
              />

              <CampaignStateManager
                campaign={{ title: `${character.name}'s Adventure`, id: character.id }}
                character={character}
                messages={messages}
                world={world}
              />

              <AIDungeonMaster
                character={character}
                campaign={{ id: character.id, npcs: [] }}
                world={world}
                messages={messages}
              />

              <ProgressionTimeline
                character={character}
                campaignId={character.id}
              />

              <CharacterProgressionAI
                character={character}
                campaignId={character.id}
              />

              <EnhancedDungeonMaster
                character={character}
                campaign={{ id: character.id }}
                world={world}
                messages={messages}
              />

              <DynamicNPCScaling
                campaign={{ id: character.id, story_summary: messages.slice(-10).map(m => m.content).join('\n') }}
                playerCharacters={[character]}
              />
              
              <SynergisticUpgrades
                character={character}
                messages={messages}
              />

              <VillainEncounterGenerator
                world={world}
                character={character}
                campaignContext={messages.slice(-10).map(m => m.content).join('\n')}
              />

              <DungeonMasterTools
                messages={messages}
              />
              
              <CampaignQuestGenerator 
                worldId={world?.id}
                campaignId={character?.id}
                characters={[character]}
              />

              <CampaignAIAssistant 
                campaign={{ 
                  title: `${character.name}'s Adventure`,
                  current_scene: "Current adventure",
                  story_summary: character.backstory || "",
                  active_quests: [],
                  npcs: []
                }}
                character={character}
                world={world}
              />
            </div>
          </div>
        )}

        {/* Main Campaign Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-2xl ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-700/80 text-purple-100'
                } rounded-lg p-4`}>
                  {msg.role !== 'user' && (
                    <p className="text-xs text-purple-300 mb-2 font-semibold">
                      🎭 AI Game Master
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}

            {isSending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-slate-700/80 rounded-lg p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div 
            className="backdrop-blur-sm border-t p-6"
            style={{
              backgroundColor: `${worldTheme.primary}cc`,
              borderColor: `${worldTheme.accent}4d`
            }}
          >
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Describe your action or speak to the AI Game Master..."
                className="bg-slate-700/50 border-purple-500/30 text-white resize-none"
                rows={3}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isSending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            
            <p className="text-xs text-purple-400 mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}