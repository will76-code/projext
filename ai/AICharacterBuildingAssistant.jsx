import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Book, Lightbulb, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AICharacterBuildingAssistant({ world, rulebooks, characterData, onSuggestion }) {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [mechanicalAdvice, setMechanicalAdvice] = useState(null);

  const generateBackstory = async () => {
    if (!characterData.name || !characterData.race) {
      toast.error("Please provide at least a name and race first");
      return;
    }

    setLoading(true);
    try {
      const rulebookContext = rulebooks.slice(0, 2).map(r => 
        `${r.title}: ${JSON.stringify(r.game_mechanics || {}).substring(0, 300)}`
      ).join("\n");

      const prompt = `Create a compelling backstory for a ${characterData.race} ${characterData.class_role || 'adventurer'} named ${characterData.name} in the world "${world.name}" (${world.description}).

World Genre: ${world.genre}
Game System: ${world.game_system}
Character Level: ${characterData.level}

Rulebook Context:
${rulebookContext}

Generate a 2-3 paragraph backstory that:
- Fits the world's lore and genre
- Explains their race and class choice
- Provides motivation for adventure
- Is mechanically consistent with the ${world.game_system} system

Return ONLY valid JSON:
{
  "backstory": "The backstory text",
  "personality_traits": ["trait 1", "trait 2"],
  "ideal": "character ideal",
  "bond": "character bond",
  "flaw": "character flaw"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            backstory: { type: "string" },
            personality_traits: { type: "array" },
            ideal: { type: "string" },
            bond: { type: "string" },
            flaw: { type: "string" }
          }
        }
      });

      setSuggestions(result);
      if (onSuggestion) onSuggestion(result);
      toast.success("Backstory generated!");
    } catch (error) {
      toast.error("Failed to generate backstory");
    }
    setLoading(false);
  };

  const getMechanicalAdvice = async () => {
    if (!characterData.class_role) {
      toast.error("Please select a class first");
      return;
    }

    setLoading(true);
    try {
      const rulebookContext = rulebooks.slice(0, 3).map(r => 
        `${r.title}:\nMechanics: ${JSON.stringify(r.detailed_mechanics || {}).substring(0, 500)}\nCharacter Options: ${JSON.stringify(r.character_options || {}).substring(0, 300)}`
      ).join("\n\n");

      const prompt = `Provide mechanical advice for building a ${characterData.class_role} in ${world.game_system}.

Character: ${characterData.name} (${characterData.race} ${characterData.class_role})
Level: ${characterData.level}
Current Attributes: ${JSON.stringify(characterData.attributes)}

Rulebook Context:
${rulebookContext}

Provide tactical advice on:
1. Optimal attribute allocation
2. Key skills or abilities to prioritize
3. Equipment recommendations
4. Combat strategies
5. Character progression path

Return ONLY valid JSON:
{
  "attribute_recommendations": {"attribute": "advice"},
  "key_abilities": ["ability 1", "ability 2"],
  "equipment_suggestions": ["item 1", "item 2"],
  "tactical_advice": "tactical summary",
  "progression_path": "level-up advice"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            attribute_recommendations: { type: "object" },
            key_abilities: { type: "array" },
            equipment_suggestions: { type: "array" },
            tactical_advice: { type: "string" },
            progression_path: { type: "string" }
          }
        }
      });

      setMechanicalAdvice(result);
      toast.success("Mechanical advice generated!");
    } catch (error) {
      toast.error("Failed to generate advice");
    }
    setLoading(false);
  };

  const askQuestion = async () => {
    if (!query.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setLoading(true);
    try {
      const rulebookContext = rulebooks.map(r => 
        `${r.title}: ${JSON.stringify(r.game_mechanics || {}).substring(0, 200)}`
      ).join("\n");

      const prompt = `Answer this character building question for ${world.game_system}:

Question: ${query}

Context:
- World: ${world.name} (${world.genre})
- Character: ${characterData.name} (${characterData.race} ${characterData.class_role}, Level ${characterData.level})
- System: ${world.game_system}

Rulebooks:
${rulebookContext}

Provide a clear, rules-accurate answer with specific examples. Be concise but thorough.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      toast.success("Answer generated!");
      setSuggestions({ custom_answer: result });
    } catch (error) {
      toast.error("Failed to get answer");
    }
    setLoading(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 sticky top-6">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Character Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="backstory" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
            <TabsTrigger value="backstory" className="text-xs">
              <Book className="w-3 h-3 mr-1" />
              Story
            </TabsTrigger>
            <TabsTrigger value="mechanics" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" />
              Build
            </TabsTrigger>
            <TabsTrigger value="qa" className="text-xs">
              Q&A
            </TabsTrigger>
          </TabsList>

          <TabsContent value="backstory" className="space-y-3">
            <Button
              onClick={generateBackstory}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
              Generate Backstory
            </Button>

            {suggestions?.backstory && (
              <div className="space-y-2">
                <div className="bg-slate-700/30 rounded p-3">
                  <p className="text-xs text-slate-300 leading-relaxed">{suggestions.backstory}</p>
                </div>
                
                {suggestions.personality_traits && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Personality</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestions.personality_traits.map((trait, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{trait}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.ideal && (
                  <div className="text-xs">
                    <span className="font-semibold text-slate-400">Ideal:</span>
                    <span className="text-slate-300 ml-1">{suggestions.ideal}</span>
                  </div>
                )}

                <Button
                  onClick={() => onSuggestion && onSuggestion(suggestions)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <CheckCircle2 className="w-3 h-3 mr-2" />
                  Apply to Character
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mechanics" className="space-y-3">
            <Button
              onClick={getMechanicalAdvice}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Lightbulb className="w-3 h-3 mr-2" />}
              Get Build Advice
            </Button>

            {mechanicalAdvice && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {mechanicalAdvice.attribute_recommendations && (
                  <div className="bg-slate-700/30 rounded p-2">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Attributes</p>
                    <div className="text-xs text-slate-300 space-y-1">
                      {Object.entries(mechanicalAdvice.attribute_recommendations).map(([attr, advice]) => (
                        <p key={attr}><span className="font-semibold">{attr}:</span> {advice}</p>
                      ))}
                    </div>
                  </div>
                )}

                {mechanicalAdvice.key_abilities && (
                  <div className="bg-slate-700/30 rounded p-2">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Key Abilities</p>
                    <div className="flex flex-wrap gap-1">
                      {mechanicalAdvice.key_abilities.map((ability, i) => (
                        <Badge key={i} className="text-xs bg-blue-900/40">{ability}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {mechanicalAdvice.equipment_suggestions && (
                  <div className="bg-slate-700/30 rounded p-2">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Equipment</p>
                    <div className="flex flex-wrap gap-1">
                      {mechanicalAdvice.equipment_suggestions.map((item, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {mechanicalAdvice.tactical_advice && (
                  <div className="bg-slate-700/30 rounded p-2">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Tactics</p>
                    <p className="text-xs text-slate-300">{mechanicalAdvice.tactical_advice}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="qa" className="space-y-3">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about rules, abilities, strategies..."
              rows={3}
              className="bg-slate-700/50 border-slate-600 text-white text-xs"
            />
            <Button
              onClick={askQuestion}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
              Ask AI
            </Button>

            {suggestions?.custom_answer && (
              <div className="bg-slate-700/30 rounded p-3">
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{suggestions.custom_answer}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {rulebooks.length > 0 && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded p-2">
            <p className="text-xs text-purple-300 font-semibold mb-1">Available Rulebooks</p>
            <div className="space-y-1">
              {rulebooks.slice(0, 3).map(book => (
                <p key={book.id} className="text-xs text-slate-400">• {book.title}</p>
              ))}
              {rulebooks.length > 3 && (
                <p className="text-xs text-slate-500">+ {rulebooks.length - 3} more</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}