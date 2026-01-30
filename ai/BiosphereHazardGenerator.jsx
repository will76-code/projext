import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Biohazard, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function BiosphereHazardGenerator({ worldId, campaignId }) {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [agentType, setAgentType] = useState("disease");
  const [spreadRing, setSpreadRing] = useState(0);
  const [evolutionLevel, setEvolutionLevel] = useState(1);
  const [generatedHazard, setGeneratedHazard] = useState(null);

  const createHazardMutation = useMutation({
    mutationFn: (data) => base44.entities.BiosphereHazard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biosphereHazards'] });
      toast.success("Hazard saved to campaign");
    }
  });

  const generateHazard = async () => {
    setGenerating(true);
    try {
      const DS = spreadRing + evolutionLevel;
      const accessChance = Math.max(0, 95 - (DS * 5));

      const prompt = `Generate a biosphere hazard for a TTRPG campaign using the Living Biosphere system.

Parameters:
- Agent Type: ${agentType}
- Spread Ring: R${spreadRing} (${['Target/Room', 'Street', 'Neighborhood', 'City Sector', 'City Coverage', 'Regional', 'Continent', 'Global'][spreadRing]})
- Evolution Level: E${evolutionLevel}
- Difficulty Score: ${DS}
- Access Chance: ${accessChance}%

Generate a case file including:
1. Case File ID (unique identifier)
2. Transmission vectors (2-4 methods)
3. Symptoms (stage-based, 3-5 symptoms per stage)
4. Active effects from appropriate bands
5. Forensic markers (clinical, environmental)
6. Countermeasures (immediate, experimental, long-term)
7. Mutation pressure factors
8. Narrative description

Return JSON with this structure:
{
  "case_file_id": "string",
  "transmission_vectors": ["array"],
  "symptoms": ["array"],
  "active_bands": [1, 2, 3],
  "active_effects": ["array"],
  "forensic_markers": {"clinical": [], "environmental": []},
  "countermeasures": {"immediate": [], "experimental": [], "long_term": []},
  "mutation_pressure": number,
  "narrative": "string"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            case_file_id: { type: "string" },
            transmission_vectors: { type: "array" },
            symptoms: { type: "array" },
            active_bands: { type: "array" },
            active_effects: { type: "array" },
            forensic_markers: { type: "object" },
            countermeasures: { type: "object" },
            mutation_pressure: { type: "number" },
            narrative: { type: "string" }
          }
        }
      });

      setGeneratedHazard(result);
      toast.success("Hazard generated!");
    } catch (error) {
      toast.error("Failed to generate hazard");
      console.error(error);
    }
    setGenerating(false);
  };

  const saveHazard = () => {
    if (!generatedHazard) return;

    createHazardMutation.mutate({
      world_id: worldId,
      campaign_id: campaignId,
      case_file_id: generatedHazard.case_file_id,
      agent_type: agentType,
      spread_ring: spreadRing,
      evolution_level: evolutionLevel,
      difficulty_score: spreadRing + evolutionLevel,
      active_bands: generatedHazard.active_bands,
      active_effects: generatedHazard.active_effects,
      transmission_vectors: generatedHazard.transmission_vectors,
      symptoms: generatedHazard.symptoms,
      countermeasures: generatedHazard.countermeasures,
      mutation_pressure: generatedHazard.mutation_pressure || 0,
      procedure_pressure: 0
    });
  };

  return (
    <Card className="bg-slate-800/50 border-red-500/30">
      <CardHeader>
        <CardTitle className="text-red-300 flex items-center gap-2">
          <Biohazard className="w-5 h-5" />
          Biosphere Hazard Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedHazard ? (
          <>
            <div>
              <Label className="text-white">Agent Type</Label>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger className="bg-slate-700 text-white border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="toxin">Toxin</SelectItem>
                  <SelectItem value="disease">Disease</SelectItem>
                  <SelectItem value="mutagen">Mutagen</SelectItem>
                  <SelectItem value="psychological">Psychological</SelectItem>
                  <SelectItem value="conceptual">Conceptual</SelectItem>
                  <SelectItem value="reality_threat">Reality Threat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Spread Ring (R0-R7)</Label>
              <Select value={spreadRing.toString()} onValueChange={(v) => setSpreadRing(parseInt(v))}>
                <SelectTrigger className="bg-slate-700 text-white border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="0">R0 - Target/Room</SelectItem>
                  <SelectItem value="1">R1 - Street</SelectItem>
                  <SelectItem value="2">R2 - Neighborhood</SelectItem>
                  <SelectItem value="3">R3 - City Sector</SelectItem>
                  <SelectItem value="4">R4 - City Coverage</SelectItem>
                  <SelectItem value="5">R5 - Regional</SelectItem>
                  <SelectItem value="6">R6 - Continent</SelectItem>
                  <SelectItem value="7">R7 - Global</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Evolution Level (E0-E10)</Label>
              <Select value={evolutionLevel.toString()} onValueChange={(v) => setEvolutionLevel(parseInt(v))}>
                <SelectTrigger className="bg-slate-700 text-white border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="0">E0 - Chemical/Toxin</SelectItem>
                  <SelectItem value="1">E1 - Human Pathogen</SelectItem>
                  <SelectItem value="2">E2 - Environmental Reservoir</SelectItem>
                  <SelectItem value="3">E3 - Spaceborne</SelectItem>
                  <SelectItem value="4">E4 - Animal Tier</SelectItem>
                  <SelectItem value="5">E5 - Higher Fauna</SelectItem>
                  <SelectItem value="6">E6 - Species Targeting</SelectItem>
                  <SelectItem value="7">E7 - Advanced Alien</SelectItem>
                  <SelectItem value="8">E8 - Conceptual/Sentient</SelectItem>
                  <SelectItem value="9">E9 - Multiversal</SelectItem>
                  <SelectItem value="10">E10 - Reality-Consuming</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
              <p className="text-xs text-yellow-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Difficulty Score: {spreadRing + evolutionLevel}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Access Chance: {Math.max(0, 95 - ((spreadRing + evolutionLevel) * 5))}%
              </p>
            </div>

            <Button
              onClick={generateHazard}
              disabled={generating}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Biohazard className="w-4 h-4 mr-2" />}
              Generate Hazard
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded p-4">
              <h4 className="text-white font-semibold mb-2">Case File: {generatedHazard.case_file_id}</h4>
              <p className="text-sm text-slate-300 mb-3">{generatedHazard.narrative}</p>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-red-300">Transmission:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {generatedHazard.transmission_vectors?.map((v, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-red-300">Symptoms:</p>
                  <ul className="text-xs text-slate-400 mt-1 space-y-0.5">
                    {generatedHazard.symptoms?.slice(0, 5).map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-green-300">Countermeasures:</p>
                  <ul className="text-xs text-slate-400 mt-1 space-y-0.5">
                    {generatedHazard.countermeasures?.immediate?.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setGeneratedHazard(null)}
                className="flex-1"
              >
                Generate New
              </Button>
              <Button
                onClick={saveHazard}
                disabled={createHazardMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Save to Campaign
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}