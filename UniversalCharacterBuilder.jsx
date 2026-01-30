import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, User, Wand2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AICharacterBuildingAssistant from "../components/ai/AICharacterBuildingAssistant";

export default function UniversalCharacterBuilder() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState("");
  const [characterData, setCharacterData] = useState({
    name: "",
    race: "",
    class_role: "",
    level: 1,
    backstory: "",
    attributes: {},
    skills: {},
    resources: {}
  });

  const { data: worlds } = useQuery({
    queryKey: ['worlds'],
    queryFn: () => base44.entities.World.list('-created_date'),
    initialData: []
  });

  const { data: rulebooks } = useQuery({
    queryKey: ['rulebooks', selectedSystem],
    queryFn: () => selectedSystem ? base44.entities.Rulebook.filter({ game_system: selectedSystem, content_extracted: true }) : [],
    enabled: !!selectedSystem,
    initialData: []
  });

  const createCharacterMutation = useMutation({
    mutationFn: (data) => base44.entities.Character.create(data),
    onSuccess: (character) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success("Character created successfully!");
      window.location.href = `/CharacterSelect?worldId=${character.world_id}`;
    }
  });

  const handleWorldSelect = (worldId) => {
    const world = worlds.find(w => w.id === worldId);
    setSelectedWorld(world);
    setSelectedSystem(world?.game_system || "");
    setCharacterData(prev => ({ ...prev, world_id: worldId }));
    setStep(2);
  };

  const handleAttributeChange = (attr, value) => {
    setCharacterData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: parseInt(value) || 0 }
    }));
  };

  const handleResourceChange = (resource, field, value) => {
    setCharacterData(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [field]: parseInt(value) || 0
      }
    }));
  };

  const handleSave = async () => {
    if (!characterData.name || !characterData.world_id) {
      toast.error("Please provide character name and select a world");
      return;
    }

    createCharacterMutation.mutate(characterData);
  };

  const getSystemAttributes = () => {
    const systemMap = {
      dnd5e: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
      pathfinder2e: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
      starfinder: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
      call_of_cthulhu: ['STR', 'DEX', 'POW', 'CON', 'APP', 'EDU', 'INT', 'SIZ'],
      cyberpunk_red: ['INT', 'REF', 'DEX', 'TECH', 'COOL', 'WILL', 'LUCK', 'MOVE', 'BODY', 'EMP']
    };
    return systemMap[selectedSystem] || ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  };

  const getSystemResources = () => {
    const systemMap = {
      dnd5e: [{ key: 'hp', label: 'Hit Points' }],
      pathfinder2e: [{ key: 'hp', label: 'Hit Points' }],
      starfinder: [{ key: 'hp', label: 'Hit Points' }, { key: 'sp', label: 'Stamina Points' }],
      call_of_cthulhu: [{ key: 'hp', label: 'Hit Points' }, { key: 'mp', label: 'Magic Points' }, { key: 'san', label: 'Sanity' }]
    };
    return systemMap[selectedSystem] || [{ key: 'hp', label: 'Hit Points' }];
  };

  const getAvailableOptions = (type) => {
    if (!rulebooks.length) return [];
    const options = new Set();
    rulebooks.forEach(book => {
      if (type === 'race' && book.character_options?.races) {
        book.character_options.races.forEach(r => options.add(r));
      }
      if (type === 'class' && book.character_options?.classes) {
        book.character_options.classes.forEach(c => options.add(c));
      }
    });
    return Array.from(options);
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-purple-300 flex items-center gap-3">
              <User className="w-10 h-10" />
              Universal Character Builder
            </h1>
            <p className="text-slate-400 mt-2">Multi-system character creation with AI assistance</p>
          </div>
          <Link to="/WorldHub">
            <Button variant="outline" className="border-purple-500/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select World */}
            {step === 1 && (
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-300">Step 1: Select World & System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {worlds.map(world => (
                      <Card
                        key={world.id}
                        onClick={() => handleWorldSelect(world.id)}
                        className="cursor-pointer hover:border-purple-500 transition-colors bg-slate-700/30 border-slate-600"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white">{world.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <Badge className="text-xs">{world.game_system}</Badge>
                            <Badge variant="outline" className="text-xs ml-1">{world.genre}</Badge>
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{world.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {worlds.length === 0 && (
                    <p className="text-center text-slate-400 py-8">
                      No worlds available. Create a world first to build characters.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-300">Step 2: Character Basics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Character Name</Label>
                    <Input
                      value={characterData.name}
                      onChange={(e) => setCharacterData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter character name"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label>Race/Species</Label>
                    {getAvailableOptions('race').length > 0 ? (
                      <Select value={characterData.race} onValueChange={(val) => setCharacterData(prev => ({ ...prev, race: val }))}>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue placeholder="Select race" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableOptions('race').map(race => (
                            <SelectItem key={race} value={race}>{race}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={characterData.race}
                        onChange={(e) => setCharacterData(prev => ({ ...prev, race: e.target.value }))}
                        placeholder="Enter race/species"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    )}
                  </div>

                  <div>
                    <Label>Class/Role</Label>
                    {getAvailableOptions('class').length > 0 ? (
                      <Select value={characterData.class_role} onValueChange={(val) => setCharacterData(prev => ({ ...prev, class_role: val }))}>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableOptions('class').map(cls => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={characterData.class_role}
                        onChange={(e) => setCharacterData(prev => ({ ...prev, class_role: e.target.value }))}
                        placeholder="Enter class/role"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    )}
                  </div>

                  <div>
                    <Label>Level</Label>
                    <Input
                      type="number"
                      value={characterData.level}
                      onChange={(e) => setCharacterData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                      min={1}
                      max={20}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="flex-1 bg-purple-600 hover:bg-purple-700">
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Attributes & Resources */}
            {step === 3 && (
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-300">Step 3: Attributes & Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-3 block">Attributes ({selectedSystem})</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getSystemAttributes().map(attr => (
                        <div key={attr}>
                          <Label className="text-xs text-slate-400">{attr}</Label>
                          <Input
                            type="number"
                            value={characterData.attributes[attr] || ""}
                            onChange={(e) => handleAttributeChange(attr, e.target.value)}
                            placeholder="0"
                            className="bg-slate-700/50 border-slate-600 text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Resources</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {getSystemResources().map(resource => (
                        <div key={resource.key}>
                          <Label className="text-xs text-slate-400">{resource.label} (Max)</Label>
                          <Input
                            type="number"
                            value={characterData.resources[`${resource.key}_max`] || ""}
                            onChange={(e) => handleResourceChange(resource.key, `${resource.key}_max`, e.target.value)}
                            placeholder="0"
                            className="bg-slate-700/50 border-slate-600 text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={() => setStep(4)} className="flex-1 bg-purple-600 hover:bg-purple-700">
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Backstory & Finalize */}
            {step === 4 && (
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-300">Step 4: Backstory & Finalize</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Character Backstory</Label>
                    <Textarea
                      value={characterData.backstory}
                      onChange={(e) => setCharacterData(prev => ({ ...prev, backstory: e.target.value }))}
                      placeholder="Describe your character's history, motivations, and personality..."
                      rows={6}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>

                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Character Summary</h4>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p><span className="text-slate-400">Name:</span> {characterData.name}</p>
                      <p><span className="text-slate-400">Race:</span> {characterData.race}</p>
                      <p><span className="text-slate-400">Class:</span> {characterData.class_role}</p>
                      <p><span className="text-slate-400">Level:</span> {characterData.level}</p>
                      <p><span className="text-slate-400">System:</span> {selectedSystem}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={createCharacterMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {createCharacterMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Create Character
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Assistant Sidebar */}
          <div className="lg:col-span-1">
            {selectedWorld && step > 1 && (
              <AICharacterBuildingAssistant
                world={selectedWorld}
                rulebooks={rulebooks}
                characterData={characterData}
                onSuggestion={(suggestion) => {
                  if (suggestion.backstory) {
                    setCharacterData(prev => ({ ...prev, backstory: suggestion.backstory }));
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}