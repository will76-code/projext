import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Music, Volume2 } from "lucide-react";
import { toast } from "sonner";

export default function AmbientSoundGenerator({ sceneDescription: initialDescription = "", mood: initialMood = "adventure" }) {
  const [sounds, setSounds] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sceneDescription, setSceneDescription] = useState(initialDescription);
  const [mood, setMood] = useState(initialMood);

  const soundLibraries = {
    freesound: "https://freesound.org",
    pixabay: "https://pixabay.com/sound-effects",
    incompetech: "https://incompetech.com/music/royalty-free",
    zapsplat: "https://www.zapsplat.com"
  };

  const moodPresets = {
    adventure: { color: 'bg-orange-900', emoji: '🗺️' },
    horror: { color: 'bg-red-900', emoji: '👻' },
    romance: { color: 'bg-pink-900', emoji: '💕' },
    mystery: { color: 'bg-purple-900', emoji: '🔍' },
    peaceful: { color: 'bg-green-900', emoji: '☮️' },
    intense: { color: 'bg-red-800', emoji: '⚡' },
    magical: { color: 'bg-blue-900', emoji: '✨' },
    dark: { color: 'bg-slate-900', emoji: '🌑' }
  };

  const generateSounds = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate ambient music and sound effect recommendations for a tabletop RPG scene.

Scene: ${sceneDescription || 'A mysterious location'}
Mood: ${mood}

Recommend:
1. Background music tracks (title, artist, BPM, mood descriptor)
2. Ambient sounds (what sound effects would enhance this scene)
3. Sound effects to avoid (what would break immersion)
4. Volume recommendations (for music and ambient separately)
5. Free resources where these can be found

Format as JSON: { musicTracks (array of {title, artist, bpm, mood}), ambientSounds (array of strings), avoidSounds (array), volumeGuide (string), resources (object with library names and descriptions) }`,
        response_json_schema: {
          type: "object",
          properties: {
            musicTracks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  artist: { type: "string" },
                  bpm: { type: "number" },
                  mood: { type: "string" }
                }
              }
            },
            ambientSounds: { type: "array", items: { type: "string" } },
            avoidSounds: { type: "array", items: { type: "string" } },
            volumeGuide: { type: "string" },
            resources: { type: "object" }
          }
        }
      });
      setSounds(result);
      toast.success('Ambient sounds recommended!');
    } catch (error) {
      toast.error('Failed to generate sounds');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-blue-300 flex items-center gap-2">
          <Music className="w-5 h-5" />
          Ambient Sound & Music
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!sounds ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Scene Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-slate-700/50 border border-blue-500/30 rounded px-3 py-2 text-sm text-slate-200"
              >
                {Object.entries(moodPresets).map(([key, val]) => (
                  <option key={key} value={key}>{val.emoji} {key.charAt(0).toUpperCase() + key.slice(1)}</option>
                ))}
              </select>
            </div>

            <textarea
              placeholder="Describe your scene (optional)..."
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              className="w-full bg-slate-700/50 border border-blue-500/30 rounded px-3 py-2 text-sm text-slate-200 min-h-20"
            />

            <Button
              onClick={generateSounds}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Music className="w-4 h-4 mr-2" />}
              Generate Ambient Sounds
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Music Tracks */}
              <div>
                <h6 className="font-semibold text-blue-300 text-sm mb-2">🎵 Background Music</h6>
                <div className="space-y-2">
                  {sounds.musicTracks?.map((track, i) => (
                    <div key={i} className="bg-slate-700/30 rounded p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-300 text-sm">{track.title}</p>
                          <p className="text-xs text-slate-500">{track.artist}</p>
                        </div>
                        <Badge className="bg-blue-900 text-xs">{track.bpm} BPM</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{track.mood}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambient Sounds */}
              <div className="border-t border-slate-600 pt-3">
                <h6 className="font-semibold text-blue-300 text-sm mb-2">🔊 Ambient Sounds</h6>
                <div className="space-y-1">
                  {sounds.ambientSounds?.map((sound, i) => (
                    <p key={i} className="text-sm text-slate-300">• {sound}</p>
                  ))}
                </div>
              </div>

              {/* Volume Guide */}
              <div className="border-t border-slate-600 pt-3 bg-blue-900/20 rounded p-2">
                <h6 className="font-semibold text-blue-300 text-sm mb-1">🔉 Volume Guide</h6>
                <p className="text-xs text-slate-300">{sounds.volumeGuide}</p>
              </div>

              {/* Sound Resources */}
              <div className="border-t border-slate-600 pt-3">
                <h6 className="font-semibold text-blue-300 text-sm mb-2">🌐 Royalty-Free Libraries</h6>
                <div className="space-y-1">
                  {Object.entries(soundLibraries).map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </a>
                  ))}
                </div>
              </div>

              {/* Avoid Sounds */}
              {sounds.avoidSounds?.length > 0 && (
                <div className="border-t border-slate-600 pt-3 bg-red-900/20 rounded p-2">
                  <h6 className="font-semibold text-red-300 text-sm mb-1">❌ Avoid</h6>
                  <div className="space-y-1">
                    {sounds.avoidSounds.map((sound, i) => (
                      <p key={i} className="text-xs text-slate-300">• {sound}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={() => setSounds(null)} variant="outline" className="w-full border-blue-500/50">
              Generate for Different Scene
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}