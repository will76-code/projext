import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, BookOpen, Globe, Church, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpandedLoreGenerator({ worldId, rulebooks = [] }) {
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState('cosmology');
  const [generatedContent, setGeneratedContent] = useState({});
  const queryClient = useQueryClient();

  const { data: world } = useQuery({
    queryKey: ['world', worldId],
    queryFn: () => base44.entities.World.filter({ id: worldId }).then(r => r[0]),
    enabled: !!worldId
  });

  const { data: existingLore = [] } = useQuery({
    queryKey: ['lore', worldId],
    queryFn: () => base44.entities.LoreEntry.filter({ world_id: worldId }),
    enabled: !!worldId
  });

  const saveLoreMutation = useMutation({
    mutationFn: async (loreData) => {
      return base44.entities.LoreEntry.create(loreData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lore', worldId] });
      toast.success('Lore entry saved successfully');
    }
  });

  const loreCategories = [
    { 
      id: 'cosmology', 
      label: 'Cosmology', 
      icon: Globe,
      description: 'Creation myths, planes of existence, cosmic forces'
    },
    { 
      id: 'history', 
      label: 'History', 
      icon: Clock,
      description: 'Major events, eras, timeline of civilizations'
    },
    { 
      id: 'religions', 
      label: 'Religions', 
      icon: Church,
      description: 'Deities, pantheons, religious practices'
    },
    { 
      id: 'mythology', 
      label: 'Mythology', 
      icon: BookOpen,
      description: 'Legends, folk tales, cultural stories'
    }
  ];

  const generateLore = async (category) => {
    if (!worldId) {
      toast.error('No world selected');
      return;
    }

    setGenerating(true);
    setActiveCategory(category);

    try {
      const rulebookContext = rulebooks.map(rb => ({
        title: rb.title,
        system: rb.game_system,
        lore: rb.npcs || [],
        locations: rb.locations || [],
        mechanics: rb.game_mechanics
      }));

      const prompts = {
        cosmology: `Generate detailed cosmology for the ${world.name} world (${world.genre} genre, ${world.game_system} system).

Based on available rulebooks: ${JSON.stringify(rulebookContext)}

Include:
1. Creation Myth - How was the world/universe formed?
2. Planes of Existence - What other realms exist? (Material, Ethereal, etc.)
3. Cosmic Forces - What fundamental powers shape reality?
4. The Outer Dark - What lies beyond known reality?
5. Divine Hierarchy - Structure of divine/cosmic entities
6. Fate & Destiny - How does destiny work in this cosmos?

Format as rich markdown with sections.`,

        history: `Generate a historical timeline for ${world.name} (${world.genre}, ${world.game_system}).

Context: ${JSON.stringify(rulebookContext)}

Include:
1. Primordial Era - The earliest times
2. Age of Legends - Mythical heroes and kingdoms
3. The Great Cataclysm - A world-changing event
4. Rise of Civilizations - Major kingdoms/factions emerged
5. The Modern Age - Current state of the world
6. Key Historical Figures - 5-7 important people who shaped history

For each era, provide:
- Time period
- Major events
- Cultural developments
- Technological/magical advances
- How it connects to the game system's lore

Format as markdown with timeline structure.`,

        religions: `Generate religious systems for ${world.name} (${world.genre}, ${world.game_system}).

Rulebook reference: ${JSON.stringify(rulebookContext)}

Create 3-4 distinct religions/faiths:

For each religion:
1. Name and Core Tenets
2. Deity/Deities (name, domain, personality)
3. Creation Belief - Their version of how the world began
4. Sacred Sites and Pilgrimage locations
5. Religious Practices and Rituals
6. Clergy Structure and Roles
7. Holy Symbols and Artifacts
8. Relationship with other religions
9. How magic/powers relate to faith (if applicable)
10. Major Holidays and Observances

Make religions diverse and interconnected. Show conflicts and alliances.

Format as markdown with clear sections per religion.`,

        mythology: `Generate rich mythology for ${world.name} (${world.genre}, ${world.game_system}).

Based on: ${JSON.stringify(rulebookContext)}

Create 5-7 myths/legends:

For each:
1. Title of the Legend
2. The Tale (2-3 paragraphs, dramatic storytelling)
3. Cultural Origin - Which people tell this story?
4. Moral or Lesson
5. Historical Basis (if any)
6. Modern Interpretations - How is it viewed today?
7. Game Hooks - How this could tie into adventures
8. Linked Entries - References to other lore (cosmology, deities, historical events)

Include variety:
- A hero's journey
- A cautionary tale
- An origin story (for a race, place, or artifact)
- A prophecy
- A love story with cosmic consequences
- A trickster tale

Format as markdown with vivid storytelling.`
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[category],
        add_context_from_internet: false
      });

      setGeneratedContent(prev => ({
        ...prev,
        [category]: response
      }));

      toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} generated successfully`);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Failed to generate ${category}`);
    } finally {
      setGenerating(false);
    }
  };

  const saveLoreEntry = (category) => {
    const content = generatedContent[category];
    if (!content) {
      toast.error('No content to save');
      return;
    }

    const categoryMap = {
      cosmology: 'custom',
      history: 'history',
      religions: 'custom',
      mythology: 'custom'
    };

    saveLoreMutation.mutate({
      world_id: worldId,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} of ${world?.name || 'World'}`,
      content: content,
      category: categoryMap[category],
      author: 'AI Generated'
    });
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-300">
          <Sparkles className="w-5 h-5" />
          Deep Lore Generator
        </CardTitle>
        <CardDescription className="text-slate-400">
          Generate comprehensive world lore from your rulebooks and world data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-4 bg-slate-900/50">
            {loreCategories.map(cat => {
              const Icon = cat.icon;
              return (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {loreCategories.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="space-y-4">
              <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
                <p className="text-slate-300 text-sm mb-4">{cat.description}</p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateLore(cat.id)}
                    disabled={generating || !worldId || rulebooks.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {generating && activeCategory === cat.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate {cat.label}
                      </>
                    )}
                  </Button>

                  {generatedContent[cat.id] && (
                    <Button
                      onClick={() => saveLoreEntry(cat.id)}
                      variant="outline"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save to Lore Library
                    </Button>
                  )}
                </div>
              </div>

              {generatedContent[cat.id] && (
                <div className="bg-slate-900/50 rounded-lg p-6 border border-purple-500/30">
                  <div className="prose prose-invert prose-purple max-w-none">
                    <div 
                      className="text-slate-200"
                      dangerouslySetInnerHTML={{ 
                        __html: generatedContent[cat.id].replace(/\n/g, '<br />') 
                      }} 
                    />
                  </div>
                </div>
              )}

              {!generatedContent[cat.id] && (
                <div className="text-center py-12 text-slate-500">
                  <cat.icon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No {cat.label.toLowerCase()} generated yet</p>
                  <p className="text-sm mt-2">
                    Click "Generate {cat.label}" to create AI-powered lore
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {rulebooks.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              No rulebooks found for this world. Upload rulebooks first for richer, system-accurate lore generation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}