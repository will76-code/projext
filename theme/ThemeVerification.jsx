import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

const VERIFICATION_CODES = {
  "mage_ascension": "MAGE20TH",
  "tails_of_equestria": "FRIENDSHIP",
  "dc_adventures": "JUSTICE"
};

export default function ThemeVerification({ open, onOpenChange, themeName, gameSystem }) {
  const [code, setCode] = useState("");
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: async (verificationCode) => {
      if (VERIFICATION_CODES[gameSystem] === verificationCode.toUpperCase()) {
        return await base44.entities.ThemeUnlock.create({
          theme_name: themeName,
          game_system: gameSystem,
          verification_code: verificationCode,
          verified: true,
          unlocked_at: new Date().toISOString()
        });
      } else {
        throw new Error("Invalid verification code");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-unlocks'] });
      toast.success(`${themeName} theme unlocked!`);
      onOpenChange(false);
      setCode("");
    },
    onError: (error) => {
      toast.error(error.message || "Verification failed");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-purple-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-300">
            <Lock className="w-5 h-5" />
            Unlock Premium Theme
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Enter the verification code from your {themeName} rulebook to unlock this theme.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label>Verification Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code from book"
              className="bg-slate-700/50 border-purple-500/30 text-white"
            />
            <p className="text-xs text-purple-400 mt-2">
              Find this code on the copyright page of your physical or digital rulebook.
            </p>
          </div>

          <Button
            onClick={() => verifyMutation.mutate(code)}
            disabled={!code || verifyMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Unlock className="w-4 h-4 mr-2" />
            {verifyMutation.isPending ? "Verifying..." : "Unlock Theme"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}