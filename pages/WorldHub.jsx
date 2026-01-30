import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Sword, Skull, Zap, Moon, Settings, BookOpen, Crown, Upload, Globe, Star, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import WorldLoreAssistant from "../components/ai/WorldLoreAssistant";
import CollaborativeLoreBuilder from "../components/world/CollaborativeLoreBuilder";
import WorldStateSimulator from "../components/world/WorldStateSimulator";
import HomebrewSearch from "../components/world/HomebrewSearch";
import WorldEventGenerator from "../components/ai/WorldEventGenerator";
import DeepLoreGenerator from "../components/ai/DeepLoreGenerator";
import PremiumAIFeatures from "../components/premium/PremiumAIFeatures";
import AutoLoreGenerator from "../components/ai/AutoLoreGenerator";
import GameElementGenerator from "../components/ai/GameElementGenerator";

const createPageUrl = (pageName) => `/${pageName}`;
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const genreIcons = {
  fantasy: Sword,
  sci_fi: Zap,
  horror: Skull,
  anime: Sparkles,
  cyberpunk: Zap,
  space_opera: Moon
};

export default function WorldHub() {
  const [theme, setTheme] = useState(localStorage.getItem('appTheme') || 'modern');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [favoriteWorlds, setFavoriteWorlds] = useState(() => {
    const saved = localStorage.getItem('favoriteWorlds');
    return saved ? JSON.parse(saved) : [];
  });
  const [worldFolders, setWorldFolders] = useState(() => {
    const saved = localStorage.getItem('worldFolders');
    return saved ? JSON.parse(saved) : {};
  });

  // Apply theme on mount and when theme changes
  React.useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('appTheme', newTheme);
  };

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    initialData: null
  });

  const { data: worlds, isLoading } = useQuery({
    queryKey: ['worlds'],
    queryFn: () => base44.entities.World.list('-created_date'),
    initialData: []
  });

  const { data: rulebooks } = useQuery({
    queryKey: ['rulebooks'],
    queryFn: () => base44.entities.Rulebook.list('-created_date'),
    initialData: []
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['worldFolders'],
    queryFn: () => base44.entities.WorldFolder.list(),
    initialData: []
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['worldTags'],
    queryFn: () => base44.entities.WorldTag.list(),
    initialData: []
  });

  // Filter and organize worlds
  const filteredWorlds = worlds.filter(w => {
    if (!w.is_active || w.created_by !== user?.email) return false;
    
    const matchesSearch = searchQuery.trim() === "" || 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.genre.toLowerCase().includes(searchQuery.toLowerCase());
    
    const worldTags = tags.filter(t => t.world_id === w.id).map(t => t.tag_name);
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => worldTags.includes(tag)) ||
      selectedTags.includes(w.genre) ||
      selectedTags.includes(w.game_system);
    
    const worldFolder = worldFolders[w.id];
    const matchesFolder = !selectedFolder || worldFolder === selectedFolder;
    
    return matchesSearch && matchesTags && matchesFolder;
  });

  const toggleFavorite = (worldId) => {
    const newFavorites = favoriteWorlds.includes(worldId)
      ? favoriteWorlds.filter(id => id !== worldId)
      : [...favoriteWorlds, worldId];
    setFavoriteWorlds(newFavorites);
    localStorage.setItem('favoriteWorlds', JSON.stringify(newFavorites));
  };

  const sortedWorlds = [...filteredWorlds].sort((a, b) => {
    const aFav = favoriteWorlds.includes(a.id);
    const bFav = favoriteWorlds.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen text-white relative">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold mb-4 theme-title">
            Multiverse Emulator
          </h1>
          <p className="text-xl theme-subtitle mb-6">
            Choose Your Reality
          </p>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                <Crown className="w-4 h-4 mr-2" />
                Premium AI Features
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto bg-slate-900 border-purple-500/30">
              <PremiumAIFeatures userTier="free" />
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search & Filters */}
        <div className="max-w-4xl mx-auto mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search worlds by name or genre..."
              className="pl-10 bg-slate-800/80 border-purple-500/50 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Quick Access Sidebar */}
          {favoriteWorlds.length > 0 && (
            <Card className="bg-slate-800/80 border-yellow-500/30">
              <CardHeader className="pb-3">
                <h3 className="text-sm font-semibold text-yellow-300 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  Quick Access
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {worlds.filter(w => favoriteWorlds.includes(w.id)).map(world => (
                    <Badge 
                      key={world.id} 
                      className="bg-yellow-900/30 border-yellow-500/50 cursor-pointer hover:bg-yellow-900/50"
                      onClick={() => window.location.href = createPageUrl(`CharacterSelect?worldId=${world.id}`)}
                    >
                      {world.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg">
            <Label className="text-white">Theme:</Label>
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-800/80 border border-purple-500/50 text-white text-sm"
            >
              <option value="modern">🌟 Modern Purple</option>
              <option value="retro">🕹️ Retro Matrix</option>
              <option value="warm">🔥 Warm Ember</option>
              <option value="galaxy">🌌 Galaxy Stars</option>
              <option value="ocean">🌊 Ocean Deep</option>
              <option value="forest">🌲 Forest Night</option>
              <option value="sunset">🌅 Sunset Glow</option>
              <option value="noir">🎬 Noir Shadow</option>
              <option value="neon">💜 Neon Cyber</option>
              <option value="arctic">❄️ Arctic Frost</option>
              <option value="desert">🏜️ Desert Sand</option>
              <option value="midnight">🌙 Midnight Purple</option>
              <option value="aurora">🌈 Aurora Borealis</option>
              <option value="volcanic">🌋 Volcanic Fire</option>
              <option value="crystal">💎 Crystal Sky</option>
              <option value="shadow">👤 Shadow Realm</option>
            </select>
          </div>
        </div>

        {/* Worlds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <AnimatePresence>
            {sortedWorlds.map((world, index) => {
              const Icon = genreIcons[world.genre] || Sparkles;
              
              return (
                <motion.div
                  key={world.id}
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="group"
                >
                  <Link to={createPageUrl(`CharacterSelect?worldId=${world.id}`)}>
                    <Card className="relative overflow-hidden h-80 cursor-pointer bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-purple-500/30 hover:border-purple-400 backdrop-blur-sm">
                      {/* Cover Image */}
                      {world.cover_image_url && (
                        <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
                          <img 
                            src={world.cover_image_url} 
                            alt={world.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                      
                      {/* Content */}
                      <div className="relative h-full p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <Icon className="w-8 h-8 text-purple-400" />
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleFavorite(world.id);
                                }}
                                className="p-1 hover:scale-110 transition-transform"
                              >
                                <Star className={`w-5 h-5 ${
                                  favoriteWorlds.includes(world.id) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-slate-400'
                                }`} />
                              </button>
                              {world.mature_content && (
                                <Badge variant="destructive" className="text-xs">
                                  18+
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <h3 className="text-2xl font-bold mb-2 text-white">
                            {world.name}
                          </h3>
                          
                          <Badge>
                            {world.game_system.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </div>

                        <p className="text-sm text-purple-200 line-clamp-3">
                          {world.description}
                        </p>

                        <motion.div
                          className="mt-4 py-3 px-4 rounded-lg text-center font-semibold bg-purple-600/80 text-white"
                          whileHover={{ scale: 1.05 }}
                        >
                          Enter World
                        </motion.div>

                        {/* AI Lore Assistant & World Settings */}
                        <div className="flex gap-2 mt-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-purple-500/50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Explore Lore
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-slate-900 border-purple-500/30">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                  <WorldLoreAssistant world={world} />
                                  <DeepLoreGenerator world={world} />
                                  <AutoLoreGenerator 
                                    worldId={world.id}
                                    rulebooks={rulebooks.filter(r => 
                                      world.unique_mechanics?.rulebook_ids?.includes(r.id)
                                    )}
                                  />
                                </div>
                                <div className="space-y-4">
                                  <HomebrewSearch world={world} />
                                  <WorldEventGenerator world={world} />
                                  <GameElementGenerator 
                                    rulebooks={rulebooks.filter(r => 
                                      world.unique_mechanics?.rulebook_ids?.includes(r.id)
                                    )}
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Link to={createPageUrl(`GMWorldManagement?worldId=${world.id}`)}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-purple-500/50"
                              onClick={(e) => e.stopPropagation()}
                              title="GM Tools"
                            >
                              <Crown className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={createPageUrl(`WorldHubSettings?worldId=${world.id}`)}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-purple-500/50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                        </div>
                        </Card>
                        </Link>
                        </motion.div>
                        );
                        })}
                        </AnimatePresence>
                        </div>

        {filteredWorlds.length === 0 && !isLoading && (
          <div className="text-center text-white mt-20 col-span-full">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <h3 className="text-2xl font-bold mb-2">No Worlds Yet</h3>
            <p className="text-purple-300 mb-6">Upload your rulebooks to create your first world!</p>
            <Link to={createPageUrl('RulebookManager')}>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Rulebooks
              </Button>
            </Link>
          </div>
        )}

        {isLoading && (
          <div className="text-center text-white mt-20 col-span-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <Sparkles className="w-12 h-12" />
            </motion.div>
            <p className="mt-4">Loading worlds...</p>
          </div>
        )}
      </div>
    </div>
  );
}