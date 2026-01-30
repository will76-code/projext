import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileJson, Zap } from "lucide-react";
import { toast } from "sonner";

export default function FoundryExportTool({ campaign, rulebooks }) {
  const exportToFoundry = () => {
    const foundryData = {
      module_version: "1.0.0",
      campaign: {
        id: campaign.id,
        title: campaign.title,
        premise: campaign.story_summary,
        acts: campaign.acts || [],
        npcs: campaign.npcs?.map(npc => ({
          name: npc.name,
          type: "npc",
          data: {
            biography: npc.description || npc.role,
            relationship: npc.relationship,
            motivation: npc.motivation
          }
        })) || [],
        locations: campaign.locations || [],
        plot_twists: campaign.plot_twists || [],
        adventure_seeds: campaign.adventure_seeds || []
      },
      rulebooks: rulebooks?.map(rb => ({
        title: rb.title,
        system: rb.game_system,
        mechanics: rb.game_mechanics,
        detailed_mechanics: rb.detailed_mechanics
      })) || [],
      dice_macros: generateDiceMacros(rulebooks || []),
      character_templates: generateCharacterTemplates(rulebooks || [])
    };

    const jsonStr = JSON.stringify(foundryData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foundry-${campaign.title.replace(/\s/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Campaign exported for Foundry VTT!");
  };

  const generateDiceMacros = (rulebooks) => {
    const macros = [];
    
    rulebooks.forEach(rb => {
      if (!rb.detailed_mechanics) return;

      // Combat macros
      if (rb.detailed_mechanics.combat_rules) {
        macros.push({
          name: "Attack Roll",
          type: "script",
          formula: "1d20 + @attributes.attackBonus",
          command: `
const roll = new Roll('1d20 + @attributes.attackBonus', actor.getRollData());
await roll.roll({ async: true });
roll.toMessage({ 
  speaker: ChatMessage.getSpeaker({ actor }),
  flavor: "Attack Roll"
});`
        });

        macros.push({
          name: "Damage Roll",
          type: "script",
          formula: "1d8 + @abilities.str.mod",
          command: `
const roll = new Roll('1d8 + @abilities.str.mod', actor.getRollData());
await roll.roll({ async: true });
roll.toMessage({ 
  speaker: ChatMessage.getSpeaker({ actor }),
  flavor: "Damage"
});`
        });
      }

      // Skill check macros
      if (rb.detailed_mechanics.skill_check_system) {
        macros.push({
          name: "Skill Check",
          type: "script",
          formula: "1d20 + @skills.value",
          command: `
const skillName = await new Promise(resolve => {
  new Dialog({
    title: "Select Skill",
    content: '<select id="skill"><option>Perception</option><option>Stealth</option><option>Persuasion</option></select>',
    buttons: {
      ok: { label: "Roll", callback: (html) => resolve(html.find('#skill').val()) }
    }
  }).render(true);
});

const roll = new Roll('1d20 + @skills.' + skillName.toLowerCase(), actor.getRollData());
await roll.roll({ async: true });
roll.toMessage({ 
  speaker: ChatMessage.getSpeaker({ actor }),
  flavor: skillName + " Check"
});`
        });
      }

      // Magic system macros
      if (rb.detailed_mechanics.magic_system) {
        macros.push({
          name: "Spell Attack",
          type: "script",
          formula: "1d20 + @attributes.spellAttack",
          command: `
const roll = new Roll('1d20 + @attributes.spellAttack', actor.getRollData());
await roll.roll({ async: true });
roll.toMessage({ 
  speaker: ChatMessage.getSpeaker({ actor }),
  flavor: "Spell Attack"
});`
        });
      }
    });

    return macros;
  };

  const generateCharacterTemplates = (rulebooks) => {
    const templates = [];

    rulebooks.forEach(rb => {
      if (!rb.character_options) return;

      const races = rb.character_options.races || [];
      const classes = rb.character_options.classes || [];

      templates.push({
        system: rb.game_system,
        races: races.map(race => ({
          name: race,
          type: "race",
          data: {
            description: `${race} from ${rb.title}`,
            source: rb.title
          }
        })),
        classes: classes.map(cls => ({
          name: cls,
          type: "class",
          data: {
            description: `${cls} from ${rb.title}`,
            source: rb.title
          }
        }))
      });
    });

    return templates;
  };

  return (
    <Card className="bg-slate-800/50 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-blue-300 flex items-center gap-2">
          <FileJson className="w-5 h-5" />
          Foundry VTT Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-700/30 rounded p-4 space-y-2">
          <p className="text-sm text-slate-300 mb-3">Export includes:</p>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="justify-center">Campaign Outline</Badge>
            <Badge variant="outline" className="justify-center">NPC Actors</Badge>
            <Badge variant="outline" className="justify-center">Dice Macros</Badge>
            <Badge variant="outline" className="justify-center">Character Templates</Badge>
            <Badge variant="outline" className="justify-center">Plot Hooks</Badge>
            <Badge variant="outline" className="justify-center">Locations</Badge>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
          <p className="text-xs text-blue-300 mb-2">
            <Zap className="w-4 h-4 inline mr-1" />
            System-Agnostic Macros
          </p>
          <p className="text-xs text-slate-400">
            Macros are generated from rulebook mechanics and work across game systems
          </p>
        </div>

        <Button
          onClick={exportToFoundry}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to Foundry VTT
        </Button>

        <p className="text-xs text-slate-400 text-center">
          Import this JSON file using the Multiverse Quest Foundry module
        </p>
      </CardContent>
    </Card>
  );
}