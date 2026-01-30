import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoreConsistencyChecker({ worldId }) {
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);
  const [issues, setIssues] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [gmNotes, setGmNotes] = useState({});

  const { data: worldEvolution } = useQuery({
    queryKey: ['worldEvolution', worldId],
    queryFn: async () => {
      const evolution = await base44.entities.WorldEvolution.filter({ world_id: worldId });
      return evolution[0];
    },
    enabled: !!worldId
  });

  const { data: loreContributions } = useQuery({
    queryKey: ['loreContributions', worldId],
    queryFn: () => base44.entities.LoreContribution.filter({ world_id: worldId })
  });

  const { data: world } = useQuery({
    queryKey: ['world', worldId],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ id: worldId });
      return worlds[0];
    },
    enabled: !!worldId
  });

  const { data: rulebooks } = useQuery({
    queryKey: ['rulebooks'],
    queryFn: () => base44.entities.Rulebook.list()
  });

  const updateIssuesMutation = useMutation({
    mutationFn: (data) => base44.entities.LoreContribution.update(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loreContributions', worldId] });
      toast.success('Issue updated!');
    }
  });

  const checkConsistency = async () => {
    setIsChecking(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze lore for consistency, contradictions, and franchise adherence:

World: ${world?.name}
Franchise: ${world?.rulebook_franchise}
Genre: ${world?.genre}

World Evolution Data:
${JSON.stringify(worldEvolution || {})}

User-Generated Lore:
${JSON.stringify(loreContributions?.slice(0, 30) || [])}

Rulebook Context:
${JSON.stringify(rulebooks?.slice(0, 5).map(r => ({ title: r.title, content: r.character_options })) || [])}

Identify:
1. Direct contradictions between lore pieces
2. Timeline inconsistencies
3. Character/faction behavior violations
4. Deviation from franchise guidelines
5. Unresolved plot threads
6. Power level inconsistencies

For each issue, suggest resolution`,
        response_json_schema: {
          type: "object",
          properties: {
            consistency_score: { type: "number" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string", enum: ["minor", "moderate", "critical"] },
                  issue_type: { type: "string" },
                  description: { type: "string" },
                  affected_lore: { type: "array", items: { type: "string" } },
                  contradiction_details: { type: "string" },
                  suggested_resolution: { type: "string" },
                  franchise_impact: { type: "string" }
                }
              }
            },
            overall_assessment: { type: "string" }
          }
        }
      });

      setIssues(analysis.issues || []);
      toast.success('Consistency check complete!');
    } catch (error) {
      toast.error('Failed to check consistency');
    }
    setIsChecking(false);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-600/20 border-red-500/30 text-red-300',
      moderate: 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300',
      minor: 'bg-blue-600/20 border-blue-500/30 text-blue-300'
    };
    return colors[severity] || colors.minor;
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') return '🚨';
    if (severity === 'moderate') return '⚠️';
    return 'ℹ️';
  };

  const criticalIssues = issues?.filter(i => i.severity === 'critical') || [];
  const moderateIssues = issues?.filter(i => i.severity === 'moderate') || [];
  const minorIssues = issues?.filter(i => i.severity === 'minor') || [];

  return (
    <Card className="bg-slate-800/50 border-purple-500/30 col-span-2">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Lore Consistency Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={checkConsistency}
          disabled={isChecking}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
        >
          {isChecking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
          Run Consistency Check
        </Button>

        {issues && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{criticalIssues.length}</p>
                <p className="text-xs text-red-300">Critical</p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{moderateIssues.length}</p>
                <p className="text-xs text-yellow-300">Moderate</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">{minorIssues.length}</p>
                <p className="text-xs text-blue-300">Minor</p>
              </div>
            </div>

            {/* Issues by Severity */}
            <Tabs defaultValue="critical" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                <TabsTrigger value="critical" className={`text-xs ${criticalIssues.length > 0 ? 'text-red-400' : ''}`}>
                  Critical ({criticalIssues.length})
                </TabsTrigger>
                <TabsTrigger value="moderate" className={`text-xs ${moderateIssues.length > 0 ? 'text-yellow-400' : ''}`}>
                  Moderate ({moderateIssues.length})
                </TabsTrigger>
                <TabsTrigger value="minor" className={`text-xs ${minorIssues.length > 0 ? 'text-blue-400' : ''}`}>
                  Minor ({minorIssues.length})
                </TabsTrigger>
              </TabsList>

              {/* Critical Issues */}
              <TabsContent value="critical" className="space-y-2 mt-3">
                {criticalIssues.length === 0 ? (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-300">No critical issues found!</p>
                  </div>
                ) : (
                  criticalIssues.map((issue, i) => (
                    <IssueCard key={i} issue={issue} index={i} severity="critical" />
                  ))
                )}
              </TabsContent>

              {/* Moderate Issues */}
              <TabsContent value="moderate" className="space-y-2 mt-3">
                {moderateIssues.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No moderate issues found.</p>
                ) : (
                  moderateIssues.map((issue, i) => (
                    <IssueCard key={i} issue={issue} index={i} severity="moderate" />
                  ))
                )}
              </TabsContent>

              {/* Minor Issues */}
              <TabsContent value="minor" className="space-y-2 mt-3">
                {minorIssues.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No minor issues found.</p>
                ) : (
                  minorIssues.map((issue, i) => (
                    <IssueCard key={i} issue={issue} index={i} severity="minor" />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IssueCard({ issue, index, severity }) {
  const [expanded, setExpanded] = React.useState(false);

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-600/20 border-red-500/30 text-red-300',
      moderate: 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300',
      minor: 'bg-blue-600/20 border-blue-500/30 text-blue-300'
    };
    return colors[severity] || colors.minor;
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') return '🚨';
    if (severity === 'moderate') return '⚠️';
    return 'ℹ️';
  };

  return (
    <div key={index} className={`rounded-lg p-3 border space-y-2 cursor-pointer ${getSeverityColor(severity)}`} onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold flex items-center gap-2">
            {getSeverityIcon(severity)} {issue.issue_type}
          </p>
          <p className="text-xs mt-1">{issue.description}</p>
        </div>
        <Badge className="bg-slate-600">{expanded ? '▼' : '▶'}</Badge>
      </div>

      {expanded && (
        <div className="space-y-2 mt-2 border-t border-current opacity-75 pt-2">
          {issue.affected_lore?.length > 0 && (
            <div className="text-xs">
              <p className="font-semibold mb-1">Affected Lore:</p>
              <ul className="ml-2 list-disc space-y-1">
                {issue.affected_lore.map((lore, i) => (
                  <li key={i}>{lore}</li>
                ))}
              </ul>
            </div>
          )}

          {issue.contradiction_details && (
            <div className="text-xs bg-black/20 rounded p-2">
              <p className="font-semibold mb-1">Contradiction Details:</p>
              <p>{issue.contradiction_details}</p>
            </div>
          )}

          {issue.suggested_resolution && (
            <div className="text-xs bg-green-900/30 rounded p-2 border border-green-500/30">
              <p className="font-semibold text-green-300 mb-1">💡 Suggested Resolution:</p>
              <p className="text-green-200">{issue.suggested_resolution}</p>
            </div>
          )}

          {issue.franchise_impact && (
            <div className="text-xs bg-purple-900/30 rounded p-2 border border-purple-500/30">
              <p className="font-semibold text-purple-300 mb-1">Franchise Impact:</p>
              <p className="text-purple-200">{issue.franchise_impact}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}