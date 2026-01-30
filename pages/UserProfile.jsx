import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Settings, History, LogOut, Save } from "lucide-react";
import { toast } from "sonner";

export default function UserProfile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    default_game_system: "dnd5e",
    ai_style: "balanced",
    theme: "modern"
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    if (currentUser.preferences) {
      setPreferences(currentUser.preferences);
    }
  };

  const { data: worlds = [] } = useQuery({
    queryKey: ['user-worlds'],
    queryFn: async () => {
      const all = await base44.entities.World.list('-created_date');
      return all.filter(w => w.created_by === user?.email);
    },
    enabled: !!user
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['user-campaigns'],
    queryFn: async () => {
      const all = await base44.entities.Campaign.list('-created_date');
      return all.filter(c => c.created_by === user?.email);
    },
    enabled: !!user
  });

  const savePreferences = async () => {
    try {
      await base44.auth.updateMe({ preferences });
      toast.success("Preferences saved!");
    } catch (error) {
      toast.error("Failed to save preferences");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{user.full_name || user.email}</h1>
              <p className="text-slate-400">{user.email}</p>
              <Badge className="mt-1">{user.role}</Badge>
            </div>
          </div>
          <Button variant="outline" onClick={() => base44.auth.logout()}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="space-y-6">
          {/* Preferences */}
          <Card className="bg-slate-800/50 border-indigo-500/30">
            <CardHeader>
              <CardTitle className="text-indigo-300 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Default Game System</Label>
                <Select 
                  value={preferences.default_game_system} 
                  onValueChange={(val) => setPreferences({ ...preferences, default_game_system: val })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dnd5e">D&D 5e</SelectItem>
                    <SelectItem value="pathfinder2e">Pathfinder 2e</SelectItem>
                    <SelectItem value="dc_adventures">DC Adventures</SelectItem>
                    <SelectItem value="tails_of_equestria">Tails of Equestria</SelectItem>
                    <SelectItem value="cyberpunk_red">Cyberpunk Red</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">AI GM Style</Label>
                <Select 
                  value={preferences.ai_style} 
                  onValueChange={(val) => setPreferences({ ...preferences, ai_style: val })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narrative">Narrative (story-focused)</SelectItem>
                    <SelectItem value="balanced">Balanced (story + mechanics)</SelectItem>
                    <SelectItem value="tactical">Tactical (rules-heavy)</SelectItem>
                    <SelectItem value="cinematic">Cinematic (dramatic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">UI Theme</Label>
                <Select 
                  value={preferences.theme} 
                  onValueChange={(val) => setPreferences({ ...preferences, theme: val })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="retro">Retro</SelectItem>
                    <SelectItem value="galaxy">Galaxy</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={savePreferences} className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-300 flex items-center gap-2">
                <History className="w-5 h-5" />
                Your History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-white mb-2">Worlds Created ({worlds.length})</p>
                <div className="grid grid-cols-2 gap-2">
                  {worlds.slice(0, 6).map(w => (
                    <div key={w.id} className="bg-slate-700/30 rounded p-2">
                      <p className="text-xs font-semibold text-purple-300">{w.name}</p>
                      <p className="text-xs text-slate-400">{w.game_system}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white mb-2">Campaigns ({campaigns.length})</p>
                <div className="space-y-1">
                  {campaigns.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-slate-700/30 rounded p-2">
                      <p className="text-xs text-white">{c.title}</p>
                      <Badge className="text-xs">{c.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}