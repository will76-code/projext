import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, BookOpen, Loader2, Check, Upload, FileUp, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function WorldRulebookManager({ worldId, currentWorld }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedRuleBooks, setSelectedRuleBooks] = useState([]);
  const [uploadMethod, setUploadMethod] = useState("existing");
  const [newRulebookFile, setNewRulebookFile] = useState(null);
  const [newRulebookUrl, setNewRulebookUrl] = useState("");
  const [newRulebookCategory, setNewRulebookCategory] = useState("supplement");
  const [uploading, setUploading] = useState(false);

  const { data: world } = useQuery({
    queryKey: ['world', worldId],
    queryFn: () => base44.entities.World.read(worldId),
    enabled: !!worldId
  });

  const { data: allRuleBooks = [] } = useQuery({
    queryKey: ['rulebooks'],
    queryFn: () => base44.entities.Rulebook.list('-created_date')
  });

  const { data: worldRuleBooks = [] } = useQuery({
    queryKey: ['worldRuleBooks', worldId],
    queryFn: async () => {
      if (!world?.unique_mechanics?.rulebook_ids) return [];
      return Promise.all(
        world.unique_mechanics.rulebook_ids.map(id => 
          base44.entities.Rulebook.read(id)
        )
      );
    },
    enabled: !!world
  });

  const updateMutation = useMutation({
    mutationFn: async (rulebookIds) => {
      await base44.entities.World.update(worldId, {
        unique_mechanics: {
          ...world.unique_mechanics,
          rulebook_ids: rulebookIds
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['world', worldId] });
      queryClient.invalidateQueries({ queryKey: ['worldRuleBooks', worldId] });
      toast.success("Rulebooks updated");
      setOpen(false);
      setSelectedRuleBooks([]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (rulebookId) => {
      const newIds = (world.unique_mechanics?.rulebook_ids || []).filter(id => id !== rulebookId);
      await base44.entities.World.update(worldId, {
        unique_mechanics: {
          ...world.unique_mechanics,
          rulebook_ids: newIds
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worldRuleBooks', worldId] });
      toast.success("Rulebook removed");
    }
  });

  const handleAddRuleBooks = () => {
    const currentIds = world.unique_mechanics?.rulebook_ids || [];
    const newIds = [...new Set([...currentIds, ...selectedRuleBooks])];
    updateMutation.mutate(newIds);
  };

  const handleUploadNewRulebook = async () => {
    if (uploadMethod === "new-file" && !newRulebookFile) {
      toast.error("Please select a file");
      return;
    }
    if (uploadMethod === "new-url" && !newRulebookUrl.trim()) {
      toast.error("Please provide a URL");
      return;
    }

    setUploading(true);
    try {
      let fileUrl;
      let title;

      if (uploadMethod === "new-file") {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: newRulebookFile });
        fileUrl = file_url;
        title = newRulebookFile.name.replace('.pdf', '');
      } else {
        fileUrl = newRulebookUrl.trim();
        title = fileUrl.split('/').pop().replace('.pdf', '') || 'New Rulebook';
      }

      // Create rulebook
      const rulebook = await base44.entities.Rulebook.create({
        game_system: currentWorld?.game_system || "custom",
        title: title,
        category: newRulebookCategory,
        file_url: fileUrl,
        content_extracted: false
      });

      // Extract content
      const extractedData = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract key content from this TTRPG rulebook. Return ONLY valid JSON with: character_options, game_mechanics, detailed_mechanics, npcs, locations`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            character_options: { type: "object" },
            game_mechanics: { type: "object" },
            detailed_mechanics: { type: "object" },
            npcs: { type: "array" },
            locations: { type: "array" }
          }
        }
      });

      await base44.entities.Rulebook.update(rulebook.id, {
        content_extracted: true,
        ...extractedData
      });

      // Add to world
      const currentIds = world.unique_mechanics?.rulebook_ids || [];
      await base44.entities.World.update(worldId, {
        unique_mechanics: {
          ...world.unique_mechanics,
          rulebook_ids: [...currentIds, rulebook.id]
        }
      });

      toast.success("Rulebook uploaded and added to world!");
      queryClient.invalidateQueries({ queryKey: ['worldRuleBooks', worldId] });
      queryClient.invalidateQueries({ queryKey: ['rulebooks'] });
      setNewRulebookFile(null);
      setNewRulebookUrl("");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to upload rulebook");
    }
    setUploading(false);
  };

  const availableRuleBooks = allRuleBooks.filter(rb => 
    !worldRuleBooks.some(wrb => wrb.id === rb.id)
  );

  return (
    <Card className="bg-slate-800/50 border-amber-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-amber-300 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            World Rulebooks
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Rulebook
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Rulebooks to World</DialogTitle>
              </DialogHeader>

              <Tabs value={uploadMethod} onValueChange={setUploadMethod}>
                <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                  <TabsTrigger value="existing">Existing</TabsTrigger>
                  <TabsTrigger value="new-file">Upload New</TabsTrigger>
                  <TabsTrigger value="new-url">URL Link</TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="space-y-3 max-h-96 overflow-y-auto mt-4">
                {availableRuleBooks.length === 0 ? (
                  <p className="text-slate-400 text-sm">No available rulebooks. Upload some first.</p>
                ) : (
                  availableRuleBooks.map(rb => (
                    <div
                      key={rb.id}
                      onClick={() => setSelectedRuleBooks(prev => 
                        prev.includes(rb.id) 
                          ? prev.filter(id => id !== rb.id)
                          : [...prev, rb.id]
                      )}
                      className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                        selectedRuleBooks.includes(rb.id)
                          ? 'border-amber-500 bg-amber-900/30'
                          : 'border-slate-600 bg-slate-700/30 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-200">{rb.title}</h4>
                          <p className="text-xs text-slate-400">{rb.game_system}</p>
                        </div>
                        {selectedRuleBooks.includes(rb.id) && (
                          <Check className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                    </div>
                  ))
                )}
                <Button
                  onClick={handleAddRuleBooks}
                  disabled={selectedRuleBooks.length === 0 || updateMutation.isPending}
                  className="w-full bg-amber-600 hover:bg-amber-700 mt-4"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Selected {selectedRuleBooks.length > 0 && `(${selectedRuleBooks.length})`}
                </Button>
              </TabsContent>

              <TabsContent value="new-file" className="space-y-3 mt-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newRulebookCategory} onValueChange={setNewRulebookCategory}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplement">Supplement</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="bestiary">Bestiary</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>PDF File</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setNewRulebookFile(e.target.files[0])}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <Button
                  onClick={handleUploadNewRulebook}
                  disabled={!newRulebookFile || uploading}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading & Extracting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Add to World
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="new-url" className="space-y-3 mt-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newRulebookCategory} onValueChange={setNewRulebookCategory}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplement">Supplement</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="bestiary">Bestiary</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rulebook URL</Label>
                  <Input
                    value={newRulebookUrl}
                    onChange={(e) => setNewRulebookUrl(e.target.value)}
                    placeholder="https://example.com/rulebook.pdf"
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <Button
                  onClick={handleUploadNewRulebook}
                  disabled={!newRulebookUrl.trim() || uploading}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing & Extracting...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Link & Add to World
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {worldRuleBooks.length === 0 ? (
          <p className="text-slate-400 text-sm">No rulebooks assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {worldRuleBooks.map(rb => (
              <div
                key={rb.id}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600"
              >
                <div>
                  <h4 className="font-semibold text-slate-200">{rb.title}</h4>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {rb.game_system}
                    </Badge>
                    {rb.content_extracted && (
                      <Badge className="bg-green-900/50 text-green-300 text-xs">
                        ✓ Extracted
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(rb.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}