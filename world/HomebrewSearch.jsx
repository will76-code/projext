import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function HomebrewSearch({ world }) {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const searchHomebrew = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const searchQuery = `${world.game_system} ${world.genre} homebrew ${query} rules traits powers`;
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for homebrew content and compile the findings:

World: ${world.name}
System: ${world.game_system}
Search Query: ${query}

Find homebrew:
- New power sets/abilities
- Custom traits and features
- Race/class options
- Unique mechanics
- Community variants

Summarize each finding with source credibility. Return as JSON.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  content_type: { type: "string" },
                  mechanics: { type: "string" },
                  source: { type: "string" },
                  rating: { type: "string" }
                }
              }
            }
          }
        }
      });

      setResults(response.results || []);
      toast.success(`Found ${response.results?.length || 0} homebrew ideas!`);
    } catch (error) {
      toast.error("Search failed");
    }
    setIsSearching(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Homebrew Content Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-purple-300">
          Search the web for homebrew rules, powers, and traits for {world.name}
        </p>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchHomebrew()}
            placeholder="Search for homebrew (e.g., 'vampire disciplines', 'new jutsu')"
            className="bg-slate-700/50 border-purple-500/30 text-white"
          />
          <Button
            onClick={searchHomebrew}
            disabled={isSearching || !query.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-purple-300">{result.title}</h5>
                  <span className="text-xs text-purple-400">{result.content_type}</span>
                </div>
                <p className="text-sm text-white mb-2">{result.description}</p>
                {result.mechanics && (
                  <div className="bg-slate-800/50 rounded p-2 mb-2">
                    <p className="text-xs text-purple-400 font-semibold mb-1">Mechanics:</p>
                    <p className="text-xs text-white">{result.mechanics}</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-400">Source: {result.source}</span>
                  <span className="text-green-400">Rating: {result.rating}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}