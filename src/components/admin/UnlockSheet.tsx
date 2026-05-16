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
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Unlock className="w-4 h-4 mr-1" />
        Unlock
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="w-5 h-5" />
            Unlock Goal Sheet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            You are about to unlock <strong>{employeeName}</strong>&apos;s goal sheet. 
            This will allow the employee and manager to make changes.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Unlock <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Employee needs to update targets due to changed business priorities..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-slate-500">
              Minimum 10 characters. This will be logged in the audit trail.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUnlock}
              disabled={unlockMutation.isPending}
              variant="destructive"
            >
              {unlockMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4 mr-2" />
              )}
              Unlock Sheet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
