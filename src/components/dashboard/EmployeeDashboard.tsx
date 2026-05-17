// src/components/dashboard/EmployeeDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
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
  const { data: sheet, isLoading, isError, error: queryError } = useQuery({
    queryKey: ["goalSheet"],
    queryFn: async () => {
      const res = await fetch("/api/employee/sheet");
      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg || "Failed to fetch goal sheet");
      }
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
    const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm";
    switch (sheet?.status) {
      case "draft": return <span className={`${baseClasses} bg-[rgba(255,255,255,0.06)] text-[#ede8e4] border border-[rgba(255,255,255,0.1)]`}>Draft Mode</span>;
      case "submitted": return <span className={`${baseClasses} bg-[rgba(48,176,208,0.1)] text-[#5cc8e0] border border-[rgba(48,176,208,0.2)] shimmer`}>Pending Approval</span>;
      case "locked": return <span className={`${baseClasses} bg-[rgba(34,197,94,0.1)] text-[#4ade80] border border-[rgba(34,197,94,0.2)]`}><Lock className="w-3.5 h-3.5" /> Approved &amp; Locked</span>;
      case "rejected": return <span className={`${baseClasses} bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] animate-pulse`}><RotateCcw className="w-3.5 h-3.5" /> Rejected - Action Required</span>;
      default: return <span className={`${baseClasses} bg-[rgba(255,255,255,0.06)] text-[#ede8e4] border border-[rgba(255,255,255,0.1)]`}>Draft Mode</span>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh" }}>
          <Loader2 className="w-12 h-12 animate-spin text-[#ff7043]" />
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "2rem", gap: "1.5rem" }}>
          <div className="glass-card" style={{ maxWidth: "36rem", width: "100%", padding: "2.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.02)" }}>
            <div style={{ width: "4rem", height: "4rem", borderRadius: "1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle className="w-8 h-8 text-[#f87171]" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h3 className="font-serif-display" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#ffffff" }}>
                Goal Sheet Unavailable
              </h3>
              <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)", lineHeight: 1.6 }}>
                {queryError?.message || "There is no active goal setting cycle configured at this moment. Please check back later or contact your system administrator."}
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "72rem", margin: "0 auto", paddingBottom: "4rem" }}>
        {/* Top Hero Banner */}
        <div className="hero-banner">
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "24rem",
              height: "24rem",
              background: "radial-gradient(circle, rgba(255,112,67,0.06) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
              marginRight: "-5rem",
              marginTop: "-5rem",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1
                className="font-serif-display"
                style={{
                  fontSize: "1.875rem",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  color: "#ffffff",
                  textShadow: "0 2px 24px rgba(0,0,0,0.45)",
                }}
              >
                My Goal Sheet
              </h1>
              {getStatusBadge()}
            </div>
            <p
              className="font-sans-body"
              style={{
                fontSize: "0.875rem",
                color: "rgba(237, 232, 228, 0.6)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <CalendarDays className="w-4 h-4 text-[#ff7043]" />
              <span>{sheet?.cycle?.name || "Current Performance Cycle"}</span>
              <span style={{ color: "rgba(237,232,228,0.2)" }}>•</span>
              <span style={{ color: "rgba(237,232,228,0.4)" }}>Manage, align, and track your strategic objectives</span>
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {canEdit && (
                <button
                  onClick={() => { setEditingGoal(null); setShowForm(true); }}
                  className="login-btn login-btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Goal</span>
                </button>
              )}
              {canEdit && goals.length > 0 && (
                <button
                  onClick={() => submitSheet.mutate()}
                  disabled={submitSheet.isPending || !canSubmit}
                  className="login-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.8125rem",
                    opacity: canSubmit ? 1 : 0.5,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    background: canSubmit
                      ? "linear-gradient(135deg, #22c55e, #16a34a)"
                      : "rgba(255,255,255,0.04)",
                    color: canSubmit ? "#ffffff" : "rgba(237,232,228,0.4)",
                    border: canSubmit ? "none" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {submitSheet.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Submit for Approval</span>
                </button>
              )}
              {isLocked && (
                <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", color: "#4ade80", fontWeight: 600, fontSize: "0.8125rem" }}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sheet Approved &amp; Locked</span>
                </div>
              )}
              {isSubmitted && (
                <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", color: "#fbbf24", fontWeight: 600, fontSize: "0.8125rem" }}>
                  <Clock className="w-4 h-4" />
                  <span>Awaiting Manager Review</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        {error && (
          <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-sans-body" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.05)" }}>
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-[#4ade80]" />
            <span className="font-sans-body" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{success}</span>
          </div>
        )}

        {/* Rejection Reason Banner */}
        {sheet?.status === "rejected" && sheet?.rejectionReason && (
          <div className="alert-glass" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1.25rem 1.5rem", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="font-sans-body">
              <strong style={{ display: "block", fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Returned for Rework by Manager:</strong>
              <span style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>{sheet.rejectionReason}</span>
            </div>
          </div>
        )}

        {/* Submit Hint Banner */}
        {canSubmit && (
          <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 1.5rem", color: "#ede8e4", border: "1px solid rgba(255,112,67,0.2)", background: "rgba(255,112,67,0.05)" }}>
            <Sparkles className="w-6 h-6 text-[#ff7043] animate-bounce flex-shrink-0" />
            <div className="font-sans-body">
              <strong style={{ display: "block", fontSize: "1rem", fontWeight: 700, marginBottom: "0.125rem", color: "#ffab91" }}>All Requirements Met!</strong>
              <span style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                Your goal sheet is fully balanced and configured. Click <strong style={{ color: "#ffffff" }}>&quot;Submit for Approval&quot;</strong> above to send it to your manager.
              </span>
            </div>
          </div>
        )}

        {/* Weightage Summary Dashboard Card */}
        <div className="glass-card" style={{ padding: "2rem", position: "relative", overflow: "hidden" }}>
          <h2
            className="font-serif-display"
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "#ffffff",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textShadow: "0 2px 24px rgba(0,0,0,0.45)",
            }}
          >
            <TrendingUp className="w-5 h-5 text-[#ff7043]" />
            <span>Weightage &amp; Alignment Distribution</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
            <WeightageChart goals={goals} />

            <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", fontWeight: 600 }}>
                  <span style={{ color: Math.abs(totalWeightage - 100) < 0.01 ? "#4ade80" : "#ede8e4" }}>
                    Allocated Weightage: {totalWeightage.toFixed(1)}%
                  </span>
                  <span style={{ color: "rgba(237,232,228,0.4)" }}>
                    Remaining: {remainingWeightage.toFixed(1)}%
                  </span>
                  <span style={{ color: "rgba(237,232,228,0.4)" }}>
                    Total Goals: {goals.length} / 8
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ position: "relative", height: "1rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden", padding: "2px" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "9999px",
                      transition: "all 1s ease",
                      width: `${Math.min(100, totalWeightage)}%`,
                      background: Math.abs(totalWeightage - 100) < 0.01
                        ? "linear-gradient(90deg, #22c55e, #16a34a)"
                        : totalWeightage > 100
                        ? "linear-gradient(90deg, #ef4444, #dc2626)"
                        : "linear-gradient(90deg, #ffab91, #d84315)",
                      boxShadow: Math.abs(totalWeightage - 100) < 0.01
                        ? "0 0 12px rgba(34,197,94,0.3)"
                        : totalWeightage > 100
                        ? "0 0 12px rgba(239,68,68,0.3)"
                        : "0 0 12px rgba(255,112,67,0.3)",
                    }}
                  />
                </div>
              </div>

              {/* Requirement Hints */}
              {canEdit && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {totalWeightage !== 100 && (
                    <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.05)", fontSize: "0.8125rem", fontWeight: 600 }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{totalWeightage < 100 ? `Allocate ${(100 - totalWeightage).toFixed(1)}% more weightage to reach exactly 100%.` : `Reduce weightage by ${(totalWeightage - 100).toFixed(1)}% to reach exactly 100%.`}</span>
                    </div>
                  )}
                  {goals.length < 3 && (
                    <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.05)", fontSize: "0.8125rem", fontWeight: 600 }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Add at least {3 - goals.length} more goal(s). A minimum of 3 goals is required.</span>
                    </div>
                  )}
                  {totalWeightage === 100 && goals.length >= 3 && (
                    <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", color: "#4ade80", border: "1px solid rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.05)", fontSize: "0.8125rem", fontWeight: 700 }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>All weightage and goal count requirements successfully met.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quarterly Check-ins Timeline */}
        {isLocked && (
          <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2
                className="font-serif-display"
                style={{ fontSize: "1.125rem", fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem", textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
              >
                <CalendarDays className="w-5 h-5 text-[#ff7043]" />
                <span>Quarterly Performance Check-ins</span>
              </h2>
              {currentWindow?.isOpen && (
                <span className="alert-glass" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.875rem", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", fontSize: "0.75rem", fontWeight: 700, borderRadius: "9999px", alignSelf: "flex-start" }}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentWindow.label} Window Open</span>
                </span>
              )}
            </div>

            <QuarterTimeline goals={goals} cycle={sheet?.cycle} />

            {!currentWindow?.isOpen && (
              <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.05)" }}>
                <Clock className="w-5 h-5 flex-shrink-0 text-[#fbbf24]" />
                <span className="font-sans-body" style={{ fontSize: "0.875rem" }}>
                  No check-in window is currently active. Quarterly check-ins open during scheduled review periods: Q1 (July), Q2 (October), Q3 (January), Q4 (March/April).
                </span>
              </div>
            )}
          </div>
        )}

        {/* Goals Stack Header & List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="glass" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderRadius: "1rem" }}>
            <h2
              className="font-serif-display"
              style={{ fontSize: "1.25rem", fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.75rem", textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
            >
              <Target className="w-6 h-6 text-[#ff7043]" />
              <span>Strategic Objectives ({goals.length})</span>
            </h2>
            {canEdit && (
              <button
                onClick={() => { setEditingGoal(null); setShowForm(true); }}
                className="login-btn login-btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Goal</span>
              </button>
            )}
          </div>

          {/* Goal Cards Grid / Stack */}
          <div className="goal-stack" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
            <div className="empty-state" style={{ padding: "4rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", position: "relative", overflow: "hidden" }}>
              <div
                style={{
                  width: "6rem",
                  height: "6rem",
                  borderRadius: "1.25rem",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <Target className="w-10 h-10 text-[#ff7043] animate-pulse" />
              </div>

              <div style={{ maxWidth: "28rem" }}>
                <h3 className="font-serif-display" style={{ fontSize: "1.5rem", fontWeight: 600, color: "#ffffff", marginBottom: "0.5rem", textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}>
                  No Strategic Goals Configured
                </h3>
                <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)", lineHeight: 1.7 }}>
                  Begin structuring your performance roadmap by adding your first objective. You need between 3 and 8 goals totaling exactly 100% weightage.
                </p>
              </div>

              {canEdit && (
                <button
                  onClick={() => { setEditingGoal(null); setShowForm(true); }}
                  className="login-btn login-btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", marginTop: "0.5rem" }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Goal</span>
                </button>
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