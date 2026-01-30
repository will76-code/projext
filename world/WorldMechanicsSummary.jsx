import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WorldMechanicsSummary({ world, rulebooks = [] }) {
  const associatedRulebooks = useMemo(() => {
    if (!world?.unique_mechanics?.rulebook_ids) return [];
    return rulebooks.filter(r => 
      world.unique_mechanics.rulebook_ids.includes(r.id) && r.content_extracted
    );
  }, [world, rulebooks]);

  if (!associatedRulebooks.length) {
    return null;
  }

  const mergedMechanics = {
    coreConcepts: [],
    combatSystem: {},
    progressionSystem: {},
    magicSystem: {},
    specialRules: []
  };

  associatedRulebooks.forEach(rb => {
    if (rb.game_mechanics?.core_rules) {
      mergedMechanics.coreConcepts.push({
        system: rb.title,
        rule: rb.game_mechanics.core_rules
      });
    }
    if (rb.detailed_mechanics?.combat_rules) {
      mergedMechanics.combatSystem = { ...mergedMechanics.combatSystem, ...rb.detailed_mechanics.combat_rules };
    }
    if (rb.game_mechanics?.progression) {
      mergedMechanics.progressionSystem = { ...mergedMechanics.progressionSystem, [rb.title]: rb.game_mechanics.progression };
    }
    if (rb.detailed_mechanics?.magic_system) {
      mergedMechanics.magicSystem = { ...mergedMechanics.magicSystem, ...rb.detailed_mechanics.magic_system };
    }
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-purple-300">Core Game Mechanics</CardTitle>
        <p className="text-xs text-slate-400 mt-2">From {associatedRulebooks.length} rulebook(s)</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="combat" className="text-xs">Combat</TabsTrigger>
            <TabsTrigger value="magic" className="text-xs">Magic</TabsTrigger>
            <TabsTrigger value="progression" className="text-xs">Progression</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-4">
            {mergedMechanics.coreConcepts.map((concept, idx) => (
              <div key={idx} className="bg-slate-700/30 p-3 rounded">
                <Badge className="bg-purple-600/50 mb-2">{concept.system}</Badge>
                <p className="text-sm text-slate-300">{concept.rule}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="combat" className="space-y-2 mt-4">
            {Object.entries(mergedMechanics.combatSystem).map(([key, value]) => (
              <div key={key} className="bg-slate-700/30 p-3 rounded">
                <p className="text-xs font-semibold text-slate-200 capitalize">{key}</p>
                <p className="text-sm text-slate-400 mt-1">{String(value)}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="magic" className="space-y-2 mt-4">
            {Object.entries(mergedMechanics.magicSystem).map(([key, value]) => (
              <div key={key} className="bg-slate-700/30 p-3 rounded">
                <p className="text-xs font-semibold text-slate-200 capitalize">{key}</p>
                <p className="text-sm text-slate-400 mt-1">{String(value)}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="progression" className="space-y-2 mt-4">
            {Object.entries(mergedMechanics.progressionSystem).map(([system, rule]) => (
              <div key={system} className="bg-slate-700/30 p-3 rounded">
                <p className="text-xs font-semibold text-slate-200">{system}</p>
                <p className="text-sm text-slate-400 mt-1">{String(rule)}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}