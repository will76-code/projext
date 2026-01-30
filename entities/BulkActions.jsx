import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";

export default function BulkActions({ 
  selectedIds = [], 
  onDelete, 
  onStatusChange,
  onSelectAll,
  isDeleting = false,
  statusOptions = []
}) {
  const [selectedStatus, setSelectedStatus] = useState("");

  if (selectedIds.length === 0) return null;

  const handleBulkStatusChange = async () => {
    if (!selectedStatus) {
      toast.error("Select a status first");
      return;
    }
    await onStatusChange(selectedIds, selectedStatus);
    setSelectedStatus("");
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-300">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        {statusOptions.length > 0 && (
          <>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-sm bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-slate-300"
            >
              <option value="">Change Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Button
              onClick={handleBulkStatusChange}
              variant="outline"
              size="sm"
              className="border-blue-500/50"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Update
            </Button>
          </>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="bg-red-600/80 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900 border-red-500/30">
            <AlertDialogTitle className="text-red-300">Delete {selectedIds.length} items?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. All selected items will be permanently deleted.
            </AlertDialogDescription>
            <div className="flex gap-3">
              <AlertDialogCancel className="border-slate-500/50">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(selectedIds)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}