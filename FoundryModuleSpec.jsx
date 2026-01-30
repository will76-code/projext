import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Download, Code, Zap } from "lucide-react";

export default function FoundryModuleSpec() {
  const downloadSpec = () => {
    const spec = `
FOUNDRY VTT MODULE SPECIFICATION
Multiverse Quest Integration v1.0
===================================

## MODULE OVERVIEW
This module provides bidirectional integration between Multiverse Quest (Base44 web app) and Foundry VTT, enabling:
- Importing AI-generated campaigns into Foundry Journal Entries
- Dynamically populating character sheets from rulebook data
- System-agnostic dice automation based on imported game mechanics

## ARCHITECTURE

### 1. Campaign Export System
**Endpoint**: POST /api/foundry/export-campaign
**Purpose**: Export AI-generated campaigns from FullCampaignGenerator to Foundry

**Campaign Data Structure**:
{
  "title": "Campaign Name",
  "premise": "Campaign description",
  "acts": [
    {
      "act_number": 1,
      "title": "Act Title",
      "description": "Act description",
      "key_events": ["Event 1", "Event 2"]
    }
  ],
  "npcs": [
    {
      "name": "NPC Name",
      "role": "Ally/Villain/Neutral",
      "description": "NPC backstory",
      "stats": {...}
    }
  ],
  "locations": [...],
  "plot_twists": [...],
  "adventure_seeds": [...]
}

**Foundry Integration**:
- Create parent Journal Entry for campaign
- Create child entries for each Act
- Create Actor entries for major NPCs
- Store world/rulebook metadata in flags

**Implementation**:
\`\`\`javascript
async function exportCampaignToFoundry(campaignData) {
  // Create main journal entry
  const mainJournal = await JournalEntry.create({
    name: campaignData.title,
    content: \`<h1>\${campaignData.title}</h1>
              <p>\${campaignData.premise}</p>\`,
    flags: {
      'multiverse-quest': {
        campaignId: campaignData.id,
        worldId: campaignData.world_id
      }
    }
  });

  // Create act entries
  for (const act of campaignData.acts) {
    await JournalEntry.create({
      name: \`Act \${act.act_number}: \${act.title}\`,
      content: \`<h2>\${act.title}</h2>
                <p>\${act.description}</p>
                <h3>Key Events</h3>
                <ul>\${act.key_events.map(e => \`<li>\${e}</li>\`).join('')}</ul>\`,
      folder: mainJournal.id
    });
  }

  // Create NPC actors
  for (const npc of campaignData.npcs) {
    await Actor.create({
      name: npc.name,
      type: 'npc',
      data: npc.stats,
      flags: {
        'multiverse-quest': {
          role: npc.role,
          description: npc.description
        }
      }
    });
  }
}
\`\`\`

### 2. Character Sheet Population
**Endpoint**: POST /api/foundry/populate-character
**Purpose**: Dynamically fill character sheets using rulebook data from compendiums

**Data Flow**:
1. User selects race, class, level from Multiverse Quest
2. Module queries local compendium packs for matching data
3. Populates character sheet with abilities, features, stats

**Compendium Structure**:
{
  "races": [
    {
      "name": "Elf",
      "abilities": ["Darkvision", "Fey Ancestry"],
      "attribute_bonuses": {"DEX": 2},
      "speed": 30
    }
  ],
  "classes": [
    {
      "name": "Wizard",
      "hit_die": "d6",
      "proficiencies": ["Intelligence", "Wisdom"],
      "features_by_level": {
        "1": ["Spellcasting", "Arcane Recovery"]
      }
    }
  ]
}

**Implementation**:
\`\`\`javascript
async function populateCharacterSheet(characterData) {
  const compendium = game.packs.get('multiverse-quest.rulebook-data');
  
  // Load race data
  const raceData = await compendium.getDocument(characterData.race);
  
  // Apply race bonuses
  const actorData = {
    data: {
      attributes: {
        movement: { walk: raceData.data.speed }
      },
      abilities: {}
    }
  };
  
  for (const [stat, bonus] of Object.entries(raceData.data.attribute_bonuses)) {
    actorData.data.abilities[stat.toLowerCase()] = {
      value: (characterData.attributes[stat] || 10) + bonus
    };
  }
  
  // Add racial features
  for (const ability of raceData.data.abilities) {
    await Item.create({
      name: ability.name,
      type: 'feat',
      data: { description: { value: ability.description } }
    });
  }
  
  // Load class data
  const classData = await compendium.getDocument(characterData.class);
  const level = characterData.level || 1;
  
  // Add class features for current level
  for (let lvl = 1; lvl <= level; lvl++) {
    const features = classData.data.features_by_level[lvl.toString()] || [];
    for (const feature of features) {
      await Item.create({
        name: feature.name,
        type: 'feat',
        data: { description: { value: feature.description } }
      });
    }
  }
  
  return Actor.create(actorData);
}
\`\`\`

### 3. System-Agnostic Dice Automation
**Endpoint**: GET /api/foundry/dice-macros
**Purpose**: Generate dice roll macros from imported rulebook mechanics

**Supported Mechanics**:
- Skill checks (d20 + modifier vs DC)
- Damage rolls (variable dice + modifiers)
- Saving throws
- Initiative
- Custom formulas from rulebook

**Macro Generation**:
\`\`\`javascript
function generateDiceMacro(mechanicData) {
  const { name, formula, modifiers, dc } = mechanicData;
  
  return \`
    async function \${name.replace(/\s/g, '')}() {
      const roll = new Roll('\${formula}');
      await roll.roll({ async: true });
      
      let flavor = '<h2>\${name}</h2>';
      if (\${dc}) {
        const success = roll.total >= \${dc};
        flavor += \`<p style="color: \${success ? 'green' : 'red'}">
          \${success ? 'Success!' : 'Failure'} (DC \${dc})
        </p>\`;
      }
      
      roll.toMessage({ flavor });
    }
    
    \${name.replace(/\s/g, '')}();
  \`;
}

// Example: Generate skill check macro
const skillCheckMacro = generateDiceMacro({
  name: "Perception Check",
  formula: "1d20 + @skills.perception",
  dc: 15
});

Macro.create({
  name: "Perception Check",
  type: "script",
  command: skillCheckMacro
});
\`\`\`

**Rulebook Mechanics Parsing**:
\`\`\`javascript
function parseRulebookMechanics(rulebook) {
  const macros = [];
  
  // Parse dice system
  const diceSystem = rulebook.game_mechanics.dice_system;
  if (diceSystem.includes('d20')) {
    macros.push({
      name: "Generic Skill Check",
      formula: "1d20 + @abilities.mod",
      type: "skill"
    });
  }
  
  // Parse combat mechanics
  if (rulebook.detailed_mechanics.combat_rules) {
    const combat = rulebook.detailed_mechanics.combat_rules;
    
    if (combat.attack_resolution) {
      macros.push({
        name: "Attack Roll",
        formula: "1d20 + @attributes.attackBonus",
        type: "attack"
      });
    }
    
    if (combat.damage_system) {
      // Extract dice formula from damage_system string
      const damageMatch = combat.damage_system.match(/(\d+d\d+)/);
      if (damageMatch) {
        macros.push({
          name: "Weapon Damage",
          formula: damageMatch[1] + " + @abilities.str.mod",
          type: "damage"
        });
      }
    }
  }
  
  // Parse magic system
  if (rulebook.detailed_mechanics.magic_system) {
    macros.push({
      name: "Spell Attack",
      formula: "1d20 + @attributes.spellAttack",
      type: "spell"
    });
  }
  
  return macros;
}
\`\`\`

## MODULE INSTALLATION

### File Structure:
\`\`\`
multiverse-quest/
├── module.json
├── scripts/
│   ├── main.js
│   ├── campaign-import.js
│   ├── character-populate.js
│   └── dice-automation.js
├── packs/
│   └── rulebook-data.db
├── styles/
│   └── module.css
└── lang/
    └── en.json
\`\`\`

### module.json:
\`\`\`json
{
  "name": "multiverse-quest",
  "title": "Multiverse Quest Integration",
  "description": "Import campaigns, characters, and mechanics from Multiverse Quest",
  "version": "1.0.0",
  "minimumCoreVersion": "10",
  "compatibleCoreVersion": "11",
  "author": "Multiverse Quest",
  "esmodules": ["scripts/main.js"],
  "styles": ["styles/module.css"],
  "packs": [
    {
      "name": "rulebook-data",
      "label": "Rulebook Data",
      "path": "packs/rulebook-data.db",
      "type": "Item"
    }
  ],
  "url": "https://multiversequest.com",
  "manifest": "https://multiversequest.com/foundry/module.json",
  "download": "https://multiversequest.com/foundry/multiverse-quest.zip"
}
\`\`\`

### API Integration:
\`\`\`javascript
// Connect to Multiverse Quest API
class MultiverseQuestAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.multiversequest.com';
  }
  
  async getCampaign(campaignId) {
    const response = await fetch(\`\${this.baseUrl}/campaigns/\${campaignId}\`, {
      headers: { 'Authorization': \`Bearer \${this.apiKey}\` }
    });
    return response.json();
  }
  
  async getRulebook(rulebookId) {
    const response = await fetch(\`\${this.baseUrl}/rulebooks/\${rulebookId}\`, {
      headers: { 'Authorization': \`Bearer \${this.apiKey}\` }
    });
    return response.json();
  }
  
  async getCharacter(characterId) {
    const response = await fetch(\`\${this.baseUrl}/characters/\${characterId}\`, {
      headers: { 'Authorization': \`Bearer \${this.apiKey}\` }
    });
    return response.json();
  }
}

// Initialize in main.js
Hooks.once('ready', () => {
  game.multiverseQuest = new MultiverseQuestAPI(
    game.settings.get('multiverse-quest', 'apiKey')
  );
});
\`\`\`

## USAGE EXAMPLES

### Import Campaign:
1. User generates campaign in Multiverse Quest
2. Clicks "Export to Foundry VTT"
3. Copies campaign ID or uses direct import
4. In Foundry: Tools → Multiverse Quest → Import Campaign
5. Paste campaign ID → Import
6. Campaign appears as journal entries with actors

### Populate Character:
1. Create new actor in Foundry
2. Open character sheet
3. Click "Import from Multiverse Quest"
4. Select character from dropdown
5. Character sheet auto-populates with race, class, abilities

### Use Dice Macros:
1. Import rulebook data into compendium
2. Foundry auto-generates macros based on mechanics
3. Macros appear in hotbar
4. Click to roll with proper modifiers

## DOWNLOAD MODULE
Module package includes all files and installation instructions.
`;

    const blob = new Blob([spec], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'foundry-module-spec.txt';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-300 mb-2">Foundry VTT Module Specification</h1>
          <p className="text-slate-400">Complete integration guide for Multiverse Quest ↔ Foundry VTT</p>
        </div>

        <Card className="bg-slate-800/50 border-purple-500/30 mb-6">
          <CardHeader>
            <CardTitle className="text-purple-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Module Overview
              </span>
              <Button onClick={downloadSpec} className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Download className="w-4 h-4 mr-2" />
                Download Full Spec
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300">
              This module enables seamless integration between your Multiverse Quest campaigns and Foundry VTT, providing:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/30 rounded p-4">
                <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                <h3 className="font-semibold text-white mb-1">Campaign Export</h3>
                <p className="text-xs text-slate-400">Import AI-generated campaigns directly into Foundry Journal Entries and Actors</p>
              </div>
              <div className="bg-slate-700/30 rounded p-4">
                <Code className="w-8 h-8 text-green-500 mb-2" />
                <h3 className="font-semibold text-white mb-1">Character Sheets</h3>
                <p className="text-xs text-slate-400">Auto-populate character sheets from rulebook data stored in compendiums</p>
              </div>
              <div className="bg-slate-700/30 rounded p-4">
                <Zap className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="font-semibold text-white mb-1">Dice Automation</h3>
                <p className="text-xs text-slate-400">System-agnostic macros generated from imported game mechanics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="campaign" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="campaign">Campaign Export</TabsTrigger>
            <TabsTrigger value="character">Character Sheets</TabsTrigger>
            <TabsTrigger value="dice">Dice Macros</TabsTrigger>
          </TabsList>

          <TabsContent value="campaign" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Campaign Data Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-900 rounded p-3 text-xs text-green-400 overflow-x-auto">
{`{
  "title": "The Shadow Conspiracy",
  "premise": "A dark plot threatens the city...",
  "acts": [
    {
      "act_number": 1,
      "title": "Discovery",
      "key_events": ["Find the clue", "Meet informant"]
    }
  ],
  "npcs": [...],
  "locations": [...]
}`}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Foundry Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-400">
                <p>✓ Creates parent Journal Entry for campaign</p>
                <p>✓ Creates child entries for each Act with key events</p>
                <p>✓ Generates Actor entries for major NPCs with stats</p>
                <p>✓ Stores metadata in flags for bidirectional sync</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="character" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Compendium Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-900 rounded p-3 text-xs text-green-400 overflow-x-auto">
{`{
  "races": [
    {
      "name": "Elf",
      "abilities": ["Darkvision", "Fey Ancestry"],
      "attribute_bonuses": {"DEX": 2},
      "speed": 30
    }
  ],
  "classes": [
    {
      "name": "Wizard",
      "hit_die": "d6",
      "features_by_level": {
        "1": ["Spellcasting", "Arcane Recovery"]
      }
    }
  ]
}`}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Population Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-400">
                <p>1. Query compendium for race/class data</p>
                <p>2. Apply attribute bonuses from race</p>
                <p>3. Add racial features as items</p>
                <p>4. Add class features for each level</p>
                <p>5. Calculate derived stats (HP, AC, etc.)</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dice" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Macro Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-900 rounded p-3 text-xs text-green-400 overflow-x-auto">
{`// Auto-generated from rulebook
const roll = new Roll('1d20 + @skills.perception');
await roll.roll({ async: true });

const success = roll.total >= 15;
roll.toMessage({
  flavor: \`Perception Check (DC 15)
           \${success ? 'Success!' : 'Failure'}\`
});`}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Supported Mechanics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-xs">
                <Badge className="justify-center">Skill Checks</Badge>
                <Badge className="justify-center">Attack Rolls</Badge>
                <Badge className="justify-center">Damage Rolls</Badge>
                <Badge className="justify-center">Saving Throws</Badge>
                <Badge className="justify-center">Initiative</Badge>
                <Badge className="justify-center">Custom Formulas</Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 mt-6">
          <CardContent className="py-6 text-center">
            <p className="text-slate-300 mb-4">Ready to integrate with Foundry VTT?</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={downloadSpec} className="bg-purple-600 hover:bg-purple-700">
                <Download className="w-4 h-4 mr-2" />
                Download Full Specification
              </Button>
              <Button variant="outline" className="border-purple-500/50">
                View Installation Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}