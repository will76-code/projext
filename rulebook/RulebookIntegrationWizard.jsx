import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Upload, Link as LinkIcon, CheckCircle2, AlertCircle, Edit3, BookOpen, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RulebookIntegrationWizard({ onComplete }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [importMethod, setImportMethod] = useState("file");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [externalUrls, setExternalUrls] = useState("");
  const [gameSystem, setGameSystem] = useState("");
  const [category, setCategory] = useState("core_rulebook");
  const [extractedData, setExtractedData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rulebookId, setRulebookId] = useState(null);
  const [manualEdits, setManualEdits] = useState({});
  const [isTagging, setIsTagging] = useState(false);
  const [tags, setTags] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, url }) => {
      if (file) {
        return await base44.integrations.Core.UploadFile({ file });
      }
      return { file_url: url };
    }
  });

  const extractContentMutation = useMutation({
    mutationFn: async (fileUrl) => {
      const prompt = `Analyze this TTRPG rulebook comprehensively. Extract all key information. Return ONLY valid JSON:
{
  "title": "Detected book title",
  "character_options": {
    "races": ["list of races/species"],
    "classes": ["list of classes"],
    "abilities": ["key abilities"],
    "attributes": ["stat names like STR, DEX, etc"]
  },
  "game_mechanics": {
    "core_rules": "Brief summary of core rules",
    "dice_system": "Dice mechanics (d20, d6, etc)",
    "progression": "How characters advance",
    "action_economy": "Turn structure"
  },
  "detailed_mechanics": {
    "combat_rules": {
      "initiative": "How initiative works",
      "attack_resolution": "Attack mechanics",
      "damage_system": "Damage calculation",
      "special_actions": ["Special combat actions"]
    },
    "skill_check_system": {
      "basic_mechanic": "How skills work",
      "difficulty_levels": "DC/difficulty system",
      "modifiers": "Bonuses and penalties"
    },
    "magic_system": {
      "casting_mechanic": "How magic is cast",
      "spell_components": "Components required",
      "limitations": "Magic limitations"
    }
  },
  "npcs": [{"name": "NPC name", "role": "role", "description": "description", "stats": {}}],
  "locations": [{"name": "Location", "type": "city/dungeon/etc", "description": "description"}],
  "lore_snippets": ["Important lore pieces"],
  "magic_items": [{"name": "Item", "type": "weapon/armor/etc", "effect": "effect"}]
}`;

      return await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [fileUrl],
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            character_options: { type: "object" },
            game_mechanics: { type: "object" },
            detailed_mechanics: { type: "object" },
            npcs: { type: "array" },
            locations: { type: "array" },
            lore_snippets: { type: "array" },
            magic_items: { type: "array" }
          }
        }
      });
    }
  });

  const saveRulebookMutation = useMutation({
    mutationFn: async (data) => {
      if (rulebookId) {
        return await base44.entities.Rulebook.update(rulebookId, data);
      }
      return await base44.entities.Rulebook.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rulebooks'] });
      toast.success("Rulebook saved successfully!");
      if (onComplete) onComplete();
    }
  });

  const handleImport = async () => {
    if (importMethod === "file" && selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    if (importMethod === "url" && !externalUrls.trim()) {
      toast.error("Please provide at least one URL");
      return;
    }
    if (!gameSystem) {
      toast.error("Please select a game system");
      return;
    }

    setProcessing(true);
    setProgress(20);

    try {
      let fileUrl;
      if (importMethod === "file") {
        const result = await uploadMutation.mutateAsync({ file: selectedFiles[0] });
        fileUrl = result.file_url;
      } else {
        fileUrl = externalUrls.trim().split('\n')[0].trim();
      }

      setProgress(40);
      
      const extracted = await extractContentMutation.mutateAsync(fileUrl);
      setExtractedData(extracted);
      
      const title = extracted.title || selectedFiles[0]?.name.replace('.pdf', '') || 'Untitled Rulebook';
      
      const rulebook = await base44.entities.Rulebook.create({
        game_system: gameSystem,
        title: title,
        category: category,
        file_url: fileUrl,
        content_extracted: true,
        character_options: extracted.character_options || {},
        game_mechanics: extracted.game_mechanics || {},
        detailed_mechanics: extracted.detailed_mechanics || {},
        npcs: extracted.npcs || [],
        locations: extracted.locations || [],
        campaigns: []
      });

      setRulebookId(rulebook.id);
      setProgress(100);
      setStep(2);
      toast.success("Extraction complete! Review and edit the data.");
    } catch (error) {
      toast.error(`Failed to process rulebook: ${error.message}`);
      setProgress(0);
    }
    setProcessing(false);
  };

  const aiTagSections = async () => {
    if (!extractedData) return;

    setIsTagging(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this rulebook and identify section tags.

Content:
Mechanics: ${JSON.stringify(extractedData.game_mechanics || {}).substring(0, 500)}
NPCs: ${JSON.stringify(extractedData.npcs || []).substring(0, 500)}

Tag sections as: Combat, Magic, Skills, Lore, Equipment, Character Creation, NPCs, Locations

Return JSON:
{
  "primary_focus": ["Combat", "Magic"],
  "recommended_use": "Best for tactical combat and magic-heavy campaigns"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            primary_focus: { type: "array" },
            recommended_use: { type: "string" }
          }
        }
      });

      setTags(result);
      toast.success("Sections tagged!");
    } catch (error) {
      toast.error("Failed to tag sections");
    }
    setIsTagging(false);
  };

  const handleManualEdit = (section, key, value) => {
    setManualEdits(prev => ({
      ...prev,
      [`${section}.${key}`]: value
    }));
  };

  const handleSaveEdits = async () => {
    setProcessing(true);
    try {
      const updatedData = { ...extractedData };
      
      Object.keys(manualEdits).forEach(path => {
        const [section, ...keys] = path.split('.');
        let target = updatedData[section];
        for (let i = 0; i < keys.length - 1; i++) {
          target = target[keys[i]];
        }
        target[keys[keys.length - 1]] = manualEdits[path];
      });

      await saveRulebookMutation.mutateAsync({
        character_options: updatedData.character_options,
        game_mechanics: updatedData.game_mechanics,
        detailed_mechanics: updatedData.detailed_mechanics,
        npcs: updatedData.npcs,
        locations: updatedData.locations
      });

      setStep(3);
    } catch (error) {
      toast.error("Failed to save edits");
    }
    setProcessing(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <BookOpen className="w-4 h-4 mr-2" />
          Launch Integration Wizard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl text-purple-300 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Rulebook Integration Wizard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= s ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`w-24 h-1 mx-2 ${step > s ? 'bg-purple-600' : 'bg-slate-700'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Import */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Step 1: Import Rulebook</h3>
              
              <div>
                <Label>Game System</Label>
                <Select value={gameSystem} onValueChange={setGameSystem}>
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dnd5e">D&D 5e</SelectItem>
                    <SelectItem value="pathfinder2e">Pathfinder 2e</SelectItem>
                    <SelectItem value="starfinder">Starfinder</SelectItem>
                    <SelectItem value="call_of_cthulhu">Call of Cthulhu</SelectItem>
                    <SelectItem value="cyberpunk_red">Cyberpunk Red</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core_rulebook">Core Rulebook</SelectItem>
                    <SelectItem value="supplement">Supplement</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="campaign_setting">Campaign Setting</SelectItem>
                    <SelectItem value="bestiary">Bestiary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={importMethod} onValueChange={setImportMethod}>
                <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                  <TabsTrigger value="file">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    URL Link
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                    className="bg-slate-800 border-slate-600"
                  />
                  <p className="text-xs text-slate-400">Supports PDFs up to 512MB</p>
                </TabsContent>

                <TabsContent value="url" className="space-y-2">
                  <Textarea
                    value={externalUrls}
                    onChange={(e) => setExternalUrls(e.target.value)}
                    placeholder="https://example.com/rulebook.pdf"
                    className="bg-slate-800 border-slate-600 font-mono text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-slate-400">Dropbox, Google Drive, S3, or direct PDF links</p>
                </TabsContent>
              </Tabs>

              {processing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-slate-400 text-center">
                    {progress < 40 ? "Uploading..." : progress < 80 ? "Extracting content..." : "Finalizing..."}
                  </p>
                </div>
              )}

              <Button onClick={handleImport} disabled={processing} className="w-full bg-purple-600 hover:bg-purple-700">
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                {processing ? "Processing..." : "Import & Extract"}
              </Button>
            </div>
          )}

          {/* Step 2: Review & Edit */}
          {step === 2 && extractedData && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Step 2: Review Extracted Data</h3>

              {/* AI Tagging */}
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-3">
                <p className="text-sm text-indigo-300 mb-2">
                  AI can tag sections for easier navigation
                </p>
                <Button onClick={aiTagSections} disabled={isTagging} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  {isTagging ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                  {isTagging ? "Tagging..." : "AI Tag Sections"}
                </Button>
                {tags && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1">Focus: {tags.primary_focus?.join(", ")}</p>
                    <p className="text-xs text-slate-400 italic">{tags.recommended_use}</p>
                  </div>
                )}
              </div>
              
              <Tabs defaultValue="mechanics" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-800">
                  <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
                  <TabsTrigger value="characters">Characters</TabsTrigger>
                  <TabsTrigger value="npcs">NPCs</TabsTrigger>
                  <TabsTrigger value="locations">Locations</TabsTrigger>
                </TabsList>

                <TabsContent value="mechanics" className="space-y-3 max-h-96 overflow-y-auto">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm text-slate-300">Core Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-400">{extractedData.game_mechanics?.core_rules}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-sm text-slate-300">Dice System</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-400">{extractedData.game_mechanics?.dice_system}</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="characters" className="space-y-2 max-h-96 overflow-y-auto">
                  <div>
                    <Label className="text-xs text-slate-400">Races/Species</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedData.character_options?.races?.map((race, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{race}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Classes</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {extractedData.character_options?.classes?.map((cls, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-purple-900/20">{cls}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="npcs" className="space-y-2 max-h-96 overflow-y-auto">
                  {extractedData.npcs?.map((npc, i) => (
                    <Card key={i} className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-300">{npc.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-slate-400">{npc.description}</p>
                        {npc.role && <Badge className="mt-1 text-xs">{npc.role}</Badge>}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="locations" className="space-y-2 max-h-96 overflow-y-auto">
                  {extractedData.locations?.map((loc, i) => (
                    <Card key={i} className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-300">{loc.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-slate-400">{loc.description}</p>
                        {loc.type && <Badge className="mt-1 text-xs">{loc.type}</Badge>}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleSaveEdits} disabled={processing} className="flex-1 bg-green-600 hover:bg-green-700">
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Save & Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="text-center space-y-4 py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">Integration Complete!</h3>
              <p className="text-slate-400">
                Your rulebook has been successfully imported and indexed. The AI can now reference this content for character creation and world building.
              </p>
              <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}