import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, User, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const createPageUrl = (pageName) => `/${pageName}`;
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CharacterSelect() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const worldId = urlParams.get('worldId');
  
  const [selectedWorld, setSelectedWorld] = useState(null);

  const { data: world } = useQuery({
    queryKey: ['world', worldId],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ id: worldId });
      return worlds[0];
    },
    enabled: !!worldId
  });

  const { data: characters } = useQuery({
    queryKey: ['characters', worldId],
    queryFn: () => base44.entities.Character.filter({ world_id: worldId }),
    enabled: !!worldId,
    initialData: []
  });

  useEffect(() => {
    if (world) setSelectedWorld(world);
  }, [world]);

  if (!worldId || !selectedWorld) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p>Loading world...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        <Link to={createPageUrl('WorldHub')}>
          <Button variant="ghost" className="mb-6 text-purple-300 hover:text-purple-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Worlds
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {selectedWorld.name}
          </h1>
          <p className="text-xl text-purple-200">Select Your Champion</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Create New Character */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Link to={createPageUrl(`CharacterBuilder?worldId=${worldId}`)}>
              <Card className="h-80 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-dashed border-purple-400 hover:border-purple-300 flex items-center justify-center cursor-pointer group">
                <div className="text-center">
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus className="w-16 h-16 mx-auto mb-4 text-purple-400 group-hover:text-purple-300" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-purple-300">Create New Character</h3>
                </div>
              </Card>
            </Link>
          </motion.div>

          {/* Existing Characters */}
          {characters.map((character, index) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (index + 1) * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Link to={createPageUrl(`Campaign?characterId=${character.id}`)}>
                <Card className="h-80 bg-gradient-to-br from-slate-800 to-slate-900 border-purple-500/30 hover:border-purple-400 overflow-hidden cursor-pointer group">
                  {character.avatar_url ? (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={character.avatar_url}
                        alt={character.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex items-center justify-center">
                      <User className="w-20 h-20 text-purple-300" />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-2">{character.name}</h3>
                    <p className="text-sm text-purple-300 mb-2">
                      Level {character.level} {character.race} {character.class_role}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {character.special_things?.map((thing, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {thing.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {characters.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-12 text-purple-300"
          >
            <p className="text-lg">No characters yet. Create your first hero!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}