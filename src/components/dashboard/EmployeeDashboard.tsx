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
  Sparkles,
  TrendingUp,
  ShieldCheck,
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
      case "draft": return <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-skin-100 dark:bg-skin-800 text-skin-700 dark:text-skin-200 border-skin-300 dark:border-skin-700 shadow-sm">Draft Mode</Badge>;
      case "submitted": return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-semibold shadow-sm shimmer">Pending Approval</Badge>;
      case "locked": return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30 px-3 py-1 text-xs font-semibold shadow-sm"><Lock className="w-3.5 h-3.5 mr-1.5" /> Approved & Locked</Badge>;
      case "rejected": return <Badge variant="destructive" className="px-3 py-1 text-xs font-semibold shadow-sm animate-pulse"><RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Rejected - Action Required</Badge>;
      default: return <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-skin-100 dark:bg-skin-800 text-skin-700 dark:text-skin-200 border-skin-300 dark:border-skin-700 shadow-sm">Draft Mode</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="w-12 h-12 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        {/* Top Hero Banner */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-skin-200/60 dark:border-skin-800/60 relative overflow-hidden bg-gradient-to-r from-skin-100/40 via-transparent to-accent/5 dark:from-skin-900/40 dark:via-transparent dark:to-accent/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-skin-900 dark:text-skin-50">My Goal Sheet</h1>
                {getStatusBadge()}
              </div>
              <p className="text-skin-600 dark:text-skin-300 flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="w-4 h-4 text-accent" />
                <span>{sheet?.cycle?.name || "Current Performance Cycle"}</span>
                <span className="text-skin-300 dark:text-skin-700">•</span>
                <span className="text-skin-500 dark:text-skin-400">Manage, align, and track your strategic objectives</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {canEdit && (
                <Button 
                  onClick={() => { setEditingGoal(null); setShowForm(true); }}
                  className="btn-3d flex-1 md:flex-none px-6 py-5 rounded-2xl bg-gradient-to-r from-accent-light to-accent-dark hover:from-accent hover:to-accent-dark text-white font-bold shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Goal</span>
                </Button>
              )}
              {canEdit && goals.length > 0 && (
                <Button 
                  onClick={() => submitSheet.mutate()} 
                  disabled={submitSheet.isPending || !canSubmit}
                  className={`btn-3d flex-1 md:flex-none px-6 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    canSubmit 
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20" 
                      : "bg-skin-200 dark:bg-skin-800 text-skin-500 dark:text-skin-400 cursor-not-allowed border border-skin-300 dark:border-skin-700"
                  }`}
                >
                  {submitSheet.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  <span>Submit for Approval</span>
                </Button>
              )}
              {isLocked && (
                <div className="glass px-5 py-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 font-bold flex items-center gap-2 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span>Sheet Approved & Locked</span>
                </div>
              )}
              {isSubmitted && (
                <div className="glass px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-2 shadow-sm shimmer">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Awaiting Manager Review</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        {error && (
          <Alert variant="destructive" className="glass rounded-2xl border-destructive/50 bg-destructive/10 text-destructive dark:text-red-300 shadow-lg animate-fade-in">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-2 font-semibold">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="glass rounded-2xl border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300 shadow-lg animate-fade-in">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="ml-2 font-semibold">{success}</AlertDescription>
          </Alert>
        )}

        {/* Rejection Reason Banner */}
        {sheet?.status === "rejected" && sheet?.rejectionReason && (
          <Alert variant="destructive" className="glass rounded-2xl border-destructive bg-destructive/15 text-destructive dark:text-red-200 shadow-xl p-6">
            <AlertCircle className="h-6 w-6" />
            <AlertDescription className="ml-3 text-base">
              <strong className="block text-lg font-bold mb-1">Returned for Rework by Manager:</strong> 
              {sheet.rejectionReason}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Hint Banner */}
        {canSubmit && (
          <Alert className="glass rounded-2xl border-accent/50 bg-accent/10 text-skin-900 dark:text-skin-100 shadow-lg p-6 flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-accent animate-bounce" />
            <AlertDescription className="text-base font-medium">
              <strong className="text-accent dark:text-accent-light font-bold block text-lg mb-0.5">All Requirements Met!</strong>
              Your goal sheet is fully balanced and configured. Click <strong className="text-skin-900 dark:text-white">&quot;Submit for Approval&quot;</strong> above to send it to your manager.
            </AlertDescription>
          </Alert>
        )}

        {/* Weightage Summary Dashboard Card */}
        <div className="glass rounded-3xl p-8 shadow-xl border border-skin-200/60 dark:border-skin-800/60 bg-white/40 dark:bg-skin-900/40 relative overflow-hidden">
          <h2 className="text-lg font-extrabold text-skin-900 dark:text-skin-50 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <span>Weightage & Alignment Distribution</span>
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <WeightageChart goals={goals} />
            
            <div className="flex-1 w-full space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className={Math.abs(totalWeightage - 100) < 0.01 ? "text-green-600 dark:text-green-400 font-extrabold" : "text-skin-700 dark:text-skin-200"}>
                    Allocated Weightage: {totalWeightage.toFixed(1)}%
                  </span>
                  <span className="text-skin-500 dark:text-skin-400">
                    Remaining: {remainingWeightage.toFixed(1)}%
                  </span>
                  <span className="text-skin-500 dark:text-skin-400">
                    Total Goals: {goals.length} / 8
                  </span>
                </div>
                
                {/* 3D Animated Progress Bar */}
                <div className="relative h-4 w-full bg-skin-200 dark:bg-skin-800 rounded-full overflow-hidden p-1 shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-md ${
                      Math.abs(totalWeightage - 100) < 0.01 
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/50" 
                        : totalWeightage > 100 
                        ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/50"
                        : "bg-gradient-to-r from-accent-light via-accent to-accent-dark shadow-accent/50"
                    }`}
                    style={{ width: `${Math.min(100, totalWeightage)}%` }}
                  ></div>
                </div>
              </div>

              {/* Requirement Hints */}
              {canEdit && (
                <div className="flex flex-col gap-2 pt-2 border-t border-skin-200/50 dark:border-skin-800/50">
                  {totalWeightage !== 100 && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-4 py-2.5 rounded-xl border border-amber-500/20">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{totalWeightage < 100 ? `Allocate ${(100 - totalWeightage).toFixed(1)}% more weightage to reach exactly 100%.` : `Reduce weightage by ${(totalWeightage - 100).toFixed(1)}% to reach exactly 100%.`}</span>
                    </div>
                  )}
                  {goals.length < 3 && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-4 py-2.5 rounded-xl border border-amber-500/20">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Add at least {3 - goals.length} more goal(s). A minimum of 3 goals is required.</span>
                    </div>
                  )}
                  {totalWeightage === 100 && goals.length >= 3 && (
                    <div className="flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-4 py-2.5 rounded-xl border border-green-500/20">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>All weightage and goal count requirements successfully met.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quarterly Check-ins Timeline - Only show when sheet is locked/approved */}
        {isLocked && (
          <div className="glass rounded-3xl p-8 shadow-xl border border-skin-200/60 dark:border-skin-800/60 bg-white/40 dark:bg-skin-900/40 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-skin-200/50 dark:border-skin-800/50 pb-4">
              <h2 className="text-lg font-extrabold text-skin-900 dark:text-skin-50 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-accent" />
                <span>Quarterly Performance Check-ins</span>
              </h2>
              {currentWindow?.isOpen && (
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30 px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentWindow.label} Window Open</span>
                </Badge>
              )}
            </div>

            <QuarterTimeline goals={goals} cycle={sheet?.cycle} />

            {!currentWindow?.isOpen && (
              <Alert className="glass rounded-2xl border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 shadow-md">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="ml-2 font-medium">
                  No check-in window is currently active. Quarterly check-ins open during scheduled review periods: Q1 (July), Q2 (October), Q3 (January), Q4 (March/April).
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Goals Stack Header & List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between glass px-8 py-5 rounded-2xl border border-skin-200/60 dark:border-skin-800/60 bg-white/40 dark:bg-skin-900/40 shadow-sm">
            <h2 className="text-xl font-extrabold text-skin-900 dark:text-skin-50 flex items-center gap-3">
              <Target className="w-6 h-6 text-accent" />
              <span>Strategic Objectives ({goals.length})</span>
            </h2>
            {canEdit && (
              <Button 
                onClick={() => { setEditingGoal(null); setShowForm(true); }}
                size="sm"
                className="btn-3d px-5 py-4 rounded-xl bg-gradient-to-r from-accent-light to-accent-dark hover:from-accent hover:to-accent-dark text-white font-bold shadow-md shadow-accent/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Goal</span>
              </Button>
            )}
          </div>

          {/* Goal Cards Grid / Stack */}
          <div className="goal-stack space-y-6">
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
          </div>

          {/* Empty State */}
          {goals.length === 0 && (
            <div className="glass rounded-3xl p-16 text-center border border-dashed border-skin-300 dark:border-skin-700 bg-white/30 dark:bg-skin-900/30 shadow-xl space-y-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-skin-200 to-skin-300 dark:from-skin-800 dark:to-skin-700 flex items-center justify-center mx-auto shadow-2xl transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                <Target className="w-12 h-12 text-accent animate-pulse" />
              </div>

              <div className="space-y-2 max-w-md mx-auto relative z-10">
                <h3 className="text-2xl font-extrabold text-skin-900 dark:text-skin-50 tracking-tight">No Strategic Goals Configured</h3>
                <p className="text-skin-600 dark:text-skin-300 text-sm leading-relaxed">
                  Begin structuring your performance roadmap by adding your first objective. You need between 3 and 8 goals totaling exactly 100% weightage.
                </p>
              </div>

              {canEdit && (
                <Button 
                  onClick={() => { setEditingGoal(null); setShowForm(true); }}
                  className="btn-3d px-8 py-6 rounded-2xl bg-gradient-to-r from-accent-light to-accent-dark hover:from-accent hover:to-accent-dark text-white font-bold text-base shadow-xl shadow-accent/20 flex items-center gap-3 mx-auto relative z-10"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Goal</span>
                </Button>
              )}
            </div>
          )}
        </div>

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