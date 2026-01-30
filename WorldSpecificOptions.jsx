import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WorldSpecificOptions({ world, onOptionsGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateWorldOptions = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate unique character creation options specifically for this world:

World: ${world.name}
Genre: ${world.genre}
Game System: ${world.game_system}
Description: ${world.description}

Generate 10 world-specific options including:
- Unique spells/abilities specific to this setting
- Special skills tied to the world's culture/technology
- Racial abilities or mutations
- Faction-specific powers
- Environmental adaptations

For ${world.game_system === 'dc_adventures' ? 'DC Adventures (superheroes)' : ''} 
${world.game_system === 'mage_ascension' ? 'Mage: The Ascension (spheres and paradigms)' : ''}
${world.game_system === 'naruto_n5e' ? 'Naruto (jutsu and chakra nature)' : ''}

Return as JSON array with name, description, type, and requirements for each.`,
        response_json_schema: {
          type: "object",
          properties: {
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" },
                  requirements: { type: "string" },
                  flavor: { type: "string" }
                }
              }
            }
          }
        }
      });

      onOptionsGenerated(response.options || []);
      toast.success("World-specific options generated!");
    } catch (error) {
      toast.error("Failed to generate options");
    }
    setIsGenerating(false);
  };

  return (
    <Button
      onClick={generateWorldOptions}
      disabled={isGenerating}
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
      Generate {world.name}-Specific Options
    </Button>
  );
}