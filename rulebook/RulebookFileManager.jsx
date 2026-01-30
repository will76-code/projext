import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function RulebookFileManager({ rulebooks = [] }) {
  const queryClient = useQueryClient();
  const [pendingDeletions, setPendingDeletions] = useState({});

  // Group rulebooks to find duplicates
  const findDuplicates = () => {
    const groups = {};
    rulebooks.forEach(rb => {
      const key = `${rb.game_system}-${rb.title}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(rb);
    });
    return Object.values(groups).filter(g => g.length > 1);
  };

  const deleteMutation = useMutation({
    mutationFn: (rulebookId) => base44.entities.Rulebook.delete(rulebookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rulebooks'] });
      toast.success('Rulebook deleted');
      setPendingDeletions({});
    },
    onError: () => {
      toast.error('Failed to delete rulebook');
    }
  });

  const duplicates = findDuplicates();

  if (duplicates.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            File Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">✓ No duplicate files detected. All rulebooks are unique.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-yellow-500/30">
      <CardHeader>
        <CardTitle className="text-yellow-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Duplicate Files Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {duplicates.map((group, idx) => (
          <div key={idx} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-300 mb-3">{group[0].title}</h4>
            <div className="space-y-2">
              {group.map((rb) => (
                <div key={rb.id} className="flex items-center justify-between bg-slate-700/30 p-2 rounded">
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{rb.game_system}</p>
                    <p className="text-xs text-slate-400">
                      Extracted: {rb.content_extracted ? "Yes" : "No"} • 
                      Created: {new Date(rb.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border-red-500/30">
                      <AlertDialogTitle className="text-red-300">Delete Duplicate?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        This will permanently delete "{rb.title}". This action cannot be undone.
                      </AlertDialogDescription>
                      <div className="flex gap-3">
                        <AlertDialogCancel className="border-slate-500/50">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(rb.id)}
                          disabled={deleteMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}