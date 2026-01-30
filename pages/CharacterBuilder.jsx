import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const createPageUrl = (pageName) => `/${pageName}`;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, Wand2, ArrowRight, ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import IconPicker from "../components/character/IconPicker";
import CharacterConceptGenerator from "../components/ai/CharacterConceptGenerator";
import CampaignGenerator from "../components/ai/CampaignGenerator";
import WorldSpecificOptions from "../components/character/WorldSpecificOptions";
import AdvancedCharacterCustomization from "../components/ai/AdvancedCharacterCustomization";
import DynamicCampaignGenerator from "../components/ai/DynamicCampaignGenerator";

export default function CharacterBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const worldId = urlParams.get('worldId');

  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState({
    world_id: worldId,
    name: "",
    race: "",
    class_role: "",
    level: 1,
    backstory: "",
    attributes: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    skills: {},
    resources: {
      hp_current: 10,
      hp_max: 10,
      mana_current: 0,
      mana_max: 0
    },
    special_things: [],
    inventory: []
  });

  const [campaignSettings, setCampaignSettings] = useState({
    tone: "",
    primaryModule: "",
    secondaryModule: "",
    matureMode: false
  });

  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("User");
  const [worldSpecificOptions, setWorldSpecificOptions] = useState([]);

  const { data: world } = useQuery({
    queryKey: ['world', worldId],
    queryFn: async () => {
      const worlds = await base44.entities.World.filter({ id: worldId });
      return worlds[0];
    },
    enabled: !!worldId
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data) => {
      const character = await base44.entities.Character.create(data);
      
      // Create campaign with settings
      const campaign = await base44.entities.Campaign.create({
        world_id: worldId,
        character_ids: [character.id],
        title: `${character.name}'s Adventure`,
        current_scene: "Beginning of the journey...",
        story_summary: campaignSettings.tone ? 
          `A ${campaignSettings.tone} adventure featuring ${campaignSettings.primaryModule}${campaignSettings.secondaryModule ? ` with elements of ${campaignSettings.secondaryModule}` : ''}` 
          : "",
        mature_mode: campaignSettings.matureMode,
        status: "active"
      });
      
      return { character, campaign };
    },
    onSuccess: ({ character, campaign }) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Character and campaign created!');
      navigate(createPageUrl(`Campaign?characterId=${character.id}`));
    }
  });

  const generateAISuggestion = async (context, type = 'general') => {
    setIsGenerating(true);
    try {
      const worldEvolution = await base44.entities.WorldEvolution.filter({ world_id: worldId }).catch(() => []);
      const evolutionContext = worldEvolution[0]?.emergent_lore?.slice(0, 3) || [];
      const franchise = world?.rulebook_franchise || 'custom';
      
      let prompt = `You are creating a character for ${world?.name} (${world?.game_system}, Franchise: ${franchise}).\n\n${context}`;
      
      if (type === 'attributes') {
        prompt += `\n\nGenerate 3 different attribute distribution options appropriate for a ${character.race} ${character.class_role}. Return as JSON.`;
        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    attributes: { type: "object" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        });
        setAiSuggestion(JSON.stringify(response.options, null, 2));
      } else {
        prompt += `\n\nWorld History: ${JSON.stringify(evolutionContext)}\n\nCreate suggestions deeply tied to world events and ${franchise} franchise themes. Be specific and contextual.`;
        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: false
        });
        setAiSuggestion(response);
      }
    } catch (error) {
      toast.error('AI suggestion failed');
    }
    setIsGenerating(false);
  };

  const handleSubmit = () => {
    if (!character.name || !character.race || !character.class_role) {
      toast.error('Please complete all required fields');
      return;
    }
    createCharacterMutation.mutate(character);
  };

  const worldTheme = world?.theme_colors || { primary: '#a855f7', secondary: '#ec4899', accent: '#8b5cf6' };

  return (
    <div 
      className="min-h-screen text-white py-12"
      style={{
        background: `linear-gradient(to bottom right, ${worldTheme.primary}, ${worldTheme.secondary}, ${worldTheme.primary})`
      }}
    >
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Create Your Hero
          </h1>
          <p className="text-purple-300">{world?.name} • Step {step} of 4</p>
        </motion.div>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-300">
              {step === 1 && "Character Basics"}
              {step === 2 && "Attributes & Skills"}
              {step === 3 && "Special Things & Backstory"}
              {step === 4 && "Campaign Style & Modules"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div 
                      onClick={() => setShowIconPicker(true)}
                      className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Sparkles className="w-16 h-16" />
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute bottom-0 right-0 rounded-full bg-slate-800 border-purple-500"
                      onClick={() => setShowIconPicker(true)}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <IconPicker
                  currentIcon={selectedIcon}
                  onSelect={(name) => setSelectedIcon(name)}
                  open={showIconPicker}
                  onOpenChange={setShowIconPicker}
                />

                <div>
                  <Label>Character Name</Label>
                  <Input
                    value={character.name}
                    onChange={(e) => setCharacter({...character, name: e.target.value})}
                    placeholder="Enter a legendary name..."
                    className="bg-slate-700/50 border-purple-500/30 text-white"
                  />
                </div>

                <div>
                  <Label>Race/Species</Label>
                  <Input
                    value={character.race}
                    onChange={(e) => setCharacter({...character, race: e.target.value})}
                    placeholder="Elf, Android, Ninja, etc."
                    className="bg-slate-700/50 border-purple-500/30 text-white"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-purple-400"
                    onClick={() => generateAISuggestion(`Suggest an interesting race for a ${world?.genre} ${world?.game_system} campaign`)}
                    disabled={isGenerating}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    AI Suggest Race
                  </Button>
                </div>

                <div>
                  <Label>Class/Role</Label>
                  <Input
                    value={character.class_role}
                    onChange={(e) => setCharacter({...character, class_role: e.target.value})}
                    placeholder="Warrior, Hacker, Shinobi, etc."
                    className="bg-slate-700/50 border-purple-500/30 text-white"
                  />
                </div>

                {aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-purple-300 mb-1">AI Suggestion:</p>
                        <p className="text-sm text-purple-200">{aiSuggestion}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-purple-300">
                    Allocate your attribute points. Remember: skill ranks cannot exceed 10 until Level 11.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-400"
                    onClick={() => generateAISuggestion(`Generate attribute distributions for a ${character.race} ${character.class_role}`, 'attributes')}
                    disabled={isGenerating}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    AI Suggest
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(character.attributes).map((attr) => (
                    <div key={attr}>
                      <Label className="capitalize">{attr}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={character.attributes[attr]}
                        onChange={(e) => setCharacter({
                          ...character,
                          attributes: {
                            ...character.attributes,
                            [attr]: parseInt(e.target.value) || 10
                          }
                        })}
                        className="bg-slate-700/50 border-purple-500/30 text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mt-6">
                  <h3 className="font-semibold mb-3">Starting Resources</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max HP</Label>
                      <Input
                        type="number"
                        value={character.resources.hp_max}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 10;
                          setCharacter({
                            ...character,
                            resources: {
                              ...character.resources,
                              hp_max: val,
                              hp_current: val
                            }
                          });
                        }}
                        className="bg-slate-700/50 border-purple-500/30 text-white"
                      />
                    </div>
                    <div>
                      <Label>Max Mana/Chakra</Label>
                      <Input
                        type="number"
                        value={character.resources.mana_max}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCharacter({
                            ...character,
                            resources: {
                              ...character.resources,
                              mana_max: val,
                              mana_current: val
                            }
                          });
                        }}
                        className="bg-slate-700/50 border-purple-500/30 text-white"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Character Concepts
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-slate-900 border-purple-500/30">
                      <CharacterConceptGenerator
                        character={character}
                        world={world}
                        onSelectConcept={(concept) => {
                          setCharacter({
                            ...character,
                            backstory: concept.backstory
                          });
                          toast.success("Character concept applied!");
                        }}
                      />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Advanced Options
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-900 border-purple-500/30">
                      <AdvancedCharacterCustomization
                        character={character}
                        world={world}
                        onApply={(data) => {
                          setCharacter({...character, ...data});
                          toast.success("Customizations applied!");
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                {world && (
                  <WorldSpecificOptions
                    world={world}
                    onOptionsGenerated={(options) => setWorldSpecificOptions(options)}
                  />
                )}

                {worldSpecificOptions.length > 0 && (
                  <div className="bg-slate-700/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <h4 className="font-semibold text-purple-300 mb-3">
                      {world.name}-Specific Options
                    </h4>
                    <div className="space-y-2">
                      {worldSpecificOptions.map((option, i) => (
                        <div key={i} className="bg-slate-800/50 rounded p-3">
                          <p className="font-semibold text-purple-300 text-sm">{option.name}</p>
                          <p className="text-xs text-purple-400">{option.type}</p>
                          <p className="text-xs text-white mt-1">{option.description}</p>
                          <p className="text-xs text-purple-400 italic mt-1">Requires: {option.requirements}</p>
                          {option.flavor && <p className="text-xs text-purple-300 italic mt-1">"{option.flavor}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Backstory</Label>
                  <Textarea
                    value={character.backstory}
                    onChange={(e) => setCharacter({...character, backstory: e.target.value})}
                    placeholder="Tell your character's story..."
                    className="bg-slate-700/50 border-purple-500/30 text-white h-32"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-purple-400"
                    onClick={() => generateAISuggestion(`Generate a compelling backstory for a ${character.race} ${character.class_role} in a ${world?.genre} world`)}
                    disabled={isGenerating}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    AI Generate Backstory
                  </Button>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Two Special Things
                  </h3>
                  <p className="text-sm text-purple-300 mb-4">
                    Choose two unique traits: each has a powerful advantage AND a significant drawback.
                  </p>
                  
                  {[0, 1].map((index) => (
                    <div key={index} className="mb-4 p-3 bg-slate-700/30 rounded-lg">
                      <Label className="text-sm">Special Thing #{index + 1}</Label>
                      <Input
                        placeholder="Name (e.g., 'Meteorite Heart')"
                        value={character.special_things[index]?.name || ''}
                        onChange={(e) => {
                          const newThings = [...character.special_things];
                          newThings[index] = {...(newThings[index] || {}), name: e.target.value};
                          setCharacter({...character, special_things: newThings});
                        }}
                        className="bg-slate-700/50 border-purple-500/30 text-white mb-2"
                      />
                      <Input
                        placeholder="Advantage (e.g., '+2 to all magic rolls')"
                        value={character.special_things[index]?.boon || ''}
                        onChange={(e) => {
                          const newThings = [...character.special_things];
                          newThings[index] = {...(newThings[index] || {}), boon: e.target.value};
                          setCharacter({...character, special_things: newThings});
                        }}
                        className="bg-slate-700/50 border-purple-500/30 text-white mb-2"
                      />
                      <Input
                        placeholder="Drawback (e.g., 'Vulnerable to cold damage')"
                        value={character.special_things[index]?.flaw || ''}
                        onChange={(e) => {
                          const newThings = [...character.special_things];
                          newThings[index] = {...(newThings[index] || {}), flaw: e.target.value};
                          setCharacter({...character, special_things: newThings});
                        }}
                        className="bg-slate-700/50 border-purple-500/30 text-white"
                      />
                    </div>
                  ))}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-400"
                    onClick={() => generateAISuggestion(`Generate 2 unique 'special things' for a ${character.race} ${character.class_role} - each should have a powerful boon and a meaningful flaw`)}
                    disabled={isGenerating}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    AI Generate Special Things
                  </Button>
                </div>

                {aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-purple-300 mb-1">AI Suggestion:</p>
                        <p className="text-sm text-purple-200 whitespace-pre-wrap">{aiSuggestion}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 mb-4">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Dynamic Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto bg-slate-900 border-purple-500/30">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <CampaignGenerator
                        world={world}
                        onSelectCampaign={(campaign) => {
                          setCampaignSettings({
                            ...campaignSettings,
                            tone: campaign.type,
                            primaryModule: campaign.title
                          });
                          toast.success("Campaign applied!");
                        }}
                      />
                      <DynamicCampaignGenerator world={world} />
                    </div>
                  </DialogContent>
                </Dialog>

                <p className="text-purple-300 text-sm mb-4">
                  Customize your campaign experience by selecting tone and gameplay modules
                </p>

                <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-4 mb-4">
                  <Label htmlFor="mature-campaign" className="text-white cursor-pointer">
                    Mature Content
                  </Label>
                  <Switch
                    id="mature-campaign"
                    checked={campaignSettings.matureMode}
                    onCheckedChange={(checked) => setCampaignSettings({...campaignSettings, matureMode: checked})}
                  />
                </div>

                <div>
                  <Label>Campaign Tone</Label>
                  <select
                    value={campaignSettings.tone}
                    onChange={(e) => setCampaignSettings({...campaignSettings, tone: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-purple-500/30 text-white"
                  >
                    <option value="">Select a tone...</option>
                    <option value="epic_heroic">Epic & Heroic</option>
                    <option value="dark_gritty">Dark & Gritty</option>
                    <option value="comedic_lighthearted">Comedic & Lighthearted</option>
                    <option value="mysterious_noir">Mysterious Noir</option>
                    <option value="horror_survival">Horror & Survival</option>
                    <option value="romantic_drama">Romantic Drama</option>
                    <option value="political_intrigue">Political Intrigue</option>
                    <option value="action_packed">Action-Packed</option>
                    <option value="philosophical">Philosophical</option>
                    <option value="whimsical_fairy_tale">Whimsical Fairy Tale</option>
                    <option value="cyberpunk_dystopian">Cyberpunk Dystopian</option>
                    <option value="post_apocalyptic">Post-Apocalyptic</option>
                    <option value="cosmic_horror">Cosmic Horror</option>
                    <option value="slice_of_life">Slice of Life</option>
                    <option value="military_tactical">Military Tactical</option>
                  </select>
                </div>

                <div>
                  <Label>Primary Module</Label>
                  <select
                    value={campaignSettings.primaryModule}
                    onChange={(e) => setCampaignSettings({...campaignSettings, primaryModule: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-purple-500/30 text-white"
                  >
                    <option value="">Select primary module...</option>
                    <option value="dungeon_crawl">Dungeon Crawl</option>
                    <option value="open_world_sandbox">Open World Sandbox</option>
                    <option value="narrative_story">Narrative Story</option>
                    <option value="mystery_investigation">Mystery Investigation</option>
                    <option value="combat_focused">Combat Focused</option>
                    <option value="roleplay_social">Roleplay & Social</option>
                    <option value="exploration_discovery">Exploration & Discovery</option>
                    <option value="survival_crafting">Survival & Crafting</option>
                    <option value="heist_stealth">Heist & Stealth</option>
                    <option value="kingdom_management">Kingdom Management</option>
                    <option value="guild_operations">Guild Operations</option>
                    <option value="time_travel">Time Travel</option>
                    <option value="multiverse_hopping">Multiverse Hopping</option>
                    <option value="monster_hunting">Monster Hunting</option>
                    <option value="tournament_arena">Tournament Arena</option>
                  </select>
                </div>

                <div>
                  <Label>Secondary Module (Optional)</Label>
                  <select
                    value={campaignSettings.secondaryModule}
                    onChange={(e) => setCampaignSettings({...campaignSettings, secondaryModule: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-purple-500/30 text-white"
                  >
                    <option value="">None</option>
                    <option value="romance_relationships">Romance & Relationships</option>
                    <option value="base_building">Base Building</option>
                    <option value="crafting_economy">Crafting & Economy</option>
                    <option value="faction_reputation">Faction Reputation</option>
                    <option value="pet_companion">Pet/Companion System</option>
                    <option value="magic_research">Magic Research</option>
                    <option value="political_maneuvering">Political Maneuvering</option>
                    <option value="naval_exploration">Naval Exploration</option>
                    <option value="aerial_combat">Aerial Combat</option>
                    <option value="urban_development">Urban Development</option>
                    <option value="mystery_puzzles">Mystery Puzzles</option>
                    <option value="resource_management">Resource Management</option>
                    <option value="moral_choices">Moral Choices</option>
                    <option value="generational_saga">Generational Saga</option>
                    <option value="prophecy_destiny">Prophecy & Destiny</option>
                  </select>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Your Campaign Style
                  </h4>
                  <p className="text-sm text-purple-200">
                    {campaignSettings.tone && campaignSettings.primaryModule ? (
                      <>A <span className="text-purple-400 font-semibold">{campaignSettings.tone}</span> adventure 
                      focused on <span className="text-purple-400 font-semibold">{campaignSettings.primaryModule}</span>
                      {campaignSettings.secondaryModule && (
                        <> with elements of <span className="text-purple-400 font-semibold">{campaignSettings.secondaryModule}</span></>
                      )}.</>
                    ) : (
                      "Select your preferences above to see your campaign style"
                    )}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-purple-500/30">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-900/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              <div className="ml-auto">
                {step < 4 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={createCharacterMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Begin Adventure
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}