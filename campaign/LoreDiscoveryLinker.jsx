import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookMarked, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function LoreDiscoveryLinker({ campaignId, worldId }) {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [linkedEntries, setLinkedEntries] = useState([]);
  const [userContribution, setUserContribution] = useState("");
  const [isSubmittingLore, setIsSubmittingLore] = useState(false);

  const { data: journals } = useQuery({
    queryKey: ['journals', campaignId],
    queryFn: () => base44.entities.CampaignJournal.filter({ campaign_id: campaignId })
  });

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const { data: rulebooks } = useQuery({
    queryKey: ['rulebooks'],
    queryFn: () => base44.entities.Rulebook.list()
  });

  const submitLoreContribution = async () => {
    if (!userContribution.trim()) {
      toast.error('Please enter a lore contribution');
      return;
    }

    setIsSubmittingLore(true);
    try {
      await base44.entities.LoreContribution.create({
        world_id: worldId,
        contribution_type: "lore_snippet",
        title: userContribution.slice(0, 50),
        content: userContribution,
        submitted_by: await base44.auth.me().then(u => u.email),
        status: "pending_review"
      });
      toast.success('Lore contribution submitted for review!');
      setUserContribution("");
    } catch (error) {
      toast.error('Failed to submit contribution');
    }
    setIsSubmittingLore(false);
  };

  const linkJournalToLore = async () => {
    if (!journals || journals.length === 0) {
      toast.error('No journal entries found');
      return;
    }

    setIsAnalyzing(true);
    try {
      const journalContent = journals.map(j => `[${j.entry_type}] ${j.content}`).join('\n\n');
      const loreLinks = await base44.integrations.Core.InvokeLLM({
        prompt: `Link campaign journal entries to world lore and rulebook data with suggested connections:

Campaign Journal Entries:
${journalContent}

World Evolution Lore:
${JSON.stringify(worldEvolution?.emergent_lore?.slice(0, 10) || [])}

Simulated World Events:
${JSON.stringify(worldEvolution?.simulated_events?.slice(0, 10) || [])}

Rulebook Context:
${JSON.stringify(rulebooks?.slice(0, 3).map(r => ({ title: r.title, category: r.category })) || [])}

For each journal entry, identify:
1. Direct connections to world lore (specific lore pieces)
2. Connection to simulated world events
3. Impact on world state
4. Relevance to rulebook franchise
5. Discovery insights for players
6. Suggested new lore that emerges from this entry`,
        response_json_schema: {
          type: "object",
          properties: {
            linked_entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  journal_excerpt: { type: "string" },
                  lore_connections: { type: "array", items: { type: "string" } },
                  world_event_links: { type: "array", items: { type: "string" } },
                  world_state_impact: { type: "string" },
                  discovery_note: { type: "string" }
                }
              }
            }
          }
        }
      });

      setLinkedEntries(loreLinks.linked_entries || []);
      toast.success('Lore links discovered!');
    } catch (error) {
      toast.error('Failed to link lore');
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <BookMarked className="w-5 h-5" />
            Lore Discovery Linker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={linkJournalToLore}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
            Link Journal to World Lore
          </Button>

        {linkedEntries.length > 0 && (
          <div className="space-y-3">
            {linkedEntries.map((entry, i) => (
              <div key={i} className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 space-y-2">
                <p className="text-sm text-amber-300 italic">"{entry.journal_excerpt}"</p>

                {entry.lore_connections?.length > 0 && (
                  <div>
                    <p className="text-xs text-amber-400 font-semibold mb-1">📖 Lore Connections:</p>
                    <div className="flex flex-wrap gap-1">
                      {entry.lore_connections.map((conn, j) => (
                        <Badge key={j} variant="outline" className="border-amber-500/50 text-amber-300 text-xs">
                          {conn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {entry.world_event_links?.length > 0 && (
                  <div>
                    <p className="text-xs text-purple-400 font-semibold mb-1">⚡ World Events:</p>
                    <div className="flex flex-wrap gap-1">
                      {entry.world_event_links.map((link, j) => (
                        <Badge key={j} className="bg-purple-600/60 text-purple-200 text-xs">
                          {link}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {entry.world_state_impact && (
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-xs text-green-400">🌍 World Impact: <span className="text-green-300">{entry.world_state_impact}</span></p>
                  </div>
                )}

                {entry.discovery_note && (
                  <div className="bg-slate-800/50 rounded p-2">
                    <p className="text-xs text-yellow-400">💡 <span className="text-yellow-300">{entry.discovery_note}</span></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-amber-300 flex items-center gap-2">
            📖 Player Lore Contributions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={userContribution}
            onChange={(e) => setUserContribution(e.target.value)}
            placeholder="Contribute your own lore discovery or story element to the world..."
            className="w-full bg-slate-700/50 border border-amber-500/30 rounded p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            rows={4}
          />
          <Button
            onClick={submitLoreContribution}
            disabled={isSubmittingLore || !userContribution.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {isSubmittingLore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Submit for GM Review
          </Button>
        </CardContent>
        </Card>
        </div>
        );
        }