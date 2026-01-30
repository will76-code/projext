import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Target } from "lucide-react";

export default function CampaignModeSelector({ onModeChange, defaultMode = 'goal-driven' }) {
  const [selectedMode, setSelectedMode] = useState(defaultMode);

  useEffect(() => {
    onModeChange?.(selectedMode);
    localStorage.setItem('campaignMode', selectedMode);
  }, [selectedMode]);

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          🎮 Campaign Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Goal-Driven Mode */}
          <button
            onClick={() => setSelectedMode('goal-driven')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedMode === 'goal-driven'
                ? 'border-purple-500 bg-purple-900/30'
                : 'border-slate-600 bg-slate-700/30 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-purple-300">Goal-Driven</span>
            </div>
            <p className="text-xs text-slate-400">
              Work towards campaign goals with tracked progress and milestone markers. Perfect for campaigns with direction.
            </p>
            {selectedMode === 'goal-driven' && (
              <Badge className="mt-2 bg-purple-600">Active</Badge>
            )}
          </button>

          {/* Sandbox Mode */}
          <button
            onClick={() => setSelectedMode('sandbox')}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedMode === 'sandbox'
                ? 'border-cyan-500 bg-cyan-900/30'
                : 'border-slate-600 bg-slate-700/30 hover:border-cyan-500/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-cyan-300">Sandbox Explorer</span>
            </div>
            <p className="text-xs text-slate-400">
              Freely explore the world, discover emergent lore, and create your own adventures without predefined goals.
            </p>
            {selectedMode === 'sandbox' && (
              <Badge className="mt-2 bg-cyan-600">Active</Badge>
            )}
          </button>
        </div>

        {/* Mode Description */}
        <div className={`rounded-lg p-3 border ${
          selectedMode === 'goal-driven'
            ? 'bg-purple-900/20 border-purple-500/30'
            : 'bg-cyan-900/20 border-cyan-500/30'
        }`}>
          <p className={`text-sm ${
            selectedMode === 'goal-driven'
              ? 'text-purple-300'
              : 'text-cyan-300'
          }`}>
            {selectedMode === 'goal-driven' ? (
              <>
                <span className="font-semibold">Goal-Driven Mode:</span> AI will suggest narrative objectives, track progress against milestones, and suggest story hooks that advance your campaign while still allowing exploration and discovery.
              </>
            ) : (
              <>
                <span className="font-semibold">Sandbox Mode:</span> Explore freely without predefined goals. AI provides world-building tools, random encounters, and emergent storytelling. Discover lore organically through play rather than pursuing objectives.
              </>
            )}
          </p>
        </div>

        {/* Mode Tips */}
        <div className="text-xs text-slate-400 space-y-1">
          <p><span className="text-slate-500 font-semibold">💡 Tip:</span> You can switch between modes anytime—your campaign state is preserved in both.</p>
          <p><span className="text-slate-500 font-semibold">🌍 Either way:</span> The AI will adapt, suggesting hooks and events that fit your exploration style.</p>
        </div>
      </CardContent>
    </Card>
  );
}