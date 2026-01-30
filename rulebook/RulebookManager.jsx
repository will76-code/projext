import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, BookOpen, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function RulebookManager({ worldId, existingRulebooks = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gameSystem, setGameSystem] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState("core_rulebook");
  const [rulebooks, setRulebooks] = useState(existingRulebooks);

  const gameSystems = [
    "dnd5e",
    "pathfinder2e",
    "starfinder",
    "naruto_n5e",
    "fabula_ultima",
    "avatar_legends",
    "exalted",
    "cyberpunk_red",
    "call_of_cthulhu",
    "mage_ascension",
    "vampire_masquerade",
    "werewolf_apocalypse",
    "tails_of_equestria",
    "dc_adventures",
    "custom"
  ];

  const categories = [
    "core_rulebook",
    "supplement",
    "adventure",
    "campaign_setting",
    "player_guide",
    "gm_guide",
    "bestiary",
    "equipment",
    "magic_items",
    "other"
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast.error("Please select a valid PDF file");
    }
  };

  const uploadRulebook = async () => {
    if (!selectedFile || !gameSystem) {
      toast.error("Select a file and game system");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      const newRulebook = {
        id: `rulebook_${Date.now()}`,
        game_system: gameSystem,
        title: selectedFile.name.replace(".pdf", ""),
        category,
        file_url,
        content_extracted: false,
        world_id: worldId
      };

      setRulebooks([...rulebooks, newRulebook]);
      
      // Save to database
      await base44.entities.Rulebook.create(newRulebook);

      toast.success("Rulebook added to world!");
      setSelectedFile(null);
      setGameSystem("");
      setCategory("core_rulebook");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to upload rulebook");
    }
    setUploading(false);
  };

  const removeRulebook = async (id) => {
    try {
      setRulebooks(rulebooks.filter(r => r.id !== id));
      toast.success("Rulebook removed");
    } catch (error) {
      toast.error("Failed to remove rulebook");
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-300 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Rulebooks
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Rulebook
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-blue-300">Add Rulebook to World</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 font-semibold">Game System</label>
                  <select
                    value={gameSystem}
                    onChange={(e) => setGameSystem(e.target.value)}
                    className="w-full mt-2 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300"
                  >
                    <option value="">Select a game system...</option>
                    {gameSystems.map(sys => (
                      <option key={sys} value={sys} className="capitalize">{sys.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-2 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="capitalize">{cat.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 font-semibold">PDF File</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="w-full mt-2 p-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300"
                  />
                  {selectedFile && (
                    <p className="text-xs text-green-400 mt-2">✓ {selectedFile.name}</p>
                  )}
                </div>

                <Button
                  onClick={uploadRulebook}
                  disabled={uploading || !selectedFile}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? "Uploading..." : "Add Rulebook"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {rulebooks.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No rulebooks added yet</p>
          ) : (
            rulebooks.map(rb => (
              <div key={rb.id} className="flex items-center justify-between bg-slate-700/30 border border-slate-600 rounded p-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">{rb.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">{rb.game_system.replace(/_/g, " ")}</Badge>
                    <Badge variant="outline" className="text-xs">{rb.category.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
                <Button
                  onClick={() => removeRulebook(rb.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}