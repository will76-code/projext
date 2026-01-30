import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, BookOpen, History, Users as UsersIcon, Landmark } from "lucide-react";
import { toast } from "sonner";

export default function WorldLoreAssistant({ world }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lore, setLore] = useState({ history: "", culture: "", features: "", pantheon: "", geography: "" });
  const [conversationHistory, setConversationHistory] = useState([]);

  const generateLore = async (type) => {
    setIsGenerating(true);
    try {
      const context = `
World: ${world.name}
Genre: ${world.genre}
Game System: ${world.game_system}
Description: ${world.description || 'No description yet'}
`;

      let prompt = "";
      if (type === "history") {
        prompt = `Generate a rich historical timeline for this world, including major eras, significant events, and how they shaped the current state of the world.\n\n${context}`;
      } else if (type === "culture") {
        prompt = `Generate detailed cultural aspects for this world including social structures, traditions, specific festivals/celebrations, taboos, marriage customs, coming-of-age rituals, burial practices, arts, and daily life.\n\n${context}`;
      } else if (type === "features") {
        prompt = `Generate 5 unique world features such as magical phenomena, technological marvels, natural wonders, or special locations that make this world distinctive.\n\n${context}\n\nReturn as JSON array.`;
      } else if (type === "pantheon") {
        prompt = `Generate a complete pantheon or religious system for this world including:\n- Major deities/spiritual forces and their domains\n- Religious practices and temples\n- Clergy structure\n- Holy symbols and artifacts\n- Religious conflicts or schisms\n\n${context}`;
      } else if (type === "geography") {
        prompt = `Generate detailed geography for this world including:\n- Major continents/regions with climate\n- Important cities and their characteristics\n- Natural landmarks and resources\n- Trade routes and political boundaries\n- Dangerous/mysterious zones\n\n${context}`;
      }

      if (type === "features") {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              features: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        });
        setLore({ ...lore, features: JSON.stringify(response.features, null, 2) });
      } else {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: false
        });
        setLore({ ...lore, [type]: response });
      }
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated!`);
    } catch (error) {
      toast.error("Failed to generate lore");
    }
    setIsGenerating(false);
  };

  const askQuestion = async () => {
    if (!question.trim()) return;
    
    setIsGenerating(true);
    try {
      const conversationContext = conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n');
      const context = `
World: ${world.name}
Genre: ${world.genre}
Game System: ${world.game_system}
Description: ${world.description}
Generated Lore:
${lore.history ? `History: ${lore.history}` : ''}
${lore.culture ? `Culture: ${lore.culture}` : ''}
${lore.features ? `Features: ${lore.features}` : ''}
${lore.pantheon ? `Pantheon: ${lore.pantheon}` : ''}
${lore.geography ? `Geography: ${lore.geography}` : ''}

Previous Conversation:
${conversationContext}

User Question: ${question}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a world-building expert. Based on the world information and previous conversation below, answer the user's question in detail, maintaining consistency with the world's genre and existing lore. Build upon previous answers for follow-up questions.\n\n${context}`,
        add_context_from_internet: false
      });

      setConversationHistory([...conversationHistory, { role: 'user', content: question }, { role: 'assistant', content: response }]);
      setAnswer(response);
      setQuestion("");
    } catch (error) {
      toast.error("Failed to answer question");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          World Lore Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
            <TabsTrigger value="generate">Generate Lore</TabsTrigger>
            <TabsTrigger value="ask">Ask Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-3 mt-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => generateLore("history")}
                disabled={isGenerating}
                className="w-full bg-purple-600 hover:bg-purple-700 justify-start"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <History className="w-4 h-4 mr-2" />}
                Generate Historical Timeline
              </Button>
              
              <Button
                onClick={() => generateLore("culture")}
                disabled={isGenerating}
                className="w-full bg-purple-600 hover:bg-purple-700 justify-start"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UsersIcon className="w-4 h-4 mr-2" />}
                Generate Cultural Details
              </Button>
              
              <Button
                onClick={() => generateLore("features")}
                disabled={isGenerating}
                className="w-full bg-purple-600 hover:bg-purple-700 justify-start"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Landmark className="w-4 h-4 mr-2" />}
                Generate Unique Features
              </Button>

              <Button
                onClick={() => generateLore("pantheon")}
                disabled={isGenerating}
                className="w-full bg-purple-600 hover:bg-purple-700 justify-start"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Pantheon & Religion
              </Button>

              <Button
                onClick={() => generateLore("geography")}
                disabled={isGenerating}
                className="w-full bg-purple-600 hover:bg-purple-700 justify-start"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Landmark className="w-4 h-4 mr-2" />}
                Generate Detailed Geography
              </Button>
            </div>

            {lore.history && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Historical Timeline
                </h4>
                <p className="text-white text-sm whitespace-pre-wrap">{lore.history}</p>
              </div>
            )}

            {lore.culture && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4" />
                  Cultural Details
                </h4>
                <p className="text-white text-sm whitespace-pre-wrap">{lore.culture}</p>
              </div>
            )}

            {lore.features && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <Landmark className="w-4 h-4" />
                  Unique Features
                </h4>
                <pre className="text-white text-sm whitespace-pre-wrap">{lore.features}</pre>
              </div>
            )}

            {lore.pantheon && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Pantheon & Religion
                </h4>
                <p className="text-white text-sm whitespace-pre-wrap">{lore.pantheon}</p>
              </div>
            )}

            {lore.geography && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <Landmark className="w-4 h-4" />
                  Geography
                </h4>
                <p className="text-white text-sm whitespace-pre-wrap">{lore.geography}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ask" className="space-y-3 mt-4">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about lore, history, culture, geography, or any world detail..."
              className="bg-slate-700/50 border-purple-500/30 text-white min-h-[80px]"
            />
            
            <Button
              onClick={askQuestion}
              disabled={isGenerating || !question.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Answer...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Ask Question
                </>
              )}
            </Button>

            {conversationHistory.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {conversationHistory.map((msg, i) => (
                  <div key={i} className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-slate-700/50' : 'bg-purple-900/20 border border-purple-500/30'}`}>
                    <p className="text-xs font-semibold text-purple-400 mb-1">{msg.role === 'user' ? 'You' : 'Lorekeeper'}</p>
                    <p className="text-white text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}