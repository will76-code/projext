import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Save, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function SavedViewManager({ 
  entityType, 
  currentFilters = {}, 
  currentSort = {},
  onLoadView 
}) {
  const [views, setViews] = useState([]);
  const [viewName, setViewName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadViews = async () => {
    try {
      // Store views in browser storage for now, can be moved to database
      const stored = localStorage.getItem(`views_${entityType}`);
      if (stored) {
        setViews(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load views:", error);
    }
  };

  React.useEffect(() => {
    loadViews();
  }, [entityType]);

  const saveView = async () => {
    if (!viewName.trim()) {
      toast.error("Enter a view name");
      return;
    }

    const newView = {
      id: Date.now().toString(),
      name: viewName,
      filters: currentFilters,
      sort: currentSort,
      createdAt: new Date().toISOString()
    };

    const updatedViews = [...views, newView];
    try {
      localStorage.setItem(`views_${entityType}`, JSON.stringify(updatedViews));
      setViews(updatedViews);
      setViewName("");
      setIsOpen(false);
      toast.success(`View "${viewName}" saved`);
    } catch (error) {
      toast.error("Failed to save view");
    }
  };

  const deleteView = (viewId) => {
    const updated = views.filter(v => v.id !== viewId);
    localStorage.setItem(`views_${entityType}`, JSON.stringify(updated));
    setViews(updated);
    toast.success("View deleted");
  };

  const loadView = (view) => {
    onLoadView(view.filters, view.sort);
    toast.success(`Loaded view "${view.name}"`);
  };

  return (
    <div className="flex gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-purple-500/50"
            onClick={loadViews}
          >
            <Save className="w-4 h-4 mr-1" />
            Save View
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Save Current View</DialogTitle>
            <DialogDescription className="text-slate-400">
              Save your filter and sort configuration for quick access later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="View name (e.g., 'Approved Lore')"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              className="bg-slate-800 border-slate-700"
              onKeyDown={(e) => e.key === "Enter" && saveView()}
            />
            <Button onClick={saveView} className="w-full bg-purple-600 hover:bg-purple-700">
              Save View
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {views.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {views.map((view) => (
            <div key={view.id} className="group relative">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 hover:border-purple-500/50 text-xs"
                onClick={() => loadView(view)}
              >
                {view.name}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-red-600 rounded-full p-0.5 transition-opacity">
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-red-500/30">
                  <AlertDialogTitle className="text-red-300">Delete view?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Delete "{view.name}" view
                  </AlertDialogDescription>
                  <div className="flex gap-3">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteView(view.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}