import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Database, Brain, Zap, Code, CheckCircle2, ArrowRight } from "lucide-react";

export default function VectorStoreGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-indigo-300 mb-4">Vector Store Integration Guide</h1>
          <p className="text-xl text-slate-400">Semantic search for rulebooks and world lore</p>
        </div>

        <Card className="bg-slate-800/50 border-indigo-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-indigo-300 flex items-center gap-2">
              <Brain className="w-6 h-6" />
              What is a Vector Store?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p>A vector store is an AI-powered searchable library for your PDFs and documents.</p>
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">How it works:</h4>
              <ol className="list-decimal ml-5 space-y-2 text-sm">
                <li>Upload rulebooks and lore documents</li>
                <li>The system indexes them by meaning (not just keywords)</li>
                <li>AI can search by concept and find relevant passages</li>
                <li>Responses include exact page references and quotes</li>
              </ol>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-700/30 rounded p-3">
                <p className="text-xs font-semibold text-green-400 mb-1">✓ With Vector Store</p>
                <p className="text-xs">Query: "How do I make a custom race in MLP?"</p>
                <p className="text-xs text-slate-400 mt-1">→ Finds exact section on character creation + homebrew rules</p>
              </div>
              <div className="bg-slate-700/30 rounded p-3">
                <p className="text-xs font-semibold text-red-400 mb-1">✗ Without Vector Store</p>
                <p className="text-xs">Query: "How do I make a custom race in MLP?"</p>
                <p className="text-xs text-slate-400 mt-1">→ AI guesses based on general knowledge</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="openai" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="openai">OpenAI Assistants</TabsTrigger>
            <TabsTrigger value="pinecone">Pinecone</TabsTrigger>
            <TabsTrigger value="custom">Custom Backend</TabsTrigger>
          </TabsList>

          {/* OPENAI ASSISTANTS */}
          <TabsContent value="openai" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-300">OpenAI Assistants API (Recommended)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                  <p className="text-sm text-green-300">
                    <strong>Best for:</strong> Quick integration, managed infrastructure, built-in file search
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Architecture</h4>
                  <pre className="text-xs bg-slate-900/50 p-3 rounded text-slate-300 overflow-x-auto">
{`User uploads PDFs → OpenAI Vector Store → File Search Tool
                                              ↓
                    AI Character Builder ← Assistant responds with context`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Implementation Steps</h4>
                  <div className="space-y-3">
                    <div className="bg-slate-700/30 rounded p-3">
                      <p className="text-xs font-semibold text-indigo-300 mb-1">Step 1: Enable Backend Functions</p>
                      <p className="text-xs text-slate-400">
                        In Base44 dashboard → Settings → Enable backend functions. This allows server-side API calls.
                      </p>
                    </div>

                    <div className="bg-slate-700/30 rounded p-3">
                      <p className="text-xs font-semibold text-indigo-300 mb-1">Step 2: Create Vector Store</p>
                      <pre className="text-xs bg-slate-900/50 p-2 rounded text-slate-300 mt-2">
{`// Backend function: createVectorStore.js
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function createVectorStore({ name, file_ids }) {
  const vectorStore = await openai.beta.vectorStores.create({
    name: name,
    file_ids: file_ids
  });
  return vectorStore;
}`}
                      </pre>
                    </div>

                    <div className="bg-slate-700/30 rounded p-3">
                      <p className="text-xs font-semibold text-indigo-300 mb-1">Step 3: Upload Files to Vector Store</p>
                      <pre className="text-xs bg-slate-900/50 p-2 rounded text-slate-300 mt-2">
{`// Backend function: uploadToVectorStore.js
export default async function uploadToVectorStore({ file_url, vector_store_id }) {
  // Download file from URL
  const response = await fetch(file_url);
  const buffer = await response.arrayBuffer();
  
  // Upload to OpenAI
  const file = await openai.files.create({
    file: new File([buffer], 'rulebook.pdf'),
    purpose: 'assistants'
  });
  
  // Add to vector store
  await openai.beta.vectorStores.files.create(vector_store_id, {
    file_id: file.id
  });
  
  return file.id;
}`}
                      </pre>
                    </div>

                    <div className="bg-slate-700/30 rounded p-3">
                      <p className="text-xs font-semibold text-indigo-300 mb-1">Step 4: Create Assistant with File Search</p>
                      <pre className="text-xs bg-slate-900/50 p-2 rounded text-slate-300 mt-2">
{`// Backend function: createAssistant.js
export default async function createAssistant({ vector_store_id }) {
  const assistant = await openai.beta.assistants.create({
    name: "Rulebook Expert",
    instructions: "You are a TTRPG rules expert. Use the rulebooks to answer questions accurately.",
    model: "gpt-4-turbo-preview",
    tools: [{ type: "file_search" }],
    tool_resources: {
      file_search: {
        vector_store_ids: [vector_store_id]
      }
    }
  });
  return assistant;
}`}
                      </pre>
                    </div>

                    <div className="bg-slate-700/30 rounded p-3">
                      <p className="text-xs font-semibold text-indigo-300 mb-1">Step 5: Query with Context</p>
                      <pre className="text-xs bg-slate-900/50 p-2 rounded text-slate-300 mt-2">
{`// Backend function: askAssistant.js
export default async function askAssistant({ assistant_id, question, context }) {
  const thread = await openai.beta.threads.create();
  
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: \`Context: \${JSON.stringify(context)}\\n\\nQuestion: \${question}\`
  });
  
  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistant_id
  });
  
  const messages = await openai.beta.threads.messages.list(thread.id);
  return messages.data[0].content[0].text.value;
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-900/20 border border-amber-500/30 rounded p-3">
                  <h4 className="font-semibold text-amber-300 mb-2">Pricing</h4>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• Vector store: $0.10/GB/day</li>
                    <li>• File search queries: $0.20/1M tokens</li>
                    <li>• Example: 1GB of rulebooks = ~$3/month</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PINECONE */}
          <TabsContent value="pinecone" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-300">Pinecone Vector Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                  <p className="text-sm text-blue-300">
                    <strong>Best for:</strong> Large-scale, custom chunking, multi-tenancy
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Implementation Overview</h4>
                  <pre className="text-xs bg-slate-900/50 p-3 rounded text-slate-300">
{`1. Extract text from PDFs (backend function)
2. Chunk text into passages (500-1000 tokens)
3. Generate embeddings (OpenAI text-embedding-3-small)
4. Store in Pinecone with metadata (book, page, section)
5. Query Pinecone on user questions
6. Pass top results to LLM for synthesis`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Code Sample</h4>
                  <pre className="text-xs bg-slate-900/50 p-3 rounded text-slate-300 overflow-x-auto">
{`// Backend function: indexRulebook.js
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');

export default async function indexRulebook({ file_url, rulebook_id }) {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.index('rulebooks');
  
  // Extract and chunk text (simplified)
  const text = await extractPdfText(file_url);
  const chunks = chunkText(text, 1000);
  
  // Generate embeddings
  const openai = new OpenAI();
  const embeddings = await Promise.all(
    chunks.map(chunk => openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk.text
    }))
  );
  
  // Upsert to Pinecone
  const vectors = chunks.map((chunk, i) => ({
    id: \`\${rulebook_id}_chunk_\${i}\`,
    values: embeddings[i].data[0].embedding,
    metadata: {
      text: chunk.text,
      page: chunk.page,
      rulebook_id: rulebook_id
    }
  }));
  
  await index.upsert(vectors);
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CUSTOM BACKEND */}
          <TabsContent value="custom" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-slate-300">Custom Backend Solution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3">
                  <p className="text-sm text-purple-300">
                    <strong>Best for:</strong> Full control, on-premise, cost optimization
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Tech Stack Options</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-700/30 rounded p-3">
                      <p className="text-xs font-semibold text-white mb-1">Option 1: PostgreSQL + pgvector</p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li>• Free, open-source</li>
                        <li>• Native vector similarity search</li>
                        <li>• Requires self-hosting</li>
                      </ul>
                    </div>
                    <div className="bg-slate-700/30 rounded p-3">
                      <p className="text-xs font-semibold text-white mb-1">Option 2: Weaviate</p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li>• Open-source vector database</li>
                        <li>• Built-in text chunking</li>
                        <li>• Docker deployment</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">PostgreSQL + pgvector Example</h4>
                  <pre className="text-xs bg-slate-900/50 p-3 rounded text-slate-300 overflow-x-auto">
{`-- Schema
CREATE EXTENSION vector;

CREATE TABLE rulebook_chunks (
  id SERIAL PRIMARY KEY,
  rulebook_id TEXT,
  page INT,
  text TEXT,
  embedding vector(1536)
);

CREATE INDEX ON rulebook_chunks USING ivfflat (embedding vector_cosine_ops);

-- Query
SELECT text, page, 1 - (embedding <=> $1) AS similarity
FROM rulebook_chunks
WHERE rulebook_id = $2
ORDER BY embedding <=> $1
LIMIT 5;`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-slate-800/50 border-green-500/30 mt-8">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Integration Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5">1</Badge>
                <div>
                  <p className="font-semibold">Enable Backend Functions in Base44</p>
                  <p className="text-xs text-slate-400">Dashboard → Settings → Backend Functions</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5">2</Badge>
                <div>
                  <p className="font-semibold">Choose Vector Store Provider</p>
                  <p className="text-xs text-slate-400">OpenAI (easiest), Pinecone (scalable), or Custom (control)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5">3</Badge>
                <div>
                  <p className="font-semibold">Create Backend Functions</p>
                  <p className="text-xs text-slate-400">Upload, index, and query functions</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5">4</Badge>
                <div>
                  <p className="font-semibold">Update Frontend Components</p>
                  <p className="text-xs text-slate-400">Modify AICharacterBuildingAssistant to call backend functions</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5">5</Badge>
                <div>
                  <p className="font-semibold">Test & Iterate</p>
                  <p className="text-xs text-slate-400">Verify search quality, adjust chunking/prompts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-900/20 border-blue-500/30 mt-6">
          <CardHeader>
            <CardTitle className="text-blue-300">Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <span><strong>Character Builder:</strong> "What are the racial bonuses for Kryptonians?"</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <span><strong>AI GM:</strong> "Generate an encounter using the Bestiary from book 2"</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <span><strong>Rules Lookup:</strong> "How does grappling work in this system?"</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <span><strong>Lore Search:</strong> "Tell me about the history of Canterlot"</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}