import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, BookOpen, Upload, Trash2, RefreshCw, GitCompare, Sparkles, Globe, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PlatformGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-purple-500/50">
          <HelpCircle className="w-4 h-4 mr-2" />
          Platform Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-slate-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl text-purple-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6" />
              Multiverse Quest Platform Guide
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="rulebooks" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="rulebooks">Rulebooks</TabsTrigger>
            <TabsTrigger value="worlds">Worlds</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          </TabsList>

          {/* Rulebooks Guide */}
          <TabsContent value="rulebooks" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Uploading Rulebooks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div>
                  <p className="font-semibold mb-1">1. Select Game System & Category</p>
                  <p className="text-slate-400">Choose the game system (D&D 5e, Pathfinder, etc.) and category (core rulebook, supplement, adventure, etc.)</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">2. Provide World Details</p>
                  <p className="text-slate-400">Enter a world name and optional description. Select genre and franchise.</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">3. Upload Files or URLs</p>
                  <p className="text-slate-400">Use "Upload Files" tab for PDFs (multiple supported) or "Reference URLs" for external links (one per line)</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">4. AI Extraction</p>
                  <p className="text-slate-400">AI automatically extracts: races, classes, mechanics, NPCs, locations, and lore</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Managing Upload Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Badge className="bg-yellow-600 shrink-0">Pending</Badge>
                  <p className="text-slate-400">File queued but not uploaded yet</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-red-600 shrink-0">Failed</Badge>
                  <p className="text-slate-400">Upload or extraction failed - click retry</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-green-600 shrink-0">Completed</Badge>
                  <p className="text-slate-400">Successfully uploaded and extracted</p>
                </div>
                <div className="border-t border-slate-600 pt-3 mt-3">
                  <p className="font-semibold mb-2">Bulk Actions:</p>
                  <ul className="space-y-1 text-slate-400">
                    <li>• <strong>Select All</strong> - Check all pending/failed files</li>
                    <li>• <strong>Retry</strong> - Re-attempt upload/extraction for selected</li>
                    <li>• <strong>Delete</strong> - Remove selected from queue</li>
                    <li>• <strong>Clear All</strong> - Remove entire upload history</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Deleting Rulebooks
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                <p>To delete a rulebook:</p>
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>Find the rulebook card in "Uploaded Rulebooks" section</li>
                  <li>Click the gear icon (⚙) on the card</li>
                  <li>Select "Delete Rulebook"</li>
                  <li>Confirm deletion</li>
                </ol>
                <p className="mt-2 text-yellow-400">⚠ Deleting a rulebook doesn't delete the world it created</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Integration Wizard
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                <p className="mb-2">The Rulebook Integration Wizard provides a step-by-step process:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li><strong>Import</strong> - Upload file or provide URL</li>
                  <li><strong>Review & Edit</strong> - AI tags sections and extracts content</li>
                  <li><strong>Complete</strong> - Rulebook saved and indexed</li>
                </ol>
                <p className="mt-2">Use this for more control over the extraction process</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Worlds Guide */}
          <TabsContent value="worlds" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Creating Worlds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <p className="text-slate-400">Worlds are created automatically when you upload rulebooks:</p>
                <ol className="list-decimal ml-4 space-y-1 text-slate-400">
                  <li>Fill out world details (name, description, genre)</li>
                  <li>Upload one or more rulebooks</li>
                  <li>World is created with all rulebooks linked</li>
                </ol>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2 mt-3">
                  <p className="text-blue-300 font-semibold mb-1">Adding Rulebooks to Existing Worlds</p>
                  <p className="text-slate-400">Go to World Hub → Click Settings (⚙) on a world → "Add Rulebooks" section</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Managing Worlds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div>
                  <p className="font-semibold mb-1">Editing World Settings:</p>
                  <ul className="list-disc ml-4 text-slate-400 space-y-1">
                    <li>Click Settings icon (⚙) on any world card</li>
                    <li>Modify name, description, genre, campaign mode</li>
                    <li>Add/remove rulebooks</li>
                    <li>Enable sandbox mode</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Deleting Worlds:</p>
                  <ul className="list-disc ml-4 text-slate-400 space-y-1">
                    <li>Go to World Settings (⚙)</li>
                    <li>Scroll to bottom</li>
                    <li>Click "Delete World" button</li>
                    <li>Confirm deletion</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Organizing Worlds:</p>
                  <ul className="list-disc ml-4 text-slate-400 space-y-1">
                    <li>Use search bar to filter by name/genre</li>
                    <li>Click star icon (★) to mark favorites</li>
                    <li>Favorites appear first in the grid</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  World Features
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400 space-y-2">
                <div>
                  <p className="font-semibold text-white mb-1">Explore Lore:</p>
                  <p>Access AI Lore Assistant, Deep Lore Generator, and World Events</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">GM Tools:</p>
                  <p>Crown icon (👑) - Advanced GM world management tools</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">World Settings:</p>
                  <p>Gear icon (⚙) - Configure world details and rulebooks</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Guide */}
          <TabsContent value="campaigns" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300">Campaign Management</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400 space-y-2">
                <p>Navigate to Campaign Manager from the top menu</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Click "New Campaign" button</li>
                  <li>Select a world</li>
                  <li>Provide title and story summary</li>
                  <li>Campaign is created and ready to play</li>
                </ol>
                <p className="mt-2">Track NPCs, quests, sessions, and player characters all in one place</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300">NPC Roleplay</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                <p className="mb-2">In the NPCs tab of a campaign:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Select an NPC from the dropdown</li>
                  <li>AI maintains their personality, knowledge, and secrets</li>
                  <li>Query NPCs for lore or campaign information</li>
                  <li>Chat history is saved for continuity</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tools Guide */}
          <TabsContent value="ai-tools" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  Analyze Synergies
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                <p className="mb-2">Found in Rulebook Manager page:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Click "Analyze Synergies" button in Synergy Analyzer card</li>
                  <li>Select 2+ rulebooks to analyze</li>
                  <li>AI identifies hybrid gameplay and new elements</li>
                  <li>Click "Start Synergies" to generate content</li>
                </ol>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  Rulebook Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                <p className="mb-2">AI-powered deep comparison tool:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Select two rulebooks to compare</li>
                  <li>Click "Compare Rulebooks"</li>
                  <li>AI analyzes similarities, differences, and compatibility</li>
                  <li>Get hybrid rule suggestions</li>
                </ol>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-purple-300">Other AI Tools</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400 space-y-2">
                <p><strong>Game Element Generator:</strong> Generate magic items, spells, archetypes</p>
                <p><strong>Lore Assistant:</strong> Query rulebook content with natural language</p>
                <p><strong>Campaign Generator:</strong> Create full campaign outlines</p>
                <p><strong>NPC Companion:</strong> Dynamic NPC interactions with memory</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 bg-purple-900/20 border border-purple-500/30 rounded p-4 text-center">
          <p className="text-sm text-purple-300">
            Need more help? Check the tooltips (hover over icons) or visit our documentation
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}