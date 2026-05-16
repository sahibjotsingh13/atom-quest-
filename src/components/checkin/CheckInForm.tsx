// src/components/checkin/CheckInForm.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calculator, Target, TrendingUp } from "lucide-react";
import { calculateProgressScore } from "@/lib/validation";

interface CheckInFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  goal: any;
  quarter: string;
  existingCheckIn?: any;
}

export function CheckInForm({
  open,
  onClose,
  onSubmit,
  goal,
  quarter,
  existingCheckIn,
}: CheckInFormProps) {
  const [actualValue, setActualValue] = useState(
    existingCheckIn?.actualAchievement || ""
  );
  const [actualDate, setActualDate] = useState(
    existingCheckIn?.actualDate
      ? new Date(existingCheckIn.actualDate).toISOString().split("T")[0]
      : ""
  );
  const [status, setStatus] = useState(existingCheckIn?.status || "on_track");
  const [comment, setComment] = useState(existingCheckIn?.employeeComment || "");
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isTimeline = goal.uomType?.code === "timeline";
  const isZeroBased = goal.uomType?.code === "zero";
  const isPercentage = goal.uomType?.code?.includes("percentage");

  const calculatePreview = () => {
    if (!actualValue && !actualDate) return;

    const score = calculateProgressScore(
      goal.uomType?.code,
      Number(goal.targetValue) || 0,
      isTimeline ? 0 : Number(actualValue) || 0,
      goal.targetDate ? new Date(goal.targetDate) : undefined,
      actualDate ? new Date(actualDate) : undefined
    );

    setPreviewScore(score);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!status) {
      setError("Please select a status");
      return;
    }

    if (isTimeline) {
      if (!actualDate) {
        setError("Completion date is required for Timeline goals");
        return;
      }
    } else {
      if (!actualValue && actualValue !== "0") {
        setError("Actual value is required");
        return;
      }
      if (isNaN(Number(actualValue))) {
        setError("Actual value must be a number");
        return;
      }
    }

    onSubmit({
      goalId: goal.id,
      quarter,
      actualValue: isTimeline ? null : Number(actualValue),
      actualDate: isTimeline ? actualDate : null,
      status,
      comment,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {quarter} Check-in: {goal.title}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Goal Info */}
        <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-600">Target:</span>
            <span className="font-medium">
              {isTimeline
                ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "No Date")
                : isPercentage
                ? `${goal.targetValue}%`
                : goal.targetValue}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">UoM:</span>
            <span className="font-medium">{goal.uomType?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Weightage:</span>
            <span className="font-medium">{goal.weightage}%</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Actual Input - Dynamic based on UoM */}
          {isTimeline ? (
            <div className="space-y-2">
              <Label>
                Completion Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={actualDate}
                onChange={(e) => {
                  setActualDate(e.target.value);
                  setPreviewScore(null);
                }}
              />
              <p className="text-xs text-slate-500">
                Target date: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "No Date"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>
                Actual Achievement <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  step="any"
                  value={actualValue}
                  onChange={(e) => {
                    setActualValue(e.target.value);
                    setPreviewScore(null);
                  }}
                  placeholder={isZeroBased ? "0 = Success, >0 = Failure" : "Enter actual value"}
                />
                {isPercentage && <span className="text-slate-500">%</span>}
              </div>
              {isZeroBased && (
                <p className="text-xs text-slate-500">
                  Zero-based: Enter 0 for success, any positive number for failure
                </p>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label>
              Status <span className="text-red-500">*</span>
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label>Comment</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your progress, challenges, or achievements..."
              rows={3}
            />
          </div>

          {/* Preview Score */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={calculatePreview}
            >
              <Calculator className="w-4 h-4 mr-1" />
              Preview Score
            </Button>
            {previewScore !== null && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {previewScore.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Check-in</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
