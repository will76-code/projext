import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function RulebookMechanicsDisplay({ rulebook }) {
  const [expandedSections, setExpandedSections] = useState({});

  if (!rulebook?.content_extracted) {
    return (
      <Card className="bg-slate-700/30 border-slate-600">
        <CardContent className="pt-6 text-slate-400 text-sm">
          Content not extracted yet
        </CardContent>
      </Card>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="mechanics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-700/30">
          <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="npcs">NPCs</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="mechanics" className="space-y-3">
          {rulebook.game_mechanics && (
            <Card className="bg-slate-700/30 border-slate-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Core Mechanics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                {rulebook.game_mechanics.core_rules && (
                  <div>
                    <p className="font-semibold text-slate-400">Core Rules:</p>
                    <p>{rulebook.game_mechanics.core_rules}</p>
                  </div>
                )}
                {rulebook.game_mechanics.dice_system && (
                  <div>
                    <p className="font-semibold text-slate-400">Dice System:</p>
                    <p>{rulebook.game_mechanics.dice_system}</p>
                  </div>
                )}
                {rulebook.game_mechanics.progression && (
                  <div>
                    <p className="font-semibold text-slate-400">Progression:</p>
                    <p>{rulebook.game_mechanics.progression}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {rulebook.detailed_mechanics && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Detailed Mechanics</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {rulebook.detailed_mechanics.combat_rules && (
                  <Card className="bg-slate-700/30 border-slate-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs">Combat</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1 text-slate-300">
                      {Object.entries(rulebook.detailed_mechanics.combat_rules).map(([key, val]) => (
                        <div key={key}>
                          <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {val}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {rulebook.detailed_mechanics.skill_check_system && (
                  <Card className="bg-slate-700/30 border-slate-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs">Skills</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1 text-slate-300">
                      {Object.entries(rulebook.detailed_mechanics.skill_check_system).map(([key, val]) => (
                        <div key={key}>
                          <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {val}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {rulebook.detailed_mechanics.magic_system && (
                  <Card className="bg-slate-700/30 border-slate-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs">Magic</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1 text-slate-300">
                      {Object.entries(rulebook.detailed_mechanics.magic_system).map(([key, val]) => (
                        <div key={key}>
                          <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {val}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </TabsContent>

        <TabsContent value="options" className="space-y-2">
          {rulebook.character_options && (
            <>
              {rulebook.character_options.races?.length > 0 && (
                <Card className="bg-slate-700/30 border-slate-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Races</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1">
                    {rulebook.character_options.races.map((race, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{race}</Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
              {rulebook.character_options.classes?.length > 0 && (
                <Card className="bg-slate-700/30 border-slate-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Classes</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1">
                    {rulebook.character_options.classes.map((cls, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{cls}</Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
              {rulebook.character_options.abilities?.length > 0 && (
                <Card className="bg-slate-700/30 border-slate-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Key Abilities</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1">
                    {rulebook.character_options.abilities.map((ability, i) => (
                      <Badge key={i} className="bg-purple-900/50 text-purple-300 text-xs">{ability}</Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="npcs" className="space-y-2">
          {rulebook.npcs?.length > 0 ? (
            rulebook.npcs.map((npc, idx) => (
              <Card key={idx} className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs">{npc.name}</CardTitle>
                  <Badge variant="outline" className="w-fit mt-1 text-xs">{npc.role}</Badge>
                </CardHeader>
                <CardContent className="text-xs text-slate-300 space-y-1">
                  <p>{npc.description}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-slate-400">No NPCs extracted</p>
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-2">
          {rulebook.locations?.length > 0 ? (
            rulebook.locations.map((loc, idx) => (
              <Card key={idx} className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs">{loc.name}</CardTitle>
                  <Badge variant="outline" className="w-fit mt-1 text-xs">{loc.type}</Badge>
                </CardHeader>
                <CardContent className="text-xs text-slate-300">
                  <p>{loc.description}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-slate-400">No locations extracted</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}