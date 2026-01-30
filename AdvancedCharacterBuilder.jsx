import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Sparkles, Zap, Shield, BookOpen, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdvancedCharacterBuilder({ worldId, onComplete }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState("getting_started");
  const [characterData, setCharacterData] = useState({
    name: "",
    origin: "",
    occupation: "",
    traits: [],
    tags: [],
    powers: [],
    character_data: {
      height: "",
      weight: "",
      gender: "",
      eyes: "",
      hair: "",
      size: "",
      teams: "",
      base: "",
      history: "",
      personality: "",
      distinguishing_features: ""
    }
  });

  const { data: traits = [] } = useQuery({
    queryKey: ['characterTraits'],
    queryFn: () => base44.entities.CharacterTrait.list()
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['characterTags'],
    queryFn: () => base44.entities.CharacterTag.list()
  });

  const { data: powerSets = [] } = useQuery({
    queryKey: ['powerSets'],
    queryFn: () => base44.entities.PowerSet.list()
  });

  const saveCharacterMutation = useMutation({
    mutationFn: (data) => base44.entities.Character.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success("Character created!");
      if (onComplete) onComplete();
    }
  });

  const handleSave = () => {
    saveCharacterMutation.mutate({
      ...characterData,
      world_id: worldId
    });
  };

  const toggleTrait = (trait) => {
    setCharacterData(prev => ({
      ...prev,
      traits: prev.traits.includes(trait.id)
        ? prev.traits.filter(t => t !== trait.id)
        : [...prev.traits, trait.id]
    }));
  };

  const toggleTag = (tag) => {
    setCharacterData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag.id)
        ? prev.tags.filter(t => t !== tag.id)
        : [...prev.tags, tag.id]
    }));
  };

  const StepIndicator = ({ currentStep }) => {
    const steps = [
      { id: "getting_started", label: "Search", icon: User },
      { id: "biography", label: "Biography", icon: BookOpen },
      { id: "traits_tags", label: "Traits & Tags", icon: Sparkles },
      { id: "powers", label: "Powers", icon: Zap }
    ];

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = s.id === currentStep;
          const isCompleted = steps.findIndex(st => st.id === currentStep) > idx;
          
          return (
            <React.Fragment key={s.id}>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  isActive ? 'bg-purple-600 text-white' : 
                  isCompleted ? 'bg-green-600 text-white' : 
                  'bg-slate-700 text-slate-400'
                }`}
                onClick={() => setStep(s.id)}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span className="text-sm font-semibold">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 ${isCompleted ? 'bg-green-600' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-slate-800/80 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-3xl text-purple-300">
              Advanced Character Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StepIndicator currentStep={step} />

            {step === "getting_started" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Character Name</Label>
                  <Input
                    value={characterData.name}
                    onChange={(e) => setCharacterData({...characterData, name: e.target.value})}
                    placeholder="Enter character name"
                    className="bg-slate-700 text-white border-slate-600"
                  />
                </div>
                <Button
                  onClick={() => setStep("biography")}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Continue to Biography
                </Button>
              </div>
            )}

            {step === "biography" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Origin</Label>
                    <Input
                      value={characterData.origin}
                      onChange={(e) => setCharacterData({...characterData, origin: e.target.value})}
                      placeholder="e.g., Alien Heritage, High Tech"
                      className="bg-slate-700 text-white border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Occupation</Label>
                    <Input
                      value={characterData.occupation}
                      onChange={(e) => setCharacterData({...characterData, occupation: e.target.value})}
                      placeholder="e.g., Scientist, Hero"
                      className="bg-slate-700 text-white border-slate-600"
                    />
                  </div>
                </div>

                <Card className="bg-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-sm text-purple-300">Character Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      placeholder="Height"
                      value={characterData.character_data.height}
                      onChange={(e) => setCharacterData({
                        ...characterData,
                        character_data: {...characterData.character_data, height: e.target.value}
                      })}
                      className="bg-slate-600 text-white text-sm"
                    />
                    <Input
                      placeholder="Weight"
                      value={characterData.character_data.weight}
                      onChange={(e) => setCharacterData({
                        ...characterData,
                        character_data: {...characterData.character_data, weight: e.target.value}
                      })}
                      className="bg-slate-600 text-white text-sm"
                    />
                    <Input
                      placeholder="Eyes"
                      value={characterData.character_data.eyes}
                      onChange={(e) => setCharacterData({
                        ...characterData,
                        character_data: {...characterData.character_data, eyes: e.target.value}
                      })}
                      className="bg-slate-600 text-white text-sm"
                    />
                    <Input
                      placeholder="Hair"
                      value={characterData.character_data.hair}
                      onChange={(e) => setCharacterData({
                        ...characterData,
                        character_data: {...characterData.character_data, hair: e.target.value}
                      })}
                      className="bg-slate-600 text-white text-sm"
                    />
                    <Textarea
                      placeholder="History"
                      value={characterData.character_data.history}
                      onChange={(e) => setCharacterData({
                        ...characterData,
                        character_data: {...characterData.character_data, history: e.target.value}
                      })}
                      className="bg-slate-600 text-white text-sm"
                      rows={3}
                    />
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setStep("traits_tags")}
                  className="col-span-2 bg-purple-600 hover:bg-purple-700"
                >
                  Continue to Traits & Tags
                </Button>
              </div>
            )}

            {step === "traits_tags" && (
              <Tabs defaultValue="traits" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                  <TabsTrigger value="traits">Traits</TabsTrigger>
                  <TabsTrigger value="tags">Tags</TabsTrigger>
                </TabsList>

                <TabsContent value="traits" className="space-y-3 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {traits.map(trait => (
                      <Card
                        key={trait.id}
                        className={`cursor-pointer transition-all ${
                          characterData.traits.includes(trait.id)
                            ? 'bg-cyan-900/50 border-cyan-500'
                            : 'bg-slate-700/50 border-slate-600'
                        }`}
                        onClick={() => toggleTrait(trait)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white">{trait.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-slate-300">{trait.description}</p>
                          {trait.mechanical_effect && (
                            <Badge className="mt-2 text-xs">{trait.mechanical_effect}</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Button
                    onClick={() => setStep("powers")}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Continue to Powers
                  </Button>
                </TabsContent>

                <TabsContent value="tags" className="space-y-3 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tags.map(tag => (
                      <Card
                        key={tag.id}
                        className={`cursor-pointer transition-all ${
                          characterData.tags.includes(tag.id)
                            ? 'bg-yellow-900/50 border-yellow-500'
                            : 'bg-slate-700/50 border-slate-600'
                        }`}
                        onClick={() => toggleTag(tag)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white">{tag.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-slate-300">{tag.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {step === "powers" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {powerSets.map(powerSet => (
                    <Card key={powerSet.id} className="bg-purple-900/30 border-purple-500/30">
                      <CardHeader>
                        <CardTitle className="text-sm text-purple-300">{powerSet.name}</CardTitle>
                        <Badge>{powerSet.category}</Badge>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-xs text-slate-300 space-y-1">
                          {powerSet.powers?.slice(0, 3).map((p, i) => (
                            <li key={i}>• {p.name}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep("traits_tags")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveCharacterMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Save Character
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}