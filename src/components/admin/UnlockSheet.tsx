// src/components/admin/UnlockSheet.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Unlock, Loader2, AlertTriangle } from "lucide-react";

interface UnlockSheetProps {
  sheetId: string;
  employeeName: string;
}

export function UnlockSheet({ sheetId, employeeName }: UnlockSheetProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const unlockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to unlock");
      }
      return res.json();
    },
    onSuccess: () => {
      setOpen(false);
      setReason("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["adminSheets"] });
      queryClient.invalidateQueries({ queryKey: ["adminAnalytics"] });
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const handleUnlock = () => {
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }
    setError("");
    unlockMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="border-skin-700 text-skin-200 hover:bg-skin-800 hover:text-skin-100 font-medium shadow-sm" />}>
        <Unlock className="w-3.5 h-3.5 mr-1.5 text-accent-light" />
        Unlock Sheet
      </DialogTrigger>
      <DialogContent className="max-w-md bg-skin-900 border-skin-700 text-skin-100 shadow-2xl shadow-black/50 rounded-2xl font-sans-body">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 font-serif-display text-xl font-bold text-skin-50">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 shadow-inner">
              <Unlock className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            Unlock Goal Sheet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 pt-2">
          <p className="text-sm text-skin-300 leading-relaxed bg-skin-950/60 p-4 rounded-xl border border-skin-800">
            You are about to administrative-unlock <strong className="text-skin-50 font-bold">{employeeName}</strong>&apos;s goal sheet. 
            This action temporarily bypasses workflow locks to allow the employee and manager to make critical target adjustments.
          </p>

          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border border-red-800 text-red-200 font-sans-body shadow-inner">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2.5">
            <Label htmlFor="reason" className="text-skin-200 font-medium">
              Reason for Administrative Unlock <span className="text-accent-light">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Employee needs to update targets due to changed Q3 business priorities..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:ring-accent-default focus:border-accent-default shadow-sm text-base"
            />
            <p className="text-xs font-medium text-skin-400 flex items-center gap-1.5 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-light"></span> Minimum 10 characters. This operation will be permanently recorded in the system audit trail.
            </p>
          </div>

          <div className="flex justify-end gap-3.5 pt-4 border-t border-skin-800">
            <Button variant="outline" onClick={() => setOpen(false)} className="border-skin-700 text-skin-200 hover:bg-skin-800 hover:text-skin-100 font-medium">
              Cancel
            </Button>
            <Button
              onClick={handleUnlock}
              disabled={unlockMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-600/20 px-5 py-2.5 rounded-xl"
            >
              {unlockMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4 mr-2" />
              )}
              Confirm Unlock
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
