// src/components/manager/CheckInReview.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, MessageSquare, AlertCircle, Loader2 } from "lucide-react";

interface CheckInReviewProps {
  open: boolean;
  onClose: () => void;
  checkIn: any;
}

export function CheckInReview({ open, onClose, checkIn }: CheckInReviewProps) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const addFeedback = useMutation({
    mutationFn: async (data: { goalId: string; quarter: string; comment: string }) => {
      const res = await fetch("/api/manager/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add feedback");
      return res.json();
    },
    onSuccess: () => {
      setSuccess("Feedback added successfully");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["managerCheckIns"] });
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 2000);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    if (!comment.trim()) {
      setError("Please enter feedback");
      return;
    }
    setError("");
    addFeedback.mutate({
      goalId: checkIn?.goalId,
      quarter: checkIn?.quarter,
      comment,
    });
  };

  if (!checkIn) return null;

  const goal = checkIn.goal;
  const employee = goal?.goalSheet?.employee;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started": return <Badge variant="outline">Not Started</Badge>;
      case "on_track": return <Badge className="bg-blue-100 text-blue-700">On Track</Badge>;
      case "completed": return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "at_risk": return <Badge className="bg-amber-100 text-amber-700">At Risk</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Review Check-in: {employee?.firstName} {employee?.lastName}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Check-in Details */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{goal?.title}</span>
              {getStatusBadge(checkIn?.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Quarter:</span>
                <p className="font-medium">{checkIn?.quarter}</p>
              </div>
              <div>
                <span className="text-slate-500">Actual:</span>
                <p className="font-medium">
                  {goal?.uomType?.code === "timeline"
                    ? (checkIn?.actualDate ? new Date(checkIn?.actualDate).toLocaleDateString() : "No Date")
                    : checkIn?.actualAchievement}
                </p>
              </div>
            </div>

            {checkIn?.employeeComment && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Employee Comment:</p>
                <p className="text-sm">{checkIn.employeeComment}</p>
              </div>
            )}

            {goal?.progressScore && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Progress Score</span>
                  <span className="font-medium">{Number(goal.progressScore).toFixed(1)}%</span>
                </div>
                <Progress value={Number(goal.progressScore)} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manager Feedback */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Feedback</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Provide constructive feedback on progress..."
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addFeedback.isPending || !comment.trim()}
          >
            {addFeedback.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4 mr-2" />
            )}
            Add Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
