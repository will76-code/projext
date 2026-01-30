import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp, Sword, Users, MapPin, Flag } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function RulebookCard({ rulebook }) {
  const queryClient = useQueryClient();
  const [mechanicsOpen, setMechanicsOpen] = useState(false);
  const [npcsOpen, setNpcsOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    section: '',
    issueType: '',
    text: '',
    itemIndex: null,
    originalData: null
  });

  const submitFeedback = useMutation({
    mutationFn: async () => {
      return await base44.entities.RulebookFeedback.create({
        rulebook_id: rulebook.id,
        section: feedbackData.section,
        item_index: feedbackData.itemIndex,
        issue_type: feedbackData.issueType,
        feedback_text: feedbackData.text,
        original_data: feedbackData.originalData
      });
    },
    onSuccess: () => {
      toast.success("Feedback submitted! Thank you for helping improve our AI.");
      setFeedbackOpen(false);
      setFeedbackData({ section: '', issueType: '', text: '', itemIndex: null, originalData: null });
    }
  });

  const openFeedbackDialog = (section, itemIndex = null, originalData = null) => {
    setFeedbackData({ 
      section, 
      itemIndex, 
      originalData, 
      issueType: '', 
      text: '' 
    });
    setFeedbackOpen(true);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white">{rulebook.title}</h3>
              {rulebook.category && (
                <Badge className="bg-purple-600/50 text-purple-200">
                  {rulebook.category.replace(/_/g, ' ')}
                </Badge>
              )}
              {rulebook.content_extracted ? (
                <Badge className="bg-green-600">✓ Extracted</Badge>
              ) : (
                <Badge className="bg-amber-600">⚠ Pending</Badge>
              )}
            </div>
            <p className="text-sm text-purple-400">System: {rulebook.game_system}</p>
          </div>
          {rulebook.content_extracted ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          )}
        </div>

        {rulebook.content_extracted && (
          <div className="mt-4 space-y-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-700/30 rounded p-2">
                <p className="text-purple-300 font-semibold">Races</p>
                <p className="text-white">{rulebook.character_options?.races?.length || 0}</p>
              </div>
              <div className="bg-slate-700/30 rounded p-2">
                <p className="text-purple-300 font-semibold">Classes</p>
                <p className="text-white">{rulebook.character_options?.classes?.length || 0}</p>
              </div>
              <div className="bg-slate-700/30 rounded p-2">
                <p className="text-purple-300 font-semibold">Campaigns</p>
                <p className="text-white">{rulebook.campaigns?.length || 0}</p>
              </div>
            </div>

            {/* Detailed Mechanics Section */}
            {rulebook.detailed_mechanics && (
              <Collapsible open={mechanicsOpen} onOpenChange={setMechanicsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-slate-700/30 border-purple-500/20 hover:bg-slate-700/50 text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Sword className="w-4 h-4 text-purple-400" />
                      Detailed Mechanics
                    </span>
                    {mechanicsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 bg-slate-700/20 rounded p-4 space-y-4">
                  {rulebook.detailed_mechanics.combat_rules && (
                    <div>
                      <h4 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                        <Sword className="w-4 h-4" />
                        Combat Rules
                      </h4>
                      <div className="text-sm text-white space-y-1 pl-6">
                        <p><span className="text-purple-400">Initiative:</span> {rulebook.detailed_mechanics.combat_rules.initiative}</p>
                        <p><span className="text-purple-400">Attack Resolution:</span> {rulebook.detailed_mechanics.combat_rules.attack_resolution}</p>
                        <p><span className="text-purple-400">Damage:</span> {rulebook.detailed_mechanics.combat_rules.damage_system}</p>
                        {rulebook.detailed_mechanics.combat_rules.special_actions?.length > 0 && (
                          <div>
                            <span className="text-purple-400">Special Actions:</span>
                            <ul className="list-disc list-inside ml-4">
                              {rulebook.detailed_mechanics.combat_rules.special_actions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {rulebook.detailed_mechanics.skill_check_system && (
                    <div>
                      <h4 className="text-purple-300 font-semibold mb-2">Skill Check System</h4>
                      <div className="text-sm text-white space-y-1 pl-6">
                        <p><span className="text-purple-400">Basic Mechanic:</span> {rulebook.detailed_mechanics.skill_check_system.basic_mechanic}</p>
                        <p><span className="text-purple-400">Difficulty:</span> {rulebook.detailed_mechanics.skill_check_system.difficulty_levels}</p>
                        <p><span className="text-purple-400">Modifiers:</span> {rulebook.detailed_mechanics.skill_check_system.modifiers}</p>
                      </div>
                    </div>
                  )}

                  {rulebook.detailed_mechanics.magic_system && (
                    <div>
                      <h4 className="text-purple-300 font-semibold mb-2">Magic System</h4>
                      <div className="text-sm text-white space-y-1 pl-6">
                        <p><span className="text-purple-400">Casting:</span> {rulebook.detailed_mechanics.magic_system.casting_mechanic}</p>
                        <p><span className="text-purple-400">Components:</span> {rulebook.detailed_mechanics.magic_system.spell_components}</p>
                        <p><span className="text-purple-400">Limitations:</span> {rulebook.detailed_mechanics.magic_system.limitations}</p>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* NPCs Section */}
            {rulebook.npcs && rulebook.npcs.length > 0 && (
              <Collapsible open={npcsOpen} onOpenChange={setNpcsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-slate-700/30 border-purple-500/20 hover:bg-slate-700/50 text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      NPCs ({rulebook.npcs.length})
                    </span>
                    {npcsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 bg-slate-700/20 rounded p-4 space-y-3">
                  {rulebook.npcs.map((npc, i) => (
                    <div key={i} className="border-l-2 border-purple-500/30 pl-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{npc.name}</h4>
                          <Badge variant="outline" className="text-purple-300 text-xs mt-1">
                            {npc.role}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openFeedbackDialog('npc', i, npc)}
                          className="text-yellow-500 hover:text-yellow-400"
                        >
                          <Flag className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-purple-200 mt-2">{npc.description}</p>
                      {npc.stats && (
                        <div className="mt-2 text-xs text-purple-300 bg-slate-700/30 rounded p-2">
                          <span className="font-semibold">Stats:</span> {JSON.stringify(npc.stats, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Locations Section */}
            {rulebook.locations && rulebook.locations.length > 0 && (
              <Collapsible open={locationsOpen} onOpenChange={setLocationsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-slate-700/30 border-purple-500/20 hover:bg-slate-700/50 text-white"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      Locations ({rulebook.locations.length})
                    </span>
                    {locationsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 bg-slate-700/20 rounded p-4 space-y-3">
                  {rulebook.locations.map((location, i) => (
                    <div key={i} className="border-l-2 border-purple-500/30 pl-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{location.name}</h4>
                          <Badge variant="outline" className="text-purple-300 text-xs mt-1">
                            {location.type}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openFeedbackDialog('location', i, location)}
                          className="text-yellow-500 hover:text-yellow-400"
                        >
                          <Flag className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-purple-200 mt-2">{location.description}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="bg-slate-800 text-white border-purple-500/30">
          <DialogHeader>
            <DialogTitle>Report Extraction Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Issue Type</Label>
              <Select 
                value={feedbackData.issueType} 
                onValueChange={(val) => setFeedbackData({...feedbackData, issueType: val})}
              >
                <SelectTrigger className="bg-slate-700/50 border-purple-500/30">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inaccurate">Inaccurate Data</SelectItem>
                  <SelectItem value="incomplete">Incomplete Information</SelectItem>
                  <SelectItem value="missing">Missing Content</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Your Feedback / Correction</Label>
              <Textarea
                value={feedbackData.text}
                onChange={(e) => setFeedbackData({...feedbackData, text: e.target.value})}
                placeholder="Describe the issue or provide the correct information..."
                className="bg-slate-700/50 border-purple-500/30 text-white min-h-[100px]"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => submitFeedback.mutate()}
                disabled={!feedbackData.issueType || !feedbackData.text}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}