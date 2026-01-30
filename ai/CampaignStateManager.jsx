import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, MapPin, Users, Book, Zap, FileText } from "lucide-react";
import { toast } from "sonner";

export default function CampaignStateManager({ campaign, character, messages }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [state, setState] = useState({
    narrative_summary: "",
    key_events: [],
    character_development: "",
    world_changes: [],
    suggested_arcs: []
  });
  const [journalEntries, setJournalEntries] = useState([]);
  const [dynamicEvent, setDynamicEvent] = useState(null);

  const analyzeCampaignState = async () => {
    setIsAnalyzing(true);
    try {
      const recentMessages = messages.slice(-20);
      const conversationText = recentMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n\n');

      const context = `
Campaign: ${campaign.title}
Character: ${character.name} - Level ${character.level} ${character.race} ${character.class_role}
Recent Conversation:
${conversationText}
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this RPG campaign and provide a comprehensive state report. Track:
1. Narrative Summary - What has happened so far
2. Key Events - Major plot points (list of strings)
3. Character Development - How the character has grown
4. World Changes - Any changes to the world state (list of strings)
5. Suggested Story Arcs - 3 potential directions for the story (list of objects with title and description)

${context}

Return as JSON with the structure specified.`,
        response_json_schema: {
          type: "object",
          properties: {
            narrative_summary: { type: "string" },
            key_events: {
              type: "array",
              items: { type: "string" }
            },
            character_development: { type: "string" },
            world_changes: {
              type: "array",
              items: { type: "string" }
            },
            suggested_arcs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      setState(response);
      
      // Auto-log significant events to journal
      const newEntries = response.key_events?.map(event => ({
        timestamp: new Date().toISOString(),
        type: 'event',
        content: event
      })) || [];
      setJournalEntries(prev => [...prev, ...newEntries]);
      
      toast.success("Campaign state analyzed!");
    } catch (error) {
      toast.error("Failed to analyze campaign state");
    }
    setIsAnalyzing(false);
  };

  const generateDynamicEvent = async () => {
    setIsAnalyzing(true);
    try {
      const recentMessages = messages.slice(-10);
      const conversationText = recentMessages.map(m => m.content).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on recent player actions, generate an unexpected dynamic event that:
- Reacts to what the player just did
- Creates new complications or opportunities
- Feels organic and surprising
- Advances the narrative

Recent Actions:
${conversationText}

Return as JSON with title, description, consequences array, and choices array.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            consequences: { type: "array", items: { type: "string" } },
            choices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  option: { type: "string" },
                  outcome: { type: "string" }
                }
              }
            }
          }
        }
      });

      setDynamicEvent(response);
      toast.success("Dynamic event generated!");
    } catch (error) {
      toast.error("Failed to generate event");
    }
    setIsAnalyzing(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Campaign State Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-purple-300">
          AI-powered analysis of campaign progress, character development, and narrative direction
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={analyzeCampaignState}
            disabled={isAnalyzing || messages.length < 5}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Analyze State
          </Button>
          <Button
            onClick={generateDynamicEvent}
            disabled={isAnalyzing || messages.length < 5}
            className="bg-pink-600 hover:bg-pink-700"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Dynamic Event
          </Button>
        </div>

        {state.narrative_summary && (
          <>
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                <Book className="w-4 h-4" />
                Narrative Summary
              </h4>
              <p className="text-white text-sm whitespace-pre-wrap">{state.narrative_summary}</p>
            </div>

            {state.key_events.length > 0 && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Key Events
                </h4>
                <ul className="space-y-1">
                  {state.key_events.map((event, i) => (
                    <li key={i} className="text-sm text-white flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{event}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {state.character_development && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Character Development
                </h4>
                <p className="text-white text-sm whitespace-pre-wrap">{state.character_development}</p>
              </div>
            )}

            {state.world_changes.length > 0 && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-300 mb-2">World Changes</h4>
                <ul className="space-y-1">
                  {state.world_changes.map((change, i) => (
                    <li key={i} className="text-sm text-white flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {state.suggested_arcs.length > 0 && (
              <div>
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Suggested Story Arcs
                </h4>
                <div className="space-y-2">
                  {state.suggested_arcs.map((arc, i) => (
                    <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                      <h5 className="font-semibold text-purple-300 text-sm">{arc.title}</h5>
                      <p className="text-xs text-white mt-1">{arc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dynamicEvent && (
              <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-pink-300 text-lg mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {dynamicEvent.title}
                </h4>
                <p className="text-sm text-white mb-3">{dynamicEvent.description}</p>
                
                {dynamicEvent.consequences?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-pink-400 mb-1">Consequences:</p>
                    <ul className="space-y-1">
                      {dynamicEvent.consequences.map((cons, i) => (
                        <li key={i} className="text-xs text-white flex items-start gap-2">
                          <span className="text-pink-400">•</span>
                          <span>{cons}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {dynamicEvent.choices?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-pink-400 mb-2">Player Choices:</p>
                    <div className="space-y-2">
                      {dynamicEvent.choices.map((choice, i) => (
                        <div key={i} className="bg-slate-800/50 rounded p-2">
                          <p className="text-xs font-semibold text-pink-300">{choice.option}</p>
                          <p className="text-xs text-white mt-1">→ {choice.outcome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {journalEntries.length > 0 && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Campaign Journal ({journalEntries.length} entries)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {journalEntries.slice(-10).map((entry, i) => (
                    <div key={i} className="text-xs bg-slate-800/50 rounded p-2">
                      <p className="text-purple-400 font-semibold">{new Date(entry.timestamp).toLocaleString()}</p>
                      <p className="text-white mt-1">{entry.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}