import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BookOpen, Loader2, Trash2, Link as LinkIcon, FileUp, HelpCircle, RefreshCw, CheckSquare, Square, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import RulebookCard from "../components/rulebook/RulebookCard";
import RulebookAssistant from "../components/ai/RulebookAssistant";
import SupplementaryContentGenerator from "../components/rulebook/SupplementaryContentGenerator";
import LoreGenerator from "../components/rulebook/LoreGenerator";
import RulebookMechanicsDisplay from "../components/rulebook/RulebookMechanicsDisplay";
import SynergisticRulebookAnalyzer from "../components/ai/SynergisticRulebookAnalyzer";
import RulebookFileManager from "../components/rulebook/RulebookFileManager";
import GameElementGenerator from "../components/ai/GameElementGenerator";
import RulebookIntegrationWizard from "../components/rulebook/RulebookIntegrationWizard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import PlatformGuide from "../components/help/PlatformGuide";
import AIRulebookComparison from "../components/rulebook/AIRulebookComparison";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function RulebookManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [gameSystem, setGameSystem] = useState("");
  const [category, setCategory] = useState("other");
  const [genre, setGenre] = useState("fantasy");
  const [worldName, setWorldName] = useState("");
  const [worldDescription, setWorldDescription] = useState("");
  const [franchise, setFranchise] = useState("custom");
  const [isPublic, setIsPublic] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadProgress, setUploadProgress] = useState([]);
  const [selectedRulebook, setSelectedRulebook] = useState(null);
  const [uploadMethod, setUploadMethod] = useState("file");
  const [externalUrls, setExternalUrls] = useState("");
  const [selectedPendingFiles, setSelectedPendingFiles] = useState([]);

  const deletePendingFiles = async (fileIndex) => {
    try {
      setUploadProgress(prev => prev.filter((_, i) => i !== fileIndex));
      toast.success("File removed from queue");
    } catch (error) {
      toast.error("Failed to remove file");
    }
  };

  const { data: rulebooks } = useQuery({
    queryKey: ['rulebooks'],
    queryFn: () => base44.entities.Rulebook.list('-created_date'),
    initialData: []
  });

  const extractedRulebooks = rulebooks.filter(r => r.content_extracted);

  const filteredRulebooks = rulebooks.filter(rulebook => {
    const search = searchQuery.toLowerCase();
    return (
      rulebook.title.toLowerCase().includes(search) ||
      rulebook.game_system.toLowerCase().includes(search) ||
      (rulebook.category && rulebook.category.toLowerCase().includes(search))
    );
  });

  const uploadFileWithRetry = async (file, retries = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await base44.integrations.Core.UploadFile({ file });
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
    throw new Error(`Upload failed after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
  };

  const extractContentWithRetry = async (file_url, retries = 3) => {
    const prompt = `Analyze this tabletop RPG rulebook and extract key content. Return ONLY valid JSON:
  {
  "character_options": {
    "races": ["max 10 races/species"],
    "classes": ["max 10 classes"],
    "abilities": ["max 15 abilities"],
    "attributes": ["stat names"]
  },
  "game_mechanics": {
    "core_rules": "1-2 sentences",
    "dice_system": "dice system",
    "progression": "advancement"
  },
  "detailed_mechanics": {
    "combat_rules": {
      "initiative": "initiative",
      "attack_resolution": "attacks",
      "damage_system": "damage",
      "special_actions": ["actions"]
    },
    "skill_check_system": {
      "basic_mechanic": "mechanic",
      "difficulty_levels": "difficulties",
      "modifiers": "modifiers"
    },
    "magic_system": {
      "casting_mechanic": "casting",
      "spell_components": "components",
      "limitations": "limits"
    }
  },
  "npcs": [],
  "locations": [],
  "campaigns": []
  }`;

    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          file_urls: [file_url],
          add_context_from_internet: false,
          response_json_schema: {
            type: "object",
            properties: {
              character_options: { type: "object" },
              game_mechanics: { type: "object" },
              detailed_mechanics: { type: "object" },
              npcs: { type: "array" },
              locations: { type: "array" },
              campaigns: { type: "array" }
            }
          }
        });
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
    throw new Error(`Content extraction failed after ${retries} attempts: ${lastError?.message || 'AI processing error'}`);
  };

  const uploadMultipleFiles = async () => {
    const filesFromInput = selectedFiles.length;
    const urlsFromInput = externalUrls.trim() ? externalUrls.trim().split('\n').filter(u => u.trim()) : [];
    const totalItems = filesFromInput + urlsFromInput.length;

    if (totalItems === 0 || !gameSystem || !worldName.trim()) {
      toast.error("Please provide world name, files/URLs, and game system");
      return;
    }

    setUploading(true);
    
    const fileProgress = selectedFiles.map(f => ({ name: f.name, status: 'pending', type: 'file' }));
    const urlProgress = urlsFromInput.map(url => {
      const name = url.split('/').pop() || url.substring(0, 50) + '...';
      return { name, url, status: 'pending', type: 'url' };
    });
    
    setUploadProgress([...fileProgress, ...urlProgress]);
    const rulebookIds = [];

    // Process file uploads
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const title = file.name.replace('.pdf', '');

      try {
        const existingRulebooks = await base44.entities.Rulebook.filter({ title });
        if (existingRulebooks.length > 0) {
          setUploadProgress(prev => prev.map((p, idx) => 
            idx === i ? { ...p, status: 'failed', error: 'Rulebook with this title already exists' } : p
          ));
          toast.error(`❌ ${file.name}: Already uploaded with this title`);
          continue;
        }

        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'uploading', error: '' } : p
        ));

        const { file_url } = await uploadFileWithRetry(file);

        // Create rulebook record
        const rulebook = await base44.entities.Rulebook.create({
          game_system: gameSystem,
          title: title,
          category: category,
          file_url: file_url,
          content_extracted: false
        });

        // Update to extracting
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'extracting', error: '' } : p
        ));

        // Extract content with retry
        const extractedData = await extractContentWithRetry(file_url);

        // Update rulebook with extracted data
        await base44.entities.Rulebook.update(rulebook.id, {
          content_extracted: true,
          character_options: extractedData?.character_options || {},
          game_mechanics: extractedData?.game_mechanics || {},
          detailed_mechanics: extractedData?.detailed_mechanics || {},
          npcs: extractedData?.npcs || [],
          locations: extractedData?.locations || [],
          campaigns: extractedData?.campaigns || []
        });

        rulebookIds.push(rulebook.id);

        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'completed', error: '' } : p
        ));

        toast.success(`✅ ${file.name}: Successfully processed`);

      } catch (error) {
        const errorMsg = error.message || 'Unknown error occurred';
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'failed', error: errorMsg } : p
        ));
        toast.error(`❌ ${file.name}: ${errorMsg}`);
      }
    }

    // Process URL-based rulebooks
    for (let i = 0; i < urlsFromInput.length; i++) {
      const url = urlsFromInput[i];
      const progressIndex = selectedFiles.length + i;
      const title = url.split('/').pop().replace('.pdf', '') || `Rulebook from ${new URL(url).hostname}`;

      try {
        const existingRulebooks = await base44.entities.Rulebook.filter({ title });
        if (existingRulebooks.length > 0) {
          setUploadProgress(prev => prev.map((p, idx) => 
            idx === progressIndex ? { ...p, status: 'failed', error: 'Rulebook with this title already exists' } : p
          ));
          toast.error(`❌ ${title}: Already uploaded with this title`);
          continue;
        }

        setUploadProgress(prev => prev.map((p, idx) => 
          idx === progressIndex ? { ...p, status: 'linking', error: '' } : p
        ));

        const rulebook = await base44.entities.Rulebook.create({
          game_system: gameSystem,
          title: title,
          category: category,
          file_url: url,
          content_extracted: false
        });

        setUploadProgress(prev => prev.map((p, idx) => 
          idx === progressIndex ? { ...p, status: 'extracting', error: '' } : p
        ));

        const extractedData = await extractContentWithRetry(url);

        await base44.entities.Rulebook.update(rulebook.id, {
          content_extracted: true,
          character_options: extractedData?.character_options || {},
          game_mechanics: extractedData?.game_mechanics || {},
          detailed_mechanics: extractedData?.detailed_mechanics || {},
          npcs: extractedData?.npcs || [],
          locations: extractedData?.locations || [],
          campaigns: extractedData?.campaigns || []
        });

        rulebookIds.push(rulebook.id);

        setUploadProgress(prev => prev.map((p, idx) => 
          idx === progressIndex ? { ...p, status: 'completed', error: '' } : p
        ));

        toast.success(`✅ ${title}: Successfully processed from URL`);

      } catch (error) {
        const errorMsg = error.message || 'Unknown error occurred';
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === progressIndex ? { ...p, status: 'failed', error: errorMsg } : p
        ));
        toast.error(`❌ ${title}: ${errorMsg}`);
      }
    }

    // Create world from uploaded rulebooks
    try {
      await base44.entities.World.create({
        name: worldName,
        description: worldDescription || `A ${gameSystem} world created from your rulebooks`,
        game_system: gameSystem,
        genre: genre,
        unique_mechanics: { rulebook_ids: rulebookIds },
        is_active: true,
        is_public: isPublic,
        rulebook_franchise: franchise,
        requires_rulebook: !isPublic
      });
      toast.success(`World "${worldName}" created with ${totalItems} rulebook(s)!`);
      } catch (error) {
      toast.error("Failed to create world");
      }

      queryClient.invalidateQueries({ queryKey: ['rulebooks'] });
      queryClient.invalidateQueries({ queryKey: ['worlds'] });
      setSelectedFiles([]);
      setExternalUrls("");
      setGameSystem("");
      setCategory("other");
      setWorldName("");
      setWorldDescription("");
      setUploading(false);
      setUploadProgress([]);
      };

  return (
    <div className="min-h-screen theme-container text-white py-12">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 theme-title flex items-center justify-center gap-3">
            <BookOpen className="w-12 h-12" />
            Rulebook Manager
          </h1>
          <p className="text-xl theme-subtitle">Upload Rulebooks to Create Your Worlds</p>
          <div className="mt-6 flex gap-3 justify-center">
            <RulebookIntegrationWizard onComplete={() => queryClient.invalidateQueries({ queryKey: ['rulebooks'] })} />
            <PlatformGuide />
          </div>
        </motion.div>

        {/* Upload Form */}
        <Card className="bg-slate-800/50 border-purple-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-purple-300">Upload New Rulebook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Game System</Label>
              <Select value={gameSystem} onValueChange={setGameSystem}>
                <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
                  <SelectValue placeholder="Select game system" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="mage_ascension">Mage: The Ascension</SelectItem>
                  <SelectItem value="tails_of_equestria">Tails of Equestria</SelectItem>
                  <SelectItem value="dc_adventures">DC Adventures</SelectItem>
                  <SelectItem value="dnd5e">D&D 5e</SelectItem>
                  <SelectItem value="pathfinder2e">Pathfinder 2e</SelectItem>
                  <SelectItem value="vampire_masquerade">Vampire: The Masquerade</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="core_rulebook">Core Rulebook</SelectItem>
                  <SelectItem value="supplement">Supplement</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="campaign_setting">Campaign Setting</SelectItem>
                  <SelectItem value="player_guide">Player Guide</SelectItem>
                  <SelectItem value="gm_guide">GM Guide</SelectItem>
                  <SelectItem value="bestiary">Bestiary</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="magic_items">Magic Items</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">World Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                  <SelectItem value="sci_fi">Sci-Fi</SelectItem>
                  <SelectItem value="horror">Horror</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                  <SelectItem value="post_apocalyptic">Post-Apocalyptic</SelectItem>
                  <SelectItem value="steampunk">Steampunk</SelectItem>
                  <SelectItem value="space_opera">Space Opera</SelectItem>
                  <SelectItem value="urban_fantasy">Urban Fantasy</SelectItem>
                  <SelectItem value="superhero">Superhero</SelectItem>
                  <SelectItem value="western">Western</SelectItem>
                  <SelectItem value="noir">Noir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Franchise Tag</Label>
              <Select value={franchise} onValueChange={setFranchise}>
                <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
                  <SelectValue placeholder="Select franchise" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="dnd">D&D</SelectItem>
                  <SelectItem value="pathfinder">Pathfinder</SelectItem>
                  <SelectItem value="mlp">My Little Pony</SelectItem>
                  <SelectItem value="dc">DC Comics</SelectItem>
                  <SelectItem value="marvel">Marvel</SelectItem>
                  <SelectItem value="starfinder">Starfinder</SelectItem>
                  <SelectItem value="wod">World of Darkness</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>World Name</Label>
              <Input
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                placeholder="e.g., Forgotten Realms, Eberron"
                className="bg-slate-700/50 border-purple-500/30 text-white"
              />
            </div>

            <div>
              <Label>World Description (Optional)</Label>
              <Input
                value={worldDescription}
                onChange={(e) => setWorldDescription(e.target.value)}
                placeholder="Brief description of your world"
                className="bg-slate-700/50 border-purple-500/30 text-white"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-700/30 rounded p-3">
              <input
                type="checkbox"
                id="public-world"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="public-world" className="cursor-pointer">
                Make world public (others can view but need their own rulebooks to play official content)
              </Label>
            </div>

            <Tabs value={uploadMethod} onValueChange={setUploadMethod} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  Upload Files
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Reference URLs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-2">
                <Label>PDF Files (Multiple Selection Supported)</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="bg-slate-700/50 border-purple-500/30 text-white"
                />
                <p className="text-xs text-purple-400">
                  Select multiple PDFs at once (up to 512MB each). Titles will be auto-generated from filenames.
                </p>
                {selectedFiles.length > 0 && (
                  <div className="text-sm text-purple-300">
                    {selectedFiles.length} file(s) selected
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-2">
                <Label>External File URLs</Label>
                <textarea
                  value={externalUrls}
                  onChange={(e) => setExternalUrls(e.target.value)}
                  placeholder="https://www.dropbox.com/s/example/rulebook.pdf&#10;https://drive.google.com/file/d/example/view&#10;https://s3.amazonaws.com/bucket/rulebook.pdf"
                  rows={5}
                  className="w-full bg-slate-700/50 border border-purple-500/30 text-white rounded-md p-2 text-sm font-mono"
                />
                <p className="text-xs text-purple-400">
                  Enter one URL per line. Supports Dropbox, Google Drive (direct links), S3, and any publicly accessible PDF URLs.
                </p>
                {externalUrls.trim() && (
                  <div className="text-sm text-purple-300">
                    {externalUrls.trim().split('\n').filter(u => u.trim()).length} URL(s) provided
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {uploadProgress.length > 0 && (
              <div className="space-y-2 bg-slate-700/30 rounded p-3">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-600">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPendingFiles.length === uploadProgress.filter(p => p.status === 'pending' || p.status === 'failed').length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPendingFiles(uploadProgress.filter(p => p.status === 'pending' || p.status === 'failed').map((_, i) => i));
                        } else {
                          setSelectedPendingFiles([]);
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-slate-400">Select All</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                     size="sm"
                     variant="ghost"
                     className="h-7 text-xs text-blue-400 hover:text-blue-300"
                     onClick={async () => {
                       const failedIndices = uploadProgress
                         .map((p, i) => ({ ...p, idx: i }))
                         .filter(p => selectedPendingFiles.includes(p.idx) && p.status === 'failed');

                       for (const item of failedIndices) {
                         setUploadProgress(prev => prev.map((p, idx) =>
                           idx === item.idx ? { ...p, status: 'pending', error: '' } : p
                         ));
                       }
                       toast.success(`Retrying ${failedIndices.length} failed upload(s)`);
                       setSelectedPendingFiles([]);
                     }}
                     disabled={selectedPendingFiles.length === 0}
                     title="Retry selected"
                    >
                     <RefreshCw className="w-3 h-3 mr-1" />
                     Retry ({selectedPendingFiles.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-red-400 hover:text-red-300"
                      onClick={() => {
                        selectedPendingFiles.reverse().forEach(idx => deletePendingFiles(idx));
                        setSelectedPendingFiles([]);
                      }}
                      disabled={selectedPendingFiles.length === 0}
                      title="Delete selected"
                    >
                      <Trash className="w-3 h-3 mr-1" />
                      Delete ({selectedPendingFiles.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-slate-400 hover:text-slate-300"
                      onClick={() => setUploadProgress([])}
                      title="Clear all"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                {uploadProgress.map((progress, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        {(progress.status === 'pending' || progress.status === 'failed') && (
                          <input
                            type="checkbox"
                            checked={selectedPendingFiles.includes(i)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPendingFiles([...selectedPendingFiles, i]);
                              } else {
                                setSelectedPendingFiles(selectedPendingFiles.filter(idx => idx !== i));
                              }
                            }}
                            className="w-4 h-4"
                          />
                        )}
                        <span className="text-white truncate">{progress.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={
                            progress.status === 'completed' ? 'bg-green-600' :
                            progress.status === 'failed' ? 'bg-red-600' :
                            progress.status === 'extracting' || progress.status === 'linking' ? 'bg-blue-600' :
                            'bg-yellow-600'
                          }
                        >
                          {(progress.status === 'uploading' || progress.status === 'extracting' || progress.status === 'linking') && (
                            <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                          )}
                          {progress.status}
                        </Badge>
                        {progress.status === 'failed' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-blue-400 hover:text-blue-300"
                            onClick={async () => {
                              const file = selectedFiles[i] || null;
                              const url = progress.url || null;
                              if (!file && !url) return;
                              
                              setUploadProgress(prev => prev.map((p, idx) => 
                                idx === i ? { ...p, status: 'pending', error: '' } : p
                              ));
                              
                              // Re-add to processing queue
                              toast.info(`Retrying ${progress.name}...`);
                            }}
                          >
                            Retry
                          </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Retry upload and extraction</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {(progress.status === 'pending' || progress.status === 'failed') && (
                          <>
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300" title="Clear from queue">
                                 <Trash2 className="w-3 h-3" />
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent className="bg-slate-900 border-red-500/30">
                               <AlertDialogTitle>Remove from queue?</AlertDialogTitle>
                               <AlertDialogDescription className="text-slate-400">
                                 This will remove {progress.name} from the upload queue.
                               </AlertDialogDescription>
                               <div className="flex gap-3">
                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => deletePendingFiles(i)}
                                   className="bg-red-600 hover:bg-red-700"
                                 >
                                   Remove
                                 </AlertDialogAction>
                               </div>
                             </AlertDialogContent>
                           </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                    {progress.error && (
                      <p className="text-xs text-red-300 ml-0">{progress.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={uploadMultipleFiles}
              disabled={uploading || (selectedFiles.length === 0 && !externalUrls.trim()) || !worldName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!uploading && <Upload className="w-4 h-4 mr-2" />}
              {uploading ? `Creating World... ${uploadProgress.filter(p => p.status === 'completed').length}/${uploadProgress.length}` : `Create World from Rulebooks`}
            </Button>
          </CardContent>
        </Card>

        {/* Upload Quota Manager */}
        <Card className="bg-slate-800/50 border-purple-500/30 mb-6">
          <CardHeader>
            <CardTitle className="text-purple-300">Upload Queue Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">
                  {uploadProgress.length === 0 ? "No uploads in progress" : `${uploadProgress.length} file(s) in queue`}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Completed: {uploadProgress.filter(p => p.status === 'completed').length} | 
                  Failed: {uploadProgress.filter(p => p.status === 'failed').length} | 
                  Pending: {uploadProgress.filter(p => p.status === 'pending').length}
                </p>
              </div>
              {uploadProgress.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUploadProgress([])}
                  className="border-purple-500/50"
                >
                  Clear Queue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rulebooks by title, system, or category..."
            className="bg-slate-700/50 border-purple-500/30 text-white"
          />
        </div>

        {/* File Manager */}
        <RulebookFileManager rulebooks={rulebooks} />

        {/* Synergy Analyzer */}
        <div className="mb-6">
          <SynergisticRulebookAnalyzer rulebooks={extractedRulebooks} />
        </div>

        {/* AI Comparison Tool */}
        <div className="mb-6">
          <AIRulebookComparison rulebooks={extractedRulebooks} />
        </div>

        {/* Game Element Generator */}
        <div className="mb-6">
          <GameElementGenerator rulebooks={extractedRulebooks} />
        </div>

         {/* Rulebook List */}
         <div className="space-y-4">
          <h2 className="text-2xl font-bold text-purple-300 mb-4">
            Uploaded Rulebooks {searchQuery && `(${filteredRulebooks.length} results)`}
          </h2>
          {filteredRulebooks.map((rulebook) => (
            <div key={rulebook.id}>
              <RulebookCard rulebook={rulebook} />
              {rulebook.content_extracted && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-purple-400 hover:text-purple-300 mt-2"
                      onClick={() => setSelectedRulebook(selectedRulebook?.id === rulebook.id ? null : rulebook)}
                    >
                      {selectedRulebook?.id === rulebook.id ? '▼ Hide' : '▶ Show'} AI Tools
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {selectedRulebook?.id === rulebook.id && (
                      <div className="mt-2 space-y-4">
                        <RulebookMechanicsDisplay rulebook={rulebook} />
                        <RulebookAssistant 
                          rulebook={rulebook} 
                          allRulebooks={extractedRulebooks}
                        />
                        <SupplementaryContentGenerator rulebook={rulebook} />
                        <LoreGenerator rulebook={rulebook} />
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}