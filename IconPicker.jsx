import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sword, Wand2, Shield, Heart, Zap, Sparkles, Flame, Skull, Star, Moon, Sun, Crown, User, Bot, Smile, Ghost, Rabbit, Cat, Dog, Bird, Fish } from "lucide-react";

const iconSets = {
  fantasy: [
    { Icon: Sword, name: "Sword" },
    { Icon: Wand2, name: "Wand" },
    { Icon: Shield, name: "Shield" },
    { Icon: Crown, name: "Crown" },
    { Icon: Sparkles, name: "Sparkles" },
    { Icon: Flame, name: "Flame" },
    { Icon: Star, name: "Star" },
    { Icon: Moon, name: "Moon" }
  ],
  scifi: [
    { Icon: Zap, name: "Zap" },
    { Icon: Bot, name: "Bot" },
    { Icon: Star, name: "Star" },
    { Icon: Sun, name: "Sun" }
  ],
  creatures: [
    { Icon: Rabbit, name: "Rabbit" },
    { Icon: Cat, name: "Cat" },
    { Icon: Dog, name: "Dog" },
    { Icon: Bird, name: "Bird" },
    { Icon: Fish, name: "Fish" },
    { Icon: Ghost, name: "Ghost" },
    { Icon: Skull, name: "Skull" }
  ],
  basic: [
    { Icon: User, name: "User" },
    { Icon: Smile, name: "Smile" },
    { Icon: Heart, name: "Heart" }
  ]
};

export default function IconPicker({ currentIcon, onSelect, open, onOpenChange }) {
  const [selectedCategory, setSelectedCategory] = useState("fantasy");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-purple-300">Choose Profile Icon</DialogTitle>
        </DialogHeader>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-4 bg-slate-700/50">
            <TabsTrigger value="fantasy">Fantasy</TabsTrigger>
            <TabsTrigger value="scifi">Sci-Fi</TabsTrigger>
            <TabsTrigger value="creatures">Creatures</TabsTrigger>
            <TabsTrigger value="basic">Basic</TabsTrigger>
          </TabsList>
          
          {Object.keys(iconSets).map(category => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-4 gap-3">
                {iconSets[category].map(({ Icon, name }) => (
                  <Button
                    key={name}
                    variant="outline"
                    className={`h-20 flex flex-col items-center justify-center gap-2 ${
                      currentIcon === name 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-slate-600 hover:border-purple-400'
                    }`}
                    onClick={() => {
                      onSelect(name, Icon);
                      onOpenChange(false);
                    }}
                  >
                    <Icon className="w-8 h-8 text-purple-300" />
                    <span className="text-xs">{name}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}