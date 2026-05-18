// src/components/dashboard/EmployeeDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalCard } from "@/components/goals/GoalCard";
import { WeightageChart } from "@/components/goals/WeightageChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Award,
  Layers,
  Compass,
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
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

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
      const res = await fetch("/api/uom-types");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: thrustAreas = [] } = useQuery({
    queryKey: ["thrustAreas"],
    queryFn: async () => {
      const res = await fetch("/api/thrust-areas");
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
  // UAT/Demo relaxed editing rules
  const canEdit = true;
  const canSubmit = !isLocked && !isSubmitted && goals.length >= 3 && goals.length <= 8 && Math.abs(totalWeightage - 100) < 0.01;

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
    setDeleteGoalId(id);
  };

  const getStatusBadge = () => {
    const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm";
    switch (sheet?.status) {
      case "draft": return <span className={`${baseClasses} bg-[rgba(255,112,67,0.1)] text-[#ff7043] border border-[rgba(255,112,67,0.2)]`}>Draft Sheet</span>;
      case "submitted": return <span className={`${baseClasses} bg-[rgba(92,200,224,0.1)] text-[#5cc8e0] border border-[rgba(92,200,224,0.2)]`}>Pending Approval</span>;
      case "locked": return <span className={`${baseClasses} bg-[rgba(34,197,94,0.1)] text-[#4ade80] border border-[rgba(34,197,94,0.2)]`}><Lock className="w-3.5 h-3.5" /> Locked &amp; Active</span>;
      case "rejected": return <span className={`${baseClasses} bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)]`}><RotateCcw className="w-3.5 h-3.5" /> Returned - Action Required</span>;
      default: return <span className={`${baseClasses} bg-[rgba(255,255,255,0.06)] text-[#ede8e4] border border-[rgba(255,255,255,0.1)]`}>Draft Sheet</span>;
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
                Goal Sheet Offline
              </h3>
              <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)", lineHeight: 1.6 }}>
                {queryError?.message || "There is no active goal setting cycle configured. Please contact your system administrator."}
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "76rem", margin: "0 auto", paddingBottom: "4rem" }}>
        
        {/* Sleek Top Workspace Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Target className="w-4 h-4 text-[#ff7043]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(237,232,228,0.5)" }}>
                ROADMAP CANVAS
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 className="font-serif-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffffff" }}>
                My Strategic Goals
              </h1>
              {getStatusBadge()}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {canEdit && (
              <button
                onClick={() => { setEditingGoal(null); setShowForm(true); }}
                className="login-btn login-btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem" }}
              >
                <Plus className="w-4 h-4" />
                <span>Create Goal</span>
              </button>
            )}
            {canEdit && goals.length > 0 && (
              <button
                onClick={() => submitSheet.mutate()}
                disabled={submitSheet.isPending || !canSubmit}
                className="login-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.8125rem",
                  opacity: canSubmit ? 1 : 0.5,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  background: canSubmit ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.04)",
                  color: canSubmit ? "#ffffff" : "rgba(237,232,228,0.4)",
                  border: canSubmit ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {submitSheet.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Submit Sheet</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Alerts block */}
        {error && (
          <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-sans-body" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.04)" }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-sans-body" style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{success}</span>
          </div>
        )}

        {/* Modern Widescreen Canvas Layout */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          
          {/* TOP HORIZONTAL SUMMARY DASHBOARD GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))", gap: "1.5rem" }}>
            
            {/* Health & Weightage Visual Card */}
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <TrendingUp className="w-4.5 h-4.5 text-[#ff7043]" />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 750, color: "#ffffff" }}>
                  Weightage Balance
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flex: 1 }}>
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "0.5rem", padding: "0.5rem", display: "flex", justifyContent: "center" }}>
                  <WeightageChart goals={goals} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "rgba(237,232,228,0.4)" }}>Allocated:</span>
                    <span style={{ fontWeight: 700, color: Math.abs(totalWeightage - 100) < 0.01 ? "#4ade80" : "#ffffff" }}>
                      {totalWeightage}%
                    </span>
                  </div>
                  <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(100, totalWeightage)}%`,
                      background: Math.abs(totalWeightage - 100) < 0.01
                        ? "#4ade80"
                        : totalWeightage > 100
                        ? "#f87171"
                        : "#ff7043",
                      transition: "all 0.5s ease"
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Health Requirements Card */}
            {canEdit ? (
              <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 style={{ fontSize: "0.8125rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(237,232,228,0.4)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Layers className="w-4 h-4 text-[#ff7043]" />
                  <span>Validation Health</span>
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, justifyContent: "center" }}>
                  {/* Goal Count Rule */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.75rem", color: goals.length >= 3 && goals.length <= 8 ? "#4ade80" : "rgba(237,232,228,0.6)" }}>
                    {goals.length >= 3 && goals.length <= 8 ? (
                      <CheckCircle className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-[2px]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#fbbf24] flex-shrink-0 mt-[2px]" />
                    )}
                    <span style={{ opacity: goals.length >= 3 && goals.length <= 8 ? 0.6 : 1, whiteSpace: "normal", wordWrap: "break-word" }}>
                      Roadmap contains 3-8 goals (Current: {goals.length})
                    </span>
                  </div>

                  {/* Weightage sum Rule */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.75rem", color: Math.abs(totalWeightage - 100) < 0.01 ? "#4ade80" : "rgba(237,232,228,0.6)" }}>
                    {Math.abs(totalWeightage - 100) < 0.01 ? (
                      <CheckCircle className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-[2px]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#fbbf24] flex-shrink-0 mt-[2px]" />
                    )}
                    <span style={{ opacity: Math.abs(totalWeightage - 100) < 0.01 ? 0.6 : 1, whiteSpace: "normal", wordWrap: "break-word" }}>
                      Total weight matches 100% exactly (Current: {totalWeightage}%)
                    </span>
                  </div>
                </div>

                {canSubmit && (
                  <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <Sparkles className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
                    <span style={{ fontSize: "0.725rem", color: "rgba(237,232,228,0.8)", fontWeight: 500 }}>
                      Sheet satisfies all operational requirements. Ready to submit!
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 style={{ fontSize: "0.8125rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(237,232,228,0.4)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <ShieldCheck className="w-4 h-4 text-[#ff7043]" />
                  <span>Validation Status</span>
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#4ade80", fontSize: "0.75rem" }}>
                    <CheckCircle className="w-4.5 h-4.5 text-[#4ade80]" />
                    <span style={{ fontWeight: 600 }}>Validation Succeeded</span>
                  </div>
                  <p style={{ fontSize: "0.725rem", color: "rgba(237,232,228,0.5)", lineHeight: 1.45 }}>
                    Your goal sheet has been locked and is under active cycle review. Individual check-ins can be completed during review windows.
                  </p>
                </div>
              </div>
            )}

            {/* Active Performance Period Card */}
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", color: "rgba(237,232,228,0.4)", letterSpacing: "0.05em" }}>
                Active Performance Period
              </span>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: 1 }}>
                <CalendarDays className="w-6 h-6 text-[#ff7043]" />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.9375rem", fontWeight: 750, color: "#ffffff" }}>
                    {sheet?.cycle?.name || "2026 Cycle"}
                  </span>
                  <span style={{ fontSize: "0.725rem", color: "rgba(237,232,228,0.45)", marginTop: "0.125rem" }}>
                    {currentWindow?.isOpen ? `${currentWindow.label} window is open` : "All review windows closed"}
                  </span>
                </div>
              </div>
              {currentWindow?.isOpen && (
                <div style={{ background: "rgba(92,200,224,0.06)", border: "1px solid rgba(92,200,224,0.15)", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "#5cc8e0", animation: "pulse 2s infinite" }}></span>
                  <span style={{ fontSize: "0.725rem", color: "#5cc8e0", fontWeight: 600 }}>Active Review Window</span>
                </div>
              )}
            </div>

          </div>

          {/* BOTTOM STRATEGIC WORKSPACE AREA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Manager Remarks Banner in workspace */}
            {sheet?.status === "rejected" && sheet?.rejectionReason && (
              <div className="alert-glass" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1.25rem 1.5rem", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}>
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 750, color: "#ffffff" }}>Manager Comments:</span>
                  <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.8)", lineHeight: 1.4 }}>{sheet.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Check-ins timeline workspace block */}
            {isLocked && (
              <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 750, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Clock className="w-4.5 h-4.5 text-[#ff7043]" />
                    <span>Quarterly Review Schedule</span>
                  </h3>
                  {currentWindow?.isOpen && (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4ade80" }}>
                      ● {currentWindow.label} Review Open
                    </span>
                  )}
                </div>

                <QuarterTimeline goals={goals} cycle={sheet?.cycle} />
              </div>
            )}

            {/* Goals Canvas Grid block */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", padding: "1rem 1.5rem", borderRadius: "0.75rem" }}>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 750, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Layers className="w-5 h-5 text-[#ff7043]" />
                  <span>Goal Cards Feed ({goals.length})</span>
                </h3>
                {canEdit && (
                  <button
                    onClick={() => { setEditingGoal(null); setShowForm(true); }}
                    className="login-btn login-btn-primary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", padding: "0.5rem 1rem" }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Objective</span>
                  </button>
                )}
              </div>

              {/* Grid display of cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
                    canCheckIn={isLocked}
                  />
                ))}

                {/* Workspace Empty State */}
                {goals.length === 0 && (
                  <div style={{ padding: "4rem 2rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                    <Target className="w-10 h-10 text-white/20 animate-pulse" />
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.25rem" }}>
                        Canvas Workspace Empty
                      </h4>
                      <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.45)", maxWidth: "26rem", margin: "0 auto", lineHeight: 1.5 }}>
                        No strategic goals are configured. Add a goal card using the button above to begin layout planning for this cycle.
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => { setEditingGoal(null); setShowForm(true); }}
                        className="login-btn login-btn-primary"
                        style={{ fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", marginTop: "0.5rem" }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Configure First Goal</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Goal Entry Dialog Form */}
      <GoalForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingGoal(null); }}
        onSubmit={editingGoal ? handleEditGoal : handleAddGoal}
        uomTypes={uomTypes}
        thrustAreas={thrustAreas}
        remainingWeightage={editingGoal ? remainingWeightage + Number(editingGoal.weightage) : remainingWeightage}
        editingGoal={editingGoal}
      />

      {/* Dynamic Review Check-in Form Modal */}
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

      {/* Custom Premium Delete Confirmation Dialog */}
      <Dialog open={!!deleteGoalId} onOpenChange={(open) => { if (!open) setDeleteGoalId(null); }}>
        <DialogContent className="glass-card" style={{ maxWidth: "26rem", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(20,20,20,0.85)", backdropFilter: "blur(20px)" }}>
          <DialogHeader>
            <DialogTitle className="font-serif-display" style={{ fontSize: "1.25rem", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle className="w-5 h-5 text-[#f87171]" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div style={{ padding: "1rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.7)", lineHeight: 1.5 }}>
              Are you sure you want to delete this strategic goal? This action will permanently remove it from your roadmap and recalculate your allocated weightage.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
              <button
                onClick={() => setDeleteGoalId(null)}
                className="login-btn"
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.8125rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ede8e4", borderRadius: "0.5rem" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteGoalId) {
                    deleteGoal.mutate(deleteGoalId);
                    setDeleteGoalId(null);
                  }
                }}
                disabled={deleteGoal.isPending}
                className="login-btn"
                style={{
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.8125rem",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#ffffff",
                  borderRadius: "0.5rem",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem"
                }}
              >
                {deleteGoal.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}