import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Zap, Smile, Drama, Music } from "lucide-react";

const CAMPAIGN_TONES = [
  {
    id: "epic_adventure",
    label: "Epic Adventure",
    icon: Zap,
    color: "bg-yellow-600",
    description: "Grand quests and heroic deeds"
  },
  {
    id: "romance",
    label: "Romance",
    icon: Heart,
    color: "bg-pink-600",
    description: "Emotional connections and relationships"
  },
  {
    id: "slice_of_life",
    label: "Slice of Life",
    icon: Smile,
    color: "bg-green-600",
    description: "Everyday adventures and peaceful moments"
  },
  {
    id: "drama",
    label: "Drama",
    icon: Drama,
    color: "bg-purple-600",
    description: "Tension, conflict, and emotional depth"
  },
  {
    id: "comedy",
    label: "Comedy",
    icon: Music,
    color: "bg-orange-600",
    description: "Humor and lighthearted moments"
  },
  {
    id: "horror",
    label: "Horror",
    icon: Zap,
    color: "bg-red-600",
    description: "Dark atmosphere and fear"
  },
  {
    id: "mystery",
    label: "Mystery",
    icon: Zap,
    color: "bg-indigo-600",
    description: "Secrets and discovery"
  },
  {
    id: "noir",
    label: "Noir",
    icon: Zap,
    color: "bg-slate-700",
    description: "Gritty, cynical atmosphere"
  },
  {
    id: "superhero",
    label: "Superhero",
    icon: Zap,
    color: "bg-blue-600",
    description: "Powers and larger-than-life action"
  },
  {
    id: "action",
    label: "Action",
    icon: Zap,
    color: "bg-red-700",
    description: "Fast-paced combat and movement"
  },
  {
    id: "intrigue",
    label: "Intrigue",
    icon: Zap,
    color: "bg-emerald-600",
    description: "Politics, plots, and power"
  }
];

export default function CampaignToneSelector({ value = [], onChange, maxTones = 5 }) {
  const [selected, setSelected] = useState(value);

  const handleToggle = (toneId) => {
    let newSelected;
    if (selected.includes(toneId)) {
      newSelected = selected.filter(id => id !== toneId);
    } else {
      if (selected.length < maxTones) {
        newSelected = [...selected, toneId];
      } else {
        return;
      }
    }
    setSelected(newSelected);
    onChange?.(newSelected);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-300">Campaign Tones & Genres</CardTitle>
        <p className="text-xs text-slate-400 mt-2">Select up to {maxTones} tones to define your campaign's atmosphere</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {CAMPAIGN_TONES.map(tone => {
            const Icon = tone.icon;
            const isSelected = selected.includes(tone.id);

            return (
              <button
                key={tone.id}
                onClick={() => handleToggle(tone.id)}
                disabled={!isSelected && selected.length >= maxTones}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? `${tone.color} border-white text-white`
                    : selected.length >= maxTones
                    ? 'bg-slate-700/30 border-slate-600 text-slate-500 cursor-not-allowed opacity-50'
                    : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:border-purple-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold text-sm">{tone.label}</span>
                </div>
                <p className="text-xs opacity-90">{tone.description}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Summary */}
        {selected.length > 0 && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
            <p className="text-xs text-purple-400 font-semibold mb-2">Selected Tones ({selected.length}/{maxTones}):</p>
            <div className="flex flex-wrap gap-2">
              {selected.map(toneId => {
                const tone = CAMPAIGN_TONES.find(t => t.id === toneId);
                return (
                  <Badge key={toneId} className={`${tone.color} cursor-pointer`} onClick={() => handleToggle(toneId)}>
                    {tone.label} ✕
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 italic">
          💡 These tones influence AI encounter generation, NPC dialogue, and overall narrative flavor!
        </p>
      </CardContent>
    </Card>
  );
}