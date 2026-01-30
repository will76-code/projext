import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function SceneVisualizer({ currentScene, world }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sceneImage, setSceneImage] = useState(null);
  const [sceneDescription, setSceneDescription] = useState("");
  const [artLevel, setArtLevel] = useState(1);
  const [usageCount, setUsageCount] = useState(0);

  const generateSceneVisualization = async () => {
    setIsGenerating(true);
    setUsageCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5 && artLevel < 3) setArtLevel(prev => prev + 1);
      return newCount;
    });
    try {
      const qualityLevel = artLevel === 3 ? 'masterpiece quality, award-winning' : artLevel === 2 ? 'high quality, detailed' : 'quality';
      // First, enhance the scene description
      const enhancedPrompt = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a vivid, detailed visual description for this RPG scene that would work well for image generation:

Scene: ${currentScene}
World: ${world.name} (${world.genre})

Describe the scene in rich detail including: lighting, atmosphere, key visual elements, colors, mood. Make it cinematic and evocative. Keep it to 2-3 sentences.`,
        add_context_from_internet: false
      });

      setSceneDescription(enhancedPrompt);

      // Generate the image
      const imageResult = await base44.integrations.Core.GenerateImage({
        prompt: `${enhancedPrompt}. ${world.genre} style, ${qualityLevel}, atmospheric, cinematic lighting`,
        existing_image_urls: []
      });

      setSceneImage(imageResult.url);
      toast.success("Scene visualization created!");
    } catch (error) {
      toast.error("Failed to generate visualization");
    }
    setIsGenerating(false);
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Scene Visualizer
          </CardTitle>
          <div className="text-xs text-purple-400">Lvl {artLevel} • {usageCount} uses</div>
        </div>
        {artLevel > 1 && (
          <p className="text-xs text-green-400 mt-1">✨ {artLevel === 3 ? 'Masterpiece' : 'Enhanced'} artwork quality!</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-purple-300">
          Generate AI artwork for the current scene
        </p>

        <Button
          onClick={generateSceneVisualization}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Scene Art...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Visualize Current Scene
            </>
          )}
        </Button>

        {sceneDescription && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
            <p className="text-xs text-purple-400 font-semibold mb-1">Scene Description:</p>
            <p className="text-sm text-white">{sceneDescription}</p>
          </div>
        )}

        {sceneImage && (
          <div className="rounded-lg overflow-hidden border border-purple-500/30">
            <img src={sceneImage} alt="Generated scene" className="w-full h-auto" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}