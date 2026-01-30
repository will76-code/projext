import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Bold, Italic, List, Link as LinkIcon, Image, History } from "lucide-react";
import { toast } from "sonner";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import PassageLinkingEditor from "./PassageLinkingEditor";

const toolbarModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'header': [1, 2, 3, false] }],
    ['link', 'image'],
    ['clean']
  ]
};

export default function RichLoreEditor({ entryId, initialContent = "", initialTitle = "", onSave, worldId }) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isUploading, setIsUploading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [showPassageLinking, setShowPassageLinking] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const editor = document.querySelector('.ql-editor');
      const imageMarkdown = `<img src="${file_url}" alt="lore-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;" />`;
      setContent(content + imageMarkdown);
      toast.success("Image inserted");
    } catch (error) {
      toast.error("Failed to upload image");
    }
    setIsUploading(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    const updateData = {
      title,
      content,
      last_edited_by: (await base44.auth.me()).email,
      versions: [...(versions || []), {
        version_number: (versions?.length || 0) + 1,
        content,
        edited_at: new Date().toISOString(),
        change_summary: "Manual edit"
      }]
    };

    if (entryId) {
      await base44.entities.LoreEntry.update(entryId, updateData);
    } else {
      await base44.entities.LoreEntry.create(updateData);
    }

    setVersions(updateData.versions);
    toast.success("Lore entry saved!");
    if (onSave) onSave(updateData);
  };

  const revertVersion = (versionNumber) => {
    const version = versions?.find(v => v.version_number === versionNumber);
    if (version) {
      setContent(version.content);
      toast.success(`Reverted to version ${versionNumber}`);
      setShowVersions(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Entry Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-slate-700/50 border-slate-600"
      />

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-300">Content</CardTitle>
          <div className="flex gap-2">
            <label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                as="span"
                variant="outline"
                size="sm"
                disabled={isUploading}
                className="cursor-pointer"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
              </Button>
            </label>

            {versions.length > 0 && (
              <Dialog open={showVersions} onOpenChange={setShowVersions}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-slate-300">Version History</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {versions.map((v) => (
                      <div key={v.version_number} className="bg-slate-700/50 p-3 rounded border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">v{v.version_number}</Badge>
                          <span className="text-xs text-slate-400">{new Date(v.edited_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-300 mb-2">{v.change_summary}</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => revertVersion(v.version_number)}
                          className="text-xs"
                        >
                          Revert to this version
                        </Button>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <ReactQuill
            value={content}
            onChange={setContent}
            modules={toolbarModules}
            theme="snow"
            className="bg-slate-700/50 text-slate-200 rounded"
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700">
        Save Entry
      </Button>

      {entryId && worldId && (
        <>
          <Button
            onClick={() => setShowPassageLinking(!showPassageLinking)}
            variant="outline"
            className="w-full"
          >
            {showPassageLinking ? 'Hide' : 'Show'} Passage Linking
          </Button>
          {showPassageLinking && (
            <PassageLinkingEditor 
              loreEntryId={entryId}
              worldId={worldId}
              content={content}
            />
          )}
        </>
      )}
      </div>
      );
      }