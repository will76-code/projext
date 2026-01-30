import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Sparkles, Loader2, ThumbsUp, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function CollaborativeLoreBuilder({ worldId }) {
  const queryClient = useQueryClient();
  const [contributionType, setContributionType] = useState("lore_snippet");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: contributions } = useQuery({
    queryKey: ['loreContributions', worldId],
    queryFn: () => base44.entities.LoreContribution.filter({ world_id: worldId }, '-created_date'),
    initialData: []
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      setIsReviewing(true);
      
      // Get world, rulebooks, and evolution data
      const world = await base44.entities.World.filter({ id: worldId });
      const worldEvolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      const rulebooks = world[0]?.unique_mechanics?.rulebook_ids 
        ? await base44.entities.Rulebook.filter({ id: { $in: world[0].unique_mechanics.rulebook_ids } })
        : [];

      // AI consistency review
      const aiReview = await base44.integrations.Core.InvokeLLM({
        prompt: `Review this lore contribution for ${world[0]?.name} (${world[0]?.rulebook_franchise}):

Title: ${data.title}
Type: ${data.contribution_type}
Content: ${data.content}

Existing Rulebook Data: ${JSON.stringify(rulebooks.map(r => ({ title: r.title, npcs: r.npcs?.slice(0, 3), locations: r.locations?.slice(0, 3) })))}
World Evolution: ${JSON.stringify(worldEvolution[0]?.emergent_lore?.slice(0, 5) || [])}

Check for:
1. Consistency with established lore
2. Contradictions with rulebook canon or world history
3. Quality and coherence
4. Franchise-appropriate themes

Return consistency_score (0-100), contradictions array, suggestions array, and references array.`,
        response_json_schema: {
          type: "object",
          properties: {
            consistency_score: { type: "number" },
            contradictions: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } },
            references: { type: "array", items: { type: "string" } }
          }
        }
      });

      setIsReviewing(false);
      
      return await base44.entities.LoreContribution.create({
        ...data,
        ai_review: aiReview,
        status: aiReview.consistency_score >= 70 ? 'ai_reviewed' : 'needs_revision'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreContributions', worldId] });
      setTitle("");
      setContent("");
      toast.success("Lore submitted and AI reviewed!");
    }
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, upvotes }) => base44.entities.LoreContribution.update(id, { upvotes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loreContributions', worldId] })
  });

  const approveMutation = useMutation({
    mutationFn: async (contribution) => {
      await base44.entities.LoreContribution.update(contribution.id, { status: 'approved' });
      
      // Add to WorldEvolution
      const worldEvolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      const existing = worldEvolution[0];
      
      if (existing) {
        await base44.entities.WorldEvolution.update(existing.id, {
          emergent_lore: [
            ...(existing.emergent_lore || []),
            {
              lore_type: contribution.contribution_type,
              content: `${contribution.title}: ${contribution.content}`,
              triggered_by: `community_${contribution.submitted_by}`,
              created_date: new Date().toISOString()
            }
          ]
        });
      } else {
        await base44.entities.WorldEvolution.create({
          world_id: worldId,
          emergent_lore: [{
            lore_type: contribution.contribution_type,
            content: `${contribution.title}: ${contribution.content}`,
            triggered_by: `community_${contribution.submitted_by}`,
            created_date: new Date().toISOString()
          }]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreContributions', worldId] });
      queryClient.invalidateQueries({ queryKey: ['worldEvolution', worldId] });
      toast.success("Lore approved and added to world!");
    }
  });

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Collaborative Lore Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
            <TabsTrigger value="submit">Submit Lore</TabsTrigger>
            <TabsTrigger value="review">Community Lore</TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="space-y-3 mt-4">
            <select
              value={contributionType}
              onChange={(e) => setContributionType(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-700/50 border border-purple-500/30 text-white text-sm"
            >
              <option value="lore_snippet">Lore Snippet</option>
              <option value="faction">Faction</option>
              <option value="historical_event">Historical Event</option>
              <option value="location">Location</option>
              <option value="npc">NPC</option>
            </select>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="bg-slate-700/50 border-purple-500/30 text-white"
            />

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detailed lore content..."
              className="bg-slate-700/50 border-purple-500/30 text-white resize-none"
              rows={6}
            />

            <Button
              onClick={() => submitMutation.mutate({
                world_id: worldId,
                contribution_type: contributionType,
                title,
                content,
                submitted_by: user?.email
              })}
              disabled={!title.trim() || !content.trim() || isReviewing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isReviewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Submit for AI Review
            </Button>
          </TabsContent>

          <TabsContent value="review" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
            {contributions.map((contribution) => (
              <div key={contribution.id} className="bg-slate-700/30 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-semibold text-purple-300">{contribution.title}</h5>
                    <p className="text-xs text-purple-400">{contribution.contribution_type} by {contribution.submitted_by?.split('@')[0]}</p>
                  </div>
                  <Badge className={
                    contribution.status === 'approved' ? 'bg-green-600' :
                    contribution.status === 'needs_revision' ? 'bg-red-600' :
                    contribution.status === 'ai_reviewed' ? 'bg-blue-600' : 'bg-slate-600'
                  }>
                    {contribution.status}
                  </Badge>
                </div>

                <p className="text-sm text-white mb-2">{contribution.content}</p>

                {contribution.ai_review && (
                  <div className="bg-slate-800/50 rounded p-2 mb-2 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-400">AI Consistency Score:</span>
                      <Badge className={contribution.ai_review.consistency_score >= 70 ? 'bg-green-600' : 'bg-red-600'}>
                        {contribution.ai_review.consistency_score}%
                      </Badge>
                    </div>

                    {contribution.ai_review.contradictions?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-red-400 flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3" />
                          Contradictions:
                        </p>
                        <ul className="ml-3 text-red-300">
                          {contribution.ai_review.contradictions.map((c, i) => (
                            <li key={i}>• {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {contribution.ai_review.suggestions?.length > 0 && (
                      <div>
                        <p className="text-yellow-400 mb-1">Suggestions:</p>
                        <ul className="ml-3 text-yellow-300">
                          {contribution.ai_review.suggestions.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const upvotes = contribution.upvotes || [];
                      const updated = upvotes.includes(user?.email)
                        ? upvotes.filter(e => e !== user?.email)
                        : [...upvotes, user?.email];
                      voteMutation.mutate({ id: contribution.id, upvotes: updated });
                    }}
                    className={`text-xs ${(contribution.upvotes || []).includes(user?.email) ? 'text-purple-400' : 'text-slate-400'}`}
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {(contribution.upvotes || []).length}
                  </Button>

                  {contribution.status === 'ai_reviewed' && contribution.ai_review?.consistency_score >= 70 && (
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(contribution)}
                      className="bg-green-600 hover:bg-green-700 text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve & Add to World
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}