import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Check, Palette } from "lucide-react";
import ThemeVerification from "../components/theme/ThemeVerification";

const premiumThemes = [
  {
    name: "Mage: The Ascension",
    system: "mage_ascension",
    description: "Reality-bending mystic theme",
    colors: { primary: "#4a1a8a", secondary: "#8b5cf6", accent: "#c084fc" },
    requiresVerification: true
  },
  {
    name: "Tails of Equestria",
    system: "tails_of_equestria",
    description: "Colorful friendship adventure theme",
    colors: { primary: "#ff69b4", secondary: "#9370db", accent: "#ffd700" },
    requiresVerification: true
  },
  {
    name: "DC Adventures",
    system: "dc_adventures",
    description: "Heroic superhero theme",
    colors: { primary: "#003f87", secondary: "#dc0000", accent: "#ffd700" },
    requiresVerification: true
  }
];

export default function ThemeGallery() {
  const [verifyingTheme, setVerifyingTheme] = useState(null);

  const { data: unlocks } = useQuery({
    queryKey: ['theme-unlocks'],
    queryFn: () => base44.entities.ThemeUnlock.list(),
    initialData: []
  });

  const isUnlocked = (system) => {
    return unlocks.some(u => u.game_system === system && u.verified);
  };

  return (
    <div className="min-h-screen theme-container text-white py-12">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 theme-title flex items-center justify-center gap-3">
            <Palette className="w-12 h-12" />
            Theme Gallery
          </h1>
          <p className="text-xl theme-subtitle">Unlock premium themes by verifying your rulebook ownership</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {premiumThemes.map((theme, index) => {
            const unlocked = isUnlocked(theme.system);
            
            return (
              <motion.div
                key={theme.system}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-purple-500/30 hover:border-purple-400 transition-all">
                  <CardHeader>
                    <div 
                      className="w-full h-32 rounded-lg mb-4"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent})`
                      }}
                    />
                    <CardTitle className="text-white flex items-center justify-between">
                      {theme.name}
                      {unlocked ? (
                        <Badge className="bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-purple-200 mb-4">{theme.description}</p>
                    {!unlocked && (
                      <Button
                        onClick={() => setVerifyingTheme(theme)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Unlock Theme
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {verifyingTheme && (
        <ThemeVerification
          open={!!verifyingTheme}
          onOpenChange={(open) => !open && setVerifyingTheme(null)}
          themeName={verifyingTheme.name}
          gameSystem={verifyingTheme.system}
        />
      )}
    </div>
  );
}