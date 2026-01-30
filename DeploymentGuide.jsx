import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Package, Code, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function DeploymentGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-purple-300 mb-4">Deployment Options</h1>
          <p className="text-xl text-slate-400">Choose your platform: Web Appliance or Foundry VTT</p>
        </div>

        <Tabs defaultValue="appliance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 mb-8">
            <TabsTrigger value="appliance" className="text-lg">
              <Globe className="w-5 h-5 mr-2" />
              Base44 Web Appliance
            </TabsTrigger>
            <TabsTrigger value="foundry" className="text-lg">
              <Package className="w-5 h-5 mr-2" />
              Foundry VTT Module
            </TabsTrigger>
          </TabsList>

          {/* BASE44 WEB APPLIANCE */}
          <TabsContent value="appliance" className="space-y-6">
            <Card className="bg-slate-800/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-300 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  Current Platform: Base44 Web Appliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  This is a <span className="font-bold text-green-400">standalone web application</span> that runs entirely in your browser. 
                  No installation required, accessible from any device.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-green-500/20">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      What's Included
                    </h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• World Hub (multi-universe support)</li>
                      <li>• Universal Character Builder</li>
                      <li>• AI Game Master with context</li>
                      <li>• Campaign save/load system</li>
                      <li>• Rulebook integration wizard</li>
                      <li>• AI-powered content generation</li>
                      <li>• Cross-system character conversion</li>
                    </ul>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4 border border-blue-500/20">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4 text-blue-400" />
                      Technical Details
                    </h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• React + Tailwind CSS frontend</li>
                      <li>• Base44 backend-as-a-service</li>
                      <li>• Cloud storage for rulebooks</li>
                      <li>• Real-time data sync</li>
                      <li>• External file references (no size limit)</li>
                      <li>• OpenAI LLM integration</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-300 mb-2">Access Your Appliance</h4>
                  <p className="text-sm text-slate-300 mb-3">
                    This application is live and accessible at your Base44 deployment URL. Share the link with players for multiplayer campaigns.
                  </p>
                  <div className="flex gap-2">
                    <Link to="/WorldHub">
                      <Button className="bg-purple-600 hover:bg-purple-700">Launch World Hub</Button>
                    </Link>
                    <Link to="/UniversalCharacterBuilder">
                      <Button variant="outline">Character Builder</Button>
                    </Link>
                  </div>
                </div>

                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-300 mb-2">Limitations</h4>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• No native VTT features (maps, tokens, measurements)</li>
                    <li>• No real-time audio/video</li>
                    <li>• Web-based only (no desktop client)</li>
                    <li>• Vector store requires backend functions upgrade</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FOUNDRY VTT MODULE */}
          <TabsContent value="foundry" className="space-y-6">
            <Card className="bg-slate-800/50 border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-orange-300 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Foundry VTT Module (Specification)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  This is a <span className="font-bold text-orange-400">module specification</span> for Foundry VTT. 
                  Requires installation into Foundry VTT server and JavaScript/Handlebars development.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-orange-500/20">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-400" />
                      Module Features
                    </h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Everweave-style world hub UI</li>
                      <li>• Multi-system character sheets</li>
                      <li>• AI GM integration (via API)</li>
                      <li>• Compendium-based content library</li>
                      <li>• Save/load campaign snapshots</li>
                      <li>• VTT token/map integration</li>
                      <li>• Real-time multiplayer sync</li>
                    </ul>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4 border border-blue-500/20">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4 text-blue-400" />
                      Technical Stack
                    </h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Foundry VTT 11+ module</li>
                      <li>• JavaScript + Handlebars</li>
                      <li>• Custom game system or universal</li>
                      <li>• Compendium packs (JSON)</li>
                      <li>• Socket integration for multiplayer</li>
                      <li>• OpenAI API or local LLM</li>
                    </ul>
                  </div>
                </div>

                <Card className="bg-slate-700/30 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm text-purple-300">Module Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-slate-300 font-mono bg-slate-900/50 p-3 rounded overflow-x-auto">
{`multiverse-emulator/
├── module.json
├── scripts/
│   ├── main.js
│   ├── world-hub.js
│   ├── character-builder.js
│   ├── ai-gm.js
│   └── save-manager.js
├── templates/
│   ├── world-hub.hbs
│   ├── character-sheet.hbs
│   └── campaign-recap.hbs
├── styles/
│   └── emulator.css
├── packs/
│   ├── worlds.db
│   ├── characters.db
│   └── rulebooks.db
└── lang/
    └── en.json`}
                    </pre>
                  </CardContent>
                </Card>

                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-red-300 mb-2">Important Note</h4>
                  <p className="text-sm text-slate-300">
                    <strong>Foundry VTT modules cannot be built in Base44.</strong> This platform creates web apps, not Foundry modules. 
                    You would need to develop the Foundry module separately using JavaScript and the Foundry VTT API.
                  </p>
                </div>

                <Card className="bg-slate-700/30 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm text-green-300">Implementation Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h5 className="text-xs font-semibold text-slate-400 mb-1">1. Core Module Setup</h5>
                      <p className="text-xs text-slate-300">Create module.json with dependencies, hooks, and compendium definitions</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-400 mb-1">2. World Hub UI</h5>
                      <p className="text-xs text-slate-300">Custom Handlebars template with world cards, background music, and launch buttons</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-400 mb-1">3. Character Builder</h5>
                      <p className="text-xs text-slate-300">Step-by-step form that reads compendium data for races/classes/abilities</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-400 mb-1">4. AI Integration</h5>
                      <p className="text-xs text-slate-300">API calls to OpenAI or local LLM with context from world/character data</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-400 mb-1">5. Save System</h5>
                      <p className="text-xs text-slate-300">Store campaign snapshots in world flags or journal entries for resume/rollback</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-300 mb-2">Development Resources</h4>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• <a href="https://foundryvtt.com/api/" target="_blank" className="text-blue-400 hover:underline">Foundry VTT API Documentation</a></li>
                    <li>• <a href="https://foundryvtt.wiki/" target="_blank" className="text-blue-400 hover:underline">Foundry Community Wiki</a></li>
                    <li>• Your uploaded specs: Living Biosphere Rulebook, Agent Prompts</li>
                    <li>• Reference module: Monarch (multi-system framework)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-slate-800/50 border-slate-600 mt-8">
          <CardHeader>
            <CardTitle className="text-slate-300">Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left p-2 text-slate-400">Feature</th>
                    <th className="text-center p-2 text-slate-400">Base44 Appliance</th>
                    <th className="text-center p-2 text-slate-400">Foundry VTT</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-700">
                    <td className="p-2">Installation</td>
                    <td className="text-center p-2">✅ None (web-based)</td>
                    <td className="text-center p-2">⚠️ Requires Foundry server</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-2">Multi-system support</td>
                    <td className="text-center p-2">✅ Built-in</td>
                    <td className="text-center p-2">✅ Via compendiums</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-2">AI Game Master</td>
                    <td className="text-center p-2">✅ Integrated</td>
                    <td className="text-center p-2">⚠️ API integration needed</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-2">VTT features (maps/tokens)</td>
                    <td className="text-center p-2">❌ Theatre-of-mind only</td>
                    <td className="text-center p-2">✅ Full VTT suite</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-2">Real-time audio/video</td>
                    <td className="text-center p-2">❌ Not included</td>
                    <td className="text-center p-2">✅ Native support</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-2">Large rulebook handling</td>
                    <td className="text-center p-2">✅ External URLs (512MB)</td>
                    <td className="text-center p-2">✅ Local file system</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-2">Development complexity</td>
                    <td className="text-center p-2">✅ Already built</td>
                    <td className="text-center p-2">⚠️ Requires JS development</td>
                  </tr>
                  <tr>
                    <td className="p-2">Best for</td>
                    <td className="text-center p-2">Solo/light groups, any device</td>
                    <td className="text-center p-2">Tactical gameplay, traditional VTT</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}