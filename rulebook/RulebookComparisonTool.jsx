import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GitCompare, ArrowRight, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function RulebookComparisonTool({ rulebooks }) {
  const [book1Id, setBook1Id] = useState("");
  const [book2Id, setBook2Id] = useState("");
  const [comparison, setComparison] = useState(null);

  const compareRulebooks = () => {
    if (!book1Id || !book2Id) {
      toast.error("Please select two rulebooks to compare");
      return;
    }

    const book1 = rulebooks.find(r => r.id === book1Id);
    const book2 = rulebooks.find(r => r.id === book2Id);

    if (!book1 || !book2) return;

    const result = {
      book1: book1.title,
      book2: book2.title,
      sections: []
    };

    // Compare character options
    const races1 = book1.character_options?.races || [];
    const races2 = book2.character_options?.races || [];
    result.sections.push({
      name: "Races",
      only_in_1: races1.filter(r => !races2.includes(r)),
      only_in_2: races2.filter(r => !races1.includes(r)),
      in_both: races1.filter(r => races2.includes(r))
    });

    const classes1 = book1.character_options?.classes || [];
    const classes2 = book2.character_options?.classes || [];
    result.sections.push({
      name: "Classes",
      only_in_1: classes1.filter(c => !classes2.includes(c)),
      only_in_2: classes2.filter(c => !classes1.includes(c)),
      in_both: classes1.filter(c => classes2.includes(c))
    });

    // Compare NPCs
    const npcs1 = book1.npcs?.map(n => n.name) || [];
    const npcs2 = book2.npcs?.map(n => n.name) || [];
    result.sections.push({
      name: "NPCs",
      only_in_1: npcs1.filter(n => !npcs2.includes(n)),
      only_in_2: npcs2.filter(n => !npcs1.includes(n)),
      in_both: npcs1.filter(n => npcs2.includes(n))
    });

    // Compare locations
    const locs1 = book1.locations?.map(l => l.name) || [];
    const locs2 = book2.locations?.map(l => l.name) || [];
    result.sections.push({
      name: "Locations",
      only_in_1: locs1.filter(l => !locs2.includes(l)),
      only_in_2: locs2.filter(l => !locs1.includes(l)),
      in_both: locs1.filter(l => locs2.includes(l))
    });

    // Compare mechanics
    const mechs1 = Object.keys(book1.game_mechanics || {});
    const mechs2 = Object.keys(book2.game_mechanics || {});
    result.sections.push({
      name: "Game Mechanics",
      only_in_1: mechs1.filter(m => !mechs2.includes(m)),
      only_in_2: mechs2.filter(m => !mechs1.includes(m)),
      in_both: mechs1.filter(m => mechs2.includes(m))
    });

    setComparison(result);
  };

  return (
    <Card className="bg-slate-800/50 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="text-cyan-300 flex items-center gap-2">
          <GitCompare className="w-5 h-5" />
          Rulebook Comparison Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">First Rulebook</label>
            <Select value={book1Id} onValueChange={setBook1Id}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {rulebooks?.filter(r => r.content_extracted).map(book => (
                  <SelectItem key={book.id} value={book.id}>{book.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Second Rulebook</label>
            <Select value={book2Id} onValueChange={setBook2Id}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {rulebooks?.filter(r => r.content_extracted && r.id !== book1Id).map(book => (
                  <SelectItem key={book.id} value={book.id}>{book.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={compareRulebooks} disabled={!book1Id || !book2Id} className="w-full bg-cyan-600 hover:bg-cyan-700">
          <GitCompare className="w-4 h-4 mr-2" />
          Compare Rulebooks
        </Button>

        {comparison && (
          <div className="space-y-3 mt-4">
            <div className="bg-slate-700/30 rounded p-3 flex items-center justify-between">
              <span className="text-sm text-white">{comparison.book1}</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-white">{comparison.book2}</span>
            </div>

            {comparison.sections.map((section, i) => (
              <Card key={i} className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">{section.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {section.in_both.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-400 flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3 h-3" />
                        In Both ({section.in_both.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {section.in_both.slice(0, 10).map((item, j) => (
                          <Badge key={j} className="bg-green-600/20 text-green-300 text-xs">{item}</Badge>
                        ))}
                        {section.in_both.length > 10 && (
                          <Badge className="bg-green-600/20 text-green-300 text-xs">+{section.in_both.length - 10} more</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {section.only_in_1.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-blue-400 flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3 h-3" />
                        Only in {comparison.book1} ({section.only_in_1.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {section.only_in_1.slice(0, 10).map((item, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{item}</Badge>
                        ))}
                        {section.only_in_1.length > 10 && (
                          <Badge variant="outline" className="text-xs">+{section.only_in_1.length - 10} more</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {section.only_in_2.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-purple-400 flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3 h-3" />
                        Only in {comparison.book2} ({section.only_in_2.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {section.only_in_2.slice(0, 10).map((item, j) => (
                          <Badge key={j} variant="outline" className="text-xs border-purple-500/30">{item}</Badge>
                        ))}
                        {section.only_in_2.length > 10 && (
                          <Badge variant="outline" className="text-xs">+{section.only_in_2.length - 10} more</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {section.in_both.length === 0 && section.only_in_1.length === 0 && section.only_in_2.length === 0 && (
                    <p className="text-xs text-slate-500">No {section.name.toLowerCase()} found in either book</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}