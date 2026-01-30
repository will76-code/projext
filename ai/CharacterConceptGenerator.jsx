import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function CharacterConceptGenerator({ character, world, onSelectConcept }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [concepts, setConcepts] = useState([]);
  const [aiLevel, setAiLevel] = useState(1);
  const [usageCount, setUsageCount] = useState(0);

  const generateConcepts = async () => {
    setIsGenerating(true);
    setUsageCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3 && aiLevel < 3) setAiLevel(prev => prev + 1);
      return newCount;
    });
    try {
      const depthLevel = aiLevel === 3 ? '\n\nEXPERT MODE: Create DEEPLY nuanced concepts with complex motivations and rich backstories.' : aiLevel === 2 ? '\n\nENHANCED MODE: Create more detailed concepts with deeper connections.' : '';
      const context = `
World: ${world?.name || 'Unknown'} (${world?.genre || 'fantasy'}, ${world?.game_system || 'custom'})
Character Race: ${character.race || 'Unknown'}
Character Class: ${character.class_role || 'Unknown'}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 unique and compelling character concepts for this RPG character. Each concept should include:
- A distinctive backstory (2-3 sentences)
- Primary motivation
- A potential plot hook that ties them to adventures
- Personality traits

${context}

Make each concept feel completely different from the others. Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            concepts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  backstory: { type: "string" },
                  motivation: { type: "string" },
                  plot_hook: { type: "string" },
                  personality: { type: "string" }
                }
              }
            }
          }
        }
      });

      setConcepts(response.concepts || []);
      toast.success("Character concepts generated!");
    } catch (error) {
      toast.error("Failed to generate concepts");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Character Concepts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-purple-300">
          Generate unique character concepts with backstories, motivations, and plot hooks
        </p>
        
        <Button
          onClick={generateConcepts}
          disabled={isGenerating}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Concepts...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate 3 Character Concepts
            </>
          )}
        </Button>

        {concepts.map((concept, i) => (
          <Card key={i} className="bg-slate-700/30 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-purple-300">{concept.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-purple-400 mb-1">Backstory</p>
                <p className="text-sm text-white">{concept.backstory}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-purple-400 mb-1">Motivation</p>
                <p className="text-sm text-white">{concept.motivation}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-purple-400 mb-1">Plot Hook</p>
                <p className="text-sm text-white">{concept.plot_hook}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-purple-400 mb-1">Personality</p>
                <p className="text-sm text-white">{concept.personality}</p>
              </div>

              <Button
                onClick={() => onSelectConcept(concept)}
                className="w-full bg-green-600 hover:bg-green-700 mt-2"
              >
                <Check className="w-4 h-4 mr-2" />
                Use This Concept
              </Button>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}