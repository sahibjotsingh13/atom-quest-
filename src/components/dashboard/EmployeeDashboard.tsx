// src/components/dashboard/EmployeeDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalCard } from "@/components/goals/GoalCard";
import { WeightageChart } from "@/components/goals/WeightageChart";
import {
  Plus,
  Target,
  Send,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
  RotateCcw,
  Clock,
  CalendarDays,
} from "lucide-react";
import { QuarterTimeline } from "@/components/checkin/QuarterTimeline";
import { CheckInForm } from "@/components/checkin/CheckInForm";
import { getQuarterStatus } from "@/lib/checkin-window";

export function EmployeeDashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [checkInGoal, setCheckInGoal] = useState<any>(null);
  const [checkInQuarter, setCheckInQuarter] = useState("");
  const [currentWindow, setCurrentWindow] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch goal sheet
  const { data: sheet, isLoading } = useQuery({
    queryKey: ["goalSheet"],
    queryFn: async () => {
      const res = await fetch("/api/employee/sheet");
      if (!res.ok) throw new Error("Failed to fetch goal sheet");
      return res.json();
    },
  });

  // Fetch master data
  const { data: uomTypes = [] } = useQuery({
    queryKey: ["uomTypes"],
    queryFn: async () => {
      const res = await fetch("/api/master/uom-types");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: thrustAreas = [] } = useQuery({
    queryKey: ["thrustAreas"],
    queryFn: async () => {
      const res = await fetch("/api/master/thrust-areas");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Create goal mutation
  const createGoal = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/employee/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, goalSheetId: sheet?.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create goal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goalSheet"] });
      setShowForm(false);
      setSuccess("Goal added successfully");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Update goal mutation
  const updateGoal = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/employee/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update goal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goalSheet"] });
      setShowForm(false);
      setEditingGoal(null);
      setSuccess("Goal updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Delete goal mutation
  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/employee/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goalSheet"] });
      setSuccess("Goal deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Submit sheet mutation
  const submitSheet = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/employee/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId: sheet?.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.error || "Failed to submit goal sheet");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goalSheet"] });
      setSuccess("Goal sheet submitted for approval!");
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Check-in mutation
  const checkIn = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/employee/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save check-in");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goalSheet"] });
      setCheckInGoal(null);
      setCheckInQuarter("");
      setSuccess("Check-in saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Current quarter logic
  useEffect(() => {
    if (sheet?.cycle) {
      setCurrentWindow(getQuarterStatus(sheet.cycle));
    }
  }, [sheet?.cycle]);

  const goals = sheet?.goals || [];
  const totalWeightage = goals.reduce((sum: number, g: any) => sum + Number(g.weightage), 0);
  const remainingWeightage = Math.max(0, 100 - totalWeightage);
  const isLocked = sheet?.status === "locked" || sheet?.status === "approved";
  const isSubmitted = sheet?.status === "submitted";
  const isRejected = sheet?.status === "rejected";
  const canEdit = !isLocked && !isSubmitted;
  const canSubmit = canEdit && goals.length >= 3 && goals.length <= 8 && Math.abs(totalWeightage - 100) < 0.01;

  const handleAddGoal = (data: any) => {
    setError("");
    createGoal.mutate(data);
  };

  const handleEditGoal = (data: any) => {
    setError("");
    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, data });
    }
  };

  const handleDeleteGoal = (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    deleteGoal.mutate(id);
  };

  const getStatusBadge = () => {
    switch (sheet?.status) {
      case "draft": return <Badge variant="outline">Draft</Badge>;
      case "submitted": return <Badge className="bg-amber-100 text-amber-700">Pending Approval</Badge>;
      case "locked": return <Badge className="bg-green-100 text-green-700"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>;
      case "rejected": return <Badge variant="destructive"><RotateCcw className="w-3 h-3 mr-1" /> Rejected - Edit & Resubmit</Badge>;
      default: return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Goal Sheet</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500">{sheet?.cycle?.name || "Current Cycle"}</p>
              <span className="text-slate-300">•</span>
              {getStatusBadge()}
            </div>
          </div>
          <div className="flex gap-3">
            {canEdit && (
              <Button onClick={() => { setEditingGoal(null); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            )}
            {canEdit && goals.length > 0 && (
              <Button onClick={() => submitSheet.mutate()} disabled={submitSheet.isPending || !canSubmit}>
                {submitSheet.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit for Approval
              </Button>
            )}
            {isLocked && (
              <Badge variant="secondary" className="px-3 py-1">
                <Lock className="w-4 h-4 mr-1" /> Approved & Locked
              </Badge>
            )}
            {isSubmitted && (
              <Badge className="bg-amber-100 text-amber-700 px-3 py-1">
                <Clock className="w-4 h-4 mr-1" /> Awaiting Manager Review
              </Badge>
            )}
          </div>
        </div>

        {/* Alerts */}
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

        {/* Rejection Reason */}
        {sheet?.status === "rejected" && sheet?.rejectionReason && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Returned for rework:</strong> {sheet.rejectionReason}
            </AlertDescription>
          </Alert>
        )}

        {/* Weightage Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Weightage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <WeightageChart goals={goals} />
              <div className="flex-1 w-full space-y-3">
                <Progress value={totalWeightage} className="h-3" />
                <div className="flex justify-between text-sm">
                  <span className={Math.abs(totalWeightage - 100) < 0.01 ? "text-green-600 font-semibold" : "text-slate-700"}>
                    Used: {totalWeightage.toFixed(1)}%
                  </span>
                  <span className="text-slate-500">
                    Remaining: {remainingWeightage.toFixed(1)}%
                  </span>
                  <span className="text-slate-500">
                    Goals: {goals.length}/{8}
                  </span>
                </div>
                {canEdit && (
                  <div className="flex flex-col gap-1">
                    {totalWeightage !== 100 && (
                      <p className="text-sm text-amber-600">
                        {totalWeightage < 100
                          ? `Add ${(100 - totalWeightage).toFixed(1)}% more to reach 100%`
                          : `Reduce by ${(totalWeightage - 100).toFixed(1)}% to reach 100%`}
                      </p>
                    )}
                    {goals.length < 3 && (
                      <p className="text-sm text-amber-600">
                        Add at least {3 - goals.length} more goal(s) (Minimum 3 goals required)
                      </p>
                    )}
                    {totalWeightage === 100 && goals.length >= 3 && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Goal sheet requirements met
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quarterly Check-ins - Only show when sheet is locked/approved */}
        {isLocked && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Quarterly Check-ins
                  {currentWindow?.isOpen && (
                    <Badge className="bg-green-100 text-green-700 ml-2">
                      <Clock className="w-3 h-3 mr-1" /> {currentWindow.label} Open
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuarterTimeline goals={goals} cycle={sheet?.cycle} />
              </CardContent>
            </Card>

            {!currentWindow?.isOpen && (
              <Alert className="bg-amber-50 border-amber-200">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  No check-in window is currently open. Check-ins are available during: Q1 (July), Q2 (October), Q3 (January), Q4 (March/April).
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Goals ({goals.length})</h2>
          </div>
          {goals.map((goal: any, index: number) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={index}
              isEditable={canEdit}
              onEdit={() => { setEditingGoal(goal); setShowForm(true); }}
              onDelete={() => handleDeleteGoal(goal.id)}
              onCheckIn={() => {
                if (currentWindow?.isOpen) {
                  setCheckInGoal(goal);
                  setCheckInQuarter(currentWindow.quarter);
                } else {
                  setError(`Check-in window is currently closed. ${currentWindow ? `Next window: ${currentWindow.label}` : "No active cycle"}`);
                }
              }}
            />
          ))}

          {goals.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No goals yet</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                Start by adding your first goal. You need between 3 and 8 goals, totaling exactly 100% weightage.
              </p>
              {canEdit && (
                <Button onClick={() => { setEditingGoal(null); setShowForm(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Goal
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Submit Hint */}
        {canSubmit && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700">
              Your goal sheet is ready! Click &quot;Submit for Approval&quot; to send it to your manager.
            </AlertDescription>
          </Alert>
        )}

        {/* Goal Form Modal */}
        <GoalForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingGoal(null); }}
          onSubmit={editingGoal ? handleEditGoal : handleAddGoal}
          uomTypes={uomTypes}
          thrustAreas={thrustAreas}
          remainingWeightage={editingGoal ? remainingWeightage + Number(editingGoal.weightage) : remainingWeightage}
          editingGoal={editingGoal}
        />

        {/* Check-in Modal */}
        {checkInGoal && currentWindow?.isOpen && (
          <CheckInForm
            open={!!checkInGoal}
            onClose={() => {
              setCheckInGoal(null);
              setCheckInQuarter("");
            }}
            onSubmit={(data) => checkIn.mutate(data)}
            goal={checkInGoal}
            quarter={checkInQuarter}
            existingCheckIn={checkInGoal.checkIns?.find((c: any) => c.quarter === checkInQuarter)}
          />
        )}
      </div>
    </AppLayout>
  );
}