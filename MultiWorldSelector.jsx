import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

export default function MultiWorldSelector({ worlds, selectedWorlds, onToggleWorld }) {
  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Crossover Campaign (Select 1-2 Worlds)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-purple-300 mb-4">
          Combine up to two worlds for a unique crossover campaign with blended mechanics
        </p>
        <div className="grid grid-cols-2 gap-3">
          {worlds.map((world) => {
            const isSelected = selectedWorlds.includes(world.id);
            const canSelect = selectedWorlds.length < 2 || isSelected;
            
            return (
              <Button
                key={world.id}
                onClick={() => canSelect && onToggleWorld(world.id)}
                disabled={!canSelect}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-start gap-2 ${
                  isSelected ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700/30 hover:bg-slate-700/50'
                } ${!canSelect && 'opacity-50 cursor-not-allowed'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-left">{world.name}</span>
                  {isSelected && <X className="w-4 h-4" />}
                </div>
                <Badge variant="outline" className="text-xs">
                  {world.game_system}
                </Badge>
                <p className="text-xs text-left opacity-80 line-clamp-2">
                  {world.description}
                </p>
              </Button>
            );
          })}
        </div>
        {selectedWorlds.length === 2 && (
          <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <p className="text-xs text-purple-300">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Crossover Mode: Your campaign will blend mechanics and lore from both worlds!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}