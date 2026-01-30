import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain } from "lucide-react";
import { toast } from "sonner";

export default function LorePuzzleGenerator({ worldId, difficulty = "medium" }) {
  const [puzzle, setPuzzle] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: loreEntries } = useQuery({
    queryKey: ['loreEntries', worldId],
    queryFn: async () => {
      try {
        const entries = await base44.entities.LoreEntry.filter({ world_id: worldId });
        return entries.slice(0, 5).map(e => ({ title: e.title, content: e.content }));
      } catch {
        return [];
      }
    },
    enabled: !!worldId
  });

  const generatePuzzle = async () => {
    setIsGenerating(true);
    setShowSolution(false);
    try {
      const loreContext = loreEntries?.map(l => `${l.title}: ${l.content}`).join('\n') || 'A mysterious world';
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a ${difficulty} puzzle or riddle for a tabletop RPG, based on this world lore:

${loreContext}

The puzzle should:
1. Reference specific lore elements from the world
2. Be solvable but challenging
3. Have multiple possible solutions (if applicable)
4. Reward creative thinking

Respond as JSON with: puzzle (the riddle/puzzle text), answer (the solution), hints (array of 3 progressive hints), difficulty (easy/medium/hard), loreReferences (array of which lore elements are involved)`,
        response_json_schema: {
          type: "object",
          properties: {
            puzzle: { type: "string" },
            answer: { type: "string" },
            hints: { type: "array", items: { type: "string" } },
            difficulty: { type: "string" },
            loreReferences: { type: "array", items: { type: "string" } }
          }
        }
      });
      setPuzzle(result);
      toast.success('Puzzle generated!');
    } catch (error) {
      toast.error('Failed to generate puzzle');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const difficultyColors = {
    easy: 'bg-green-900',
    medium: 'bg-yellow-900',
    hard: 'bg-red-900'
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Lore-Based Puzzle Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!puzzle ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-700/50 border border-purple-500/30 rounded px-3 py-2 text-sm text-slate-200"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <Button
              onClick={generatePuzzle}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              Generate Puzzle
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3 space-y-2">
                <Badge className={difficultyColors[puzzle.difficulty]}>{puzzle.difficulty}</Badge>
                <p className="text-sm text-slate-300 font-semibold italic">{puzzle.puzzle}</p>
              </div>

              <div className="space-y-1">
                <h6 className="font-semibold text-slate-300 text-sm">Hints</h6>
                {puzzle.hints?.map((hint, i) => (
                  <details key={i} className="text-xs text-slate-400 cursor-pointer">
                    <summary className="hover:text-slate-300">💡 Hint {i + 1}</summary>
                    <p className="mt-1 ml-4 text-slate-300">{hint}</p>
                  </details>
                ))}
              </div>

              {showSolution && (
                <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                  <p className="text-sm text-green-300"><strong>Solution:</strong> {puzzle.answer}</p>
                </div>
              )}

              <div className="space-y-1">
                <h6 className="font-semibold text-slate-300 text-sm">Lore Elements</h6>
                <div className="flex flex-wrap gap-1">
                  {puzzle.loreReferences?.map((ref, i) => (
                    <Badge key={i} className="bg-slate-700 text-xs">{ref}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowSolution(!showSolution)}
                variant="outline"
                className="flex-1 border-green-500/50"
              >
                {showSolution ? 'Hide' : 'Show'} Solution
              </Button>
              <Button
                onClick={() => setPuzzle(null)}
                variant="outline"
                className="flex-1 border-purple-500/50"
              >
                New Puzzle
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}