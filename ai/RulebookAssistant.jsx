import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, BookOpen, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";

export default function RulebookAssistant({ rulebook, allRulebooks = [] }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [scenario, setScenario] = useState("");

  const askQuestion = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsAsking(true);
    try {
      const allRulebooksContext = allRulebooks.length > 0 ? `
Other Available Rulebooks: ${allRulebooks.map(r => `${r.title} (${r.game_system})`).join(', ')}
` : '';

      const context = `
Rulebook: ${rulebook.title}
Game System: ${rulebook.game_system}

Character Options: ${JSON.stringify(rulebook.character_options, null, 2)}
Game Mechanics: ${JSON.stringify(rulebook.game_mechanics, null, 2)}
Detailed Mechanics: ${JSON.stringify(rulebook.detailed_mechanics, null, 2)}
NPCs: ${JSON.stringify(rulebook.npcs, null, 2)}
Locations: ${JSON.stringify(rulebook.locations, null, 2)}
${allRulebooksContext}

User Question: ${question}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful tabletop RPG rules expert. Based on the rulebook content below, answer the user's question clearly and accurately. If the information isn't in the rulebook, say so. If multiple rulebooks are available, cross-reference when relevant.

${context}

Provide a clear, concise answer with examples if relevant.`,
        add_context_from_internet: false
      });

      setAnswer(response);
    } catch (error) {
      toast.error("Failed to get answer: " + error.message);
    }
    setIsAsking(false);
  };

  const findConflicts = async () => {
    setIsAsking(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this rulebook for potential rule conflicts, ambiguities, or unclear mechanics:

Rulebook: ${rulebook.title}
Mechanics: ${JSON.stringify(rulebook.game_mechanics)}
Detailed: ${JSON.stringify(rulebook.detailed_mechanics)}

Identify 3-5 areas where rules might conflict or need clarification. Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue: { type: "string" },
                  explanation: { type: "string" },
                  suggestion: { type: "string" }
                }
              }
            }
          }
        }
      });

      setConflicts(response.conflicts || []);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze rules");
    }
    setIsAsking(false);
  };

  const generateScenario = async () => {
    setIsAsking(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a detailed example scenario that demonstrates complex mechanics from this rulebook:

${rulebook.title}
Mechanics: ${JSON.stringify(rulebook.game_mechanics)}

The scenario should:
- Involve 2-3 complex rules
- Show step-by-step resolution
- Include dice rolls and calculations
- Demonstrate edge cases`,
        add_context_from_internet: false
      });

      setScenario(response);
      toast.success("Scenario generated!");
    } catch (error) {
      toast.error("Failed to generate scenario");
    }
    setIsAsking(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Rulebook Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ask" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
            <TabsTrigger value="ask">Q&A</TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
            <TabsTrigger value="scenario">Scenario</TabsTrigger>
          </TabsList>

          <TabsContent value="ask" className="space-y-3 mt-4">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about any rule, mechanic, or content from this rulebook..."
              className="bg-slate-700/50 border-purple-500/30 text-white min-h-[80px]"
            />
            <Button
              onClick={askQuestion}
              disabled={isAsking || !question.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isAsking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Ask Question
            </Button>
            {answer && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-300 mb-2">Answer:</h4>
                <p className="text-white text-sm whitespace-pre-wrap">{answer}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="conflicts" className="space-y-3 mt-4">
            <Button
              onClick={findConflicts}
              disabled={isAsking}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isAsking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
              Analyze Rule Conflicts
            </Button>
            {conflicts.map((conflict, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                <h5 className="font-semibold text-red-400 text-sm">{conflict.issue}</h5>
                <p className="text-xs text-white mt-1">{conflict.explanation}</p>
                <p className="text-xs text-green-400 mt-2">💡 Suggestion: {conflict.suggestion}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="scenario" className="space-y-3 mt-4">
            <Button
              onClick={generateScenario}
              disabled={isAsking}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isAsking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Generate Example Scenario
            </Button>
            {scenario && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-white whitespace-pre-wrap">{scenario}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}