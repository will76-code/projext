import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Swords, Backpack, ScrollText, Target, ZapOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PlayerCharacterHub() {
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    initialData: null
  });

  const { data: characters } = useQuery({
    queryKey: ['myCharacters', currentUser?.email],
    queryFn: async () => {
      try {
        return await base44.entities.Character.filter({
          created_by: currentUser?.email
        });
      } catch {
        return [];
      }
    },
    enabled: !!currentUser?.email
  });

  const { data: progressions } = useQuery({
    queryKey: ['characterProgressions', selectedCharacter?.id],
    queryFn: async () => {
      try {
        return await base44.entities.CharacterProgression?.filter?.({
          character_id: selectedCharacter?.id
        }) || [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedCharacter?.id
  });

  const { data: personalQuests } = useQuery({
    queryKey: ['personalQuests', selectedCharacter?.id],
    queryFn: async () => {
      try {
        return await base44.entities.ActionVote?.filter?.({
          character_id: selectedCharacter?.id
        }) || [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedCharacter?.id
  });

  if (!selectedCharacter && characters?.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            className="mb-6 border-purple-500/50"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12">
            <p className="text-slate-400">No characters yet. <Link to={createPageUrl("CharacterBuilder")} className="text-purple-400 hover:text-purple-300">Create one</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="outline"
          className="border-purple-500/50"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {!selectedCharacter ? (
          <>
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                Character Hub
              </h1>
              <p className="text-slate-400">Manage your adventurers and track their legendary deeds</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters?.map((char) => (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className="bg-slate-700/30 border border-purple-500/30 rounded-lg p-4 cursor-pointer hover:border-purple-500/60 hover:bg-slate-700/50 transition-all space-y-3"
                >
                  {char.avatar_url && (
                    <img
                      src={char.avatar_url}
                      alt={char.name}
                      className="w-full aspect-square rounded object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold text-slate-200 text-lg">{char.name}</h4>
                    <p className="text-sm text-slate-400">
                      Level {char.level} {char.class_role} {char.race}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-purple-900 text-xs">{char.class_role}</Badge>
                    <Badge className="bg-blue-900 text-xs">{char.race}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Character Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-100">{selectedCharacter.name}</h1>
                <p className="text-slate-400 mt-1">
                  Level {selectedCharacter.level} {selectedCharacter.class_role} {selectedCharacter.race}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedCharacter(null)}
                className="border-slate-500/50"
              >
                ← Back to Characters
              </Button>
            </div>

            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-purple-500/30">
                <TabsTrigger value="stats"><Swords className="w-4 h-4 mr-2" />Stats</TabsTrigger>
                <TabsTrigger value="inventory"><Backpack className="w-4 h-4 mr-2" />Inventory</TabsTrigger>
                <TabsTrigger value="progression"><Target className="w-4 h-4 mr-2" />Progression</TabsTrigger>
                <TabsTrigger value="quests"><ScrollText className="w-4 h-4 mr-2" />Quests</TabsTrigger>
              </TabsList>

              {/* Stats Tab */}
              <TabsContent value="stats">
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-300">Character Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Core Attributes */}
                    {selectedCharacter.attributes && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(selectedCharacter.attributes).map(([key, value]) => (
                          <div key={key} className="bg-slate-700/30 rounded p-3">
                            <p className="text-xs text-slate-400 uppercase">{key}</p>
                            <p className="text-2xl font-bold text-purple-300">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resources */}
                    {selectedCharacter.resources && (
                      <div className="border-t border-slate-600 pt-4 space-y-3">
                        <h6 className="font-semibold text-slate-300">Resources</h6>
                        {[
                          { key: 'hp', label: 'Health Points', color: 'bg-red-600' },
                          { key: 'mana', label: 'Mana', color: 'bg-blue-600' },
                          { key: 'stamina', label: 'Stamina', color: 'bg-yellow-600' }
                        ].map(({ key, label, color }) => {
                          const current = selectedCharacter.resources[`${key}_current`];
                          const max = selectedCharacter.resources[`${key}_max`];
                          if (!max) return null;
                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">{label}</span>
                                <span className="text-slate-300">{current}/{max}</span>
                              </div>
                              <Progress value={(current / max) * 100} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Special Traits */}
                    {selectedCharacter.special_things?.length > 0 && (
                      <div className="border-t border-slate-600 pt-4">
                        <h6 className="font-semibold text-slate-300 mb-2">Special Traits</h6>
                        <div className="space-y-2">
                          {selectedCharacter.special_things.map((trait, i) => (
                            <div key={i} className="bg-slate-700/30 rounded p-2">
                              <p className="font-semibold text-slate-300 text-sm">{trait.name}</p>
                              <p className="text-xs text-green-400">✓ {trait.boon}</p>
                              <p className="text-xs text-red-400">✗ {trait.flaw}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory">
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-300 flex items-center gap-2">
                      <Backpack className="w-5 h-5" />
                      Inventory
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedCharacter.inventory?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCharacter.inventory.map((item, i) => (
                          <div key={i} className="bg-slate-700/30 border border-slate-600 rounded p-2 text-sm text-slate-300">
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">No items yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Progression Tab */}
              <TabsContent value="progression">
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-300 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Character Progression
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progressions?.length > 0 ? (
                      <div className="space-y-3">
                        {progressions.map((prog, i) => (
                          <div key={i} className="bg-slate-700/30 border border-slate-600 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-300">{prog.name}</span>
                              <Badge className="bg-purple-900 text-xs">{prog.type}</Badge>
                            </div>
                            <p className="text-sm text-slate-400">{prog.description}</p>
                            {prog.achieved_at && (
                              <p className="text-xs text-slate-500 mt-1">✓ Achieved</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">No progression tracked yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personal Quests Tab */}
              <TabsContent value="quests">
                <Card className="bg-slate-800/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-300 flex items-center gap-2">
                      <ScrollText className="w-5 h-5" />
                      Personal Quests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {personalQuests?.length > 0 ? (
                      <div className="space-y-3">
                        {personalQuests.map((quest, i) => (
                          <div key={i} className="bg-slate-700/30 border border-slate-600 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-300">{quest.action_description}</span>
                              <Badge className={quest.status === 'completed' ? 'bg-green-900' : 'bg-yellow-900'}>
                                {quest.status}
                              </Badge>
                            </div>
                            {quest.ai_suggestion && (
                              <p className="text-sm text-slate-400 mt-1">💡 {quest.ai_suggestion}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">No quests logged yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}