import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Sparkles, AlertCircle, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function VectorStoreSetup() {
  const [backendEnabled, setBackendEnabled] = useState(false);

  return (
    <Card className="bg-slate-800/50 border-indigo-500/30">
      <CardHeader>
        <CardTitle className="text-indigo-300 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Vector Store Setup (Semantic Search)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded p-4">
          <p className="text-sm text-indigo-300 mb-2">
            <strong>What is a Vector Store?</strong>
          </p>
          <p className="text-xs text-slate-300 mb-3">
            A vector store enables AI to search your rulebooks by meaning, not just keywords. 
            Ask "How do I cast spells?" and it finds the exact Magic System section across all books.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
              <p className="text-green-400 font-semibold mb-1">With Vector Store:</p>
              <p className="text-slate-400">Finds exact sections, page refs, cross-references multiple books</p>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 rounded p-2">
              <p className="text-red-400 font-semibold mb-1">Without:</p>
              <p className="text-slate-400">AI guesses based on general knowledge only</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              backendEnabled ? 'bg-green-600' : 'bg-slate-600'
            }`}>
              {backendEnabled ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Enable Backend Functions</p>
              <p className="text-xs text-slate-400 mb-2">
                Required for server-side vector store integration
              </p>
              {!backendEnabled && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    window.open('https://docs.base44.com/backend-functions', '_blank');
                    toast.info("Check Dashboard → Settings → Backend Functions");
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  How to Enable
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Choose Provider</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-slate-700/30 rounded p-2 border border-green-500/30">
                  <p className="text-xs font-semibold text-green-400">OpenAI Assistants</p>
                  <p className="text-xs text-slate-400">Easiest, managed</p>
                  <Badge className="text-xs mt-1 bg-green-600">Recommended</Badge>
                </div>
                <div className="bg-slate-700/30 rounded p-2">
                  <p className="text-xs font-semibold text-blue-400">Pinecone</p>
                  <p className="text-xs text-slate-400">Scalable, custom</p>
                </div>
                <div className="bg-slate-700/30 rounded p-2">
                  <p className="text-xs font-semibold text-purple-400">PostgreSQL</p>
                  <p className="text-xs text-slate-400">Self-hosted, free</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">View Implementation Guide</p>
              <p className="text-xs text-slate-400 mb-2">
                Full code examples and setup instructions
              </p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => window.open('/VectorStoreGuide', '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open Vector Store Guide
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-amber-900/20 border border-amber-500/30 rounded p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-300 mb-1">Current Status</p>
              <p className="text-xs text-slate-300">
                Vector store is not yet configured. The AI uses general knowledge only. 
                Enable backend functions to unlock semantic search across all your rulebooks.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-700/30 rounded p-3">
          <p className="text-xs font-semibold text-white mb-2">What You'll Get:</p>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>• Ask questions in natural language</li>
            <li>• Get exact page references and quotes</li>
            <li>• Search across multiple rulebooks simultaneously</li>
            <li>• AI understands context and relationships</li>
            <li>• Character builder with system-specific rules</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}