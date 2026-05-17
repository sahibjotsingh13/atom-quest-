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
      <DialogContent className="max-w-lg bg-skin-900 border-skin-700 text-skin-100 shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-skin-50 font-serif-display font-bold text-xl">
            <Target className="w-5 h-5 text-accent-light" />
            {quarter} Check-in: {goal.title}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-200 font-sans-body">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Goal Info */}
        <div className="glass p-4 rounded-xl bg-skin-800/40 border border-skin-700 space-y-1.5 font-sans-body">
          <div className="flex justify-between text-sm">
            <span className="text-skin-400 font-medium">Target:</span>
            <span className="font-bold text-skin-50">
              {isTimeline
                ? (goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "No Date")
                : isPercentage
                ? `${goal.targetValue}%`
                : goal.targetValue}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-skin-400 font-medium">UoM:</span>
            <span className="font-bold text-skin-50">{goal.uomType?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-skin-400 font-medium">Weightage:</span>
            <span className="font-bold text-accent-light">{goal.weightage}%</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans-body">
          {/* Actual Input - Dynamic based on UoM */}
          {isTimeline ? (
            <div className="space-y-2">
              <Label className="text-skin-200 font-medium">
                Completion Date <span className="text-accent-light">*</span>
              </Label>
              <Input
                type="date"
                className="bg-skin-950 border-skin-700 text-skin-100 focus:border-accent-default focus:ring-accent-default"
                value={actualDate}
                onChange={(e) => {
                  setActualDate(e.target.value);
                  setPreviewScore(null);
                }}
              />
              <p className="text-xs text-skin-400">
                Target date: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "No Date"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-skin-200 font-medium">
                Actual Achievement <span className="text-accent-light">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  step="any"
                  className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:border-accent-default focus:ring-accent-default"
                  value={actualValue}
                  onChange={(e) => {
                    setActualValue(e.target.value);
                    setPreviewScore(null);
                  }}
                  placeholder={isZeroBased ? "0 = Success, >0 = Failure" : "Enter actual value"}
                />
                {isPercentage && <span className="text-skin-400 font-semibold">%</span>}
              </div>
              {isZeroBased && (
                <p className="text-xs text-skin-400">
                  Zero-based: Enter 0 for success, any positive number for failure
                </p>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-skin-200 font-medium">
              Status <span className="text-accent-light">*</span>
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-skin-950 border-skin-700 text-skin-100">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent className="bg-skin-900 border-skin-700 text-skin-100">
                <SelectItem value="not_started" className="focus:bg-skin-800 focus:text-skin-50">Not Started</SelectItem>
                <SelectItem value="on_track" className="focus:bg-skin-800 focus:text-skin-50">On Track</SelectItem>
                <SelectItem value="completed" className="focus:bg-skin-800 focus:text-skin-50">Completed</SelectItem>
                <SelectItem value="at_risk" className="focus:bg-skin-800 focus:text-skin-50">At Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label className="text-skin-200 font-medium">Comment</Label>
            <Textarea
              className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:border-accent-default focus:ring-accent-default"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your progress, challenges, or achievements..."
              rows={3}
            />
          </div>

          {/* Preview Score */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-skin-700 text-skin-200 hover:bg-skin-800 hover:text-skin-100"
              onClick={calculatePreview}
            >
              <Calculator className="w-4 h-4 mr-1.5 text-accent-light" />
              Preview Score
            </Button>
            {previewScore !== null && (
              <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg bg-skin-800/50 border border-skin-700">
                <TrendingUp className="w-4 h-4 text-[#5cc8e0]" />
                <span className="text-sm font-bold text-[#5cc8e0]">
                  {previewScore.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-skin-800">
            <Button type="button" variant="outline" onClick={onClose} className="border-skin-700 text-skin-200 hover:bg-skin-800 hover:text-skin-100">
              Cancel
            </Button>
            <Button type="submit" className="bg-accent-default hover:bg-accent-dark text-white font-semibold shadow-lg shadow-accent-default/20">
              Save Check-in
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
