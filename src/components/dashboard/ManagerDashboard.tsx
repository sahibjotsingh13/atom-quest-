// src/components/dashboard/ManagerDashboard.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Users,
  Clock,
  CheckCircle,
  FileText,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  RotateCcw,
  MessageSquare,
  Activity,
  Sparkles,
} from "lucide-react";
import { CheckInReview } from "@/components/manager/CheckInReview";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  sheetId?: string;
  sheetStatus: string;
  goalCount: number;
  totalWeightage: number;
  avgProgress: number;
  checkinRate: number;
  submittedAt?: string;
}

interface TeamSummary {
  totalMembers: number;
  pendingApprovals: number;
  approvedSheets: number;
  draftSheets: number;
  noSheets: number;
  avgTeamProgress: number;
}

export function ManagerDashboard() {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [sheetDetail, setSheetDetail] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [edits, setEdits] = useState<Record<string, { targetValue?: number; weightage?: number }>>({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "checkins">("members");
  const [reviewingCheckIn, setReviewingCheckIn] = useState<any>(null);

  // Fetch team data
  const { data: teamData, isLoading } = useQuery({
    queryKey: ["managerTeam"],
    queryFn: async () => {
      const res = await fetch("/api/manager/team");
      if (!res.ok) throw new Error("Failed to fetch team");
      return res.json();
    },
  });

  // Fetch team check-ins
  const { data: checkIns = [], isLoading: isLoadingCheckIns } = useQuery({
    queryKey: ["managerCheckIns"],
    queryFn: async () => {
      const res = await fetch("/api/manager/checkins");
      if (!res.ok) throw new Error("Failed to fetch check-ins");
      return res.json();
    },
  });

  // Fetch specific sheet details when reviewing a member
  const fetchSheetDetail = async (sheetId: string) => {
    const res = await fetch(`/api/manager/sheets/${sheetId}`);
    if (!res.ok) throw new Error("Failed to fetch sheet details");
    const data = await res.json();
    setSheetDetail(data);

    // Initialize edits state
    const initialEdits: Record<string, { targetValue?: number; weightage?: number }> = {};
    data.goals?.forEach((g: any) => {
      initialEdits[g.id] = {
        targetValue: g.targetValue,
        weightage: g.weightage,
      };
    });
    setEdits(initialEdits);
    setShowReviewModal(true);
  };

  // Approve sheet mutation
  const approveSheet = useMutation({
    mutationFn: async (sheetId: string) => {
      const res = await fetch(`/api/manager/sheets/${sheetId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalUpdates: edits }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to approve sheet");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerTeam"] });
      setActionSuccess("Sheet approved successfully!");
      setShowReviewModal(false);
      setTimeout(() => setActionSuccess(""), 3000);
    },
    onError: (err: any) => {
      setActionError(err.message);
    },
  });

  // Reject sheet mutation
  const rejectSheet = useMutation({
    mutationFn: async ({ sheetId, reason }: { sheetId: string; reason: string }) => {
      const res = await fetch(`/api/manager/sheets/${sheetId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reject sheet");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerTeam"] });
      setActionSuccess("Sheet returned for rework.");
      setShowRejectDialog(false);
      setShowReviewModal(false);
      setRejectionReason("");
      setTimeout(() => setActionSuccess(""), 3000);
    },
    onError: (err: any) => {
      setActionError(err.message);
    },
  });

  // Unlock sheet mutation
  const unlockSheet = useMutation({
    mutationFn: async ({ sheetId, reason }: { sheetId: string; reason: string }) => {
      const res = await fetch(`/api/manager/sheets/${sheetId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to unlock sheet");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerTeam"] });
      setActionSuccess("Sheet unlocked for employee edits.");
      setShowReviewModal(false);
      setTimeout(() => setActionSuccess(""), 3000);
    },
    onError: (err: any) => {
      setActionError(err.message);
    },
  });

  const members: TeamMember[] = teamData?.members || [];
  const summary: TeamSummary = teamData?.summary || {
    totalMembers: 0,
    pendingApprovals: 0,
    approvedSheets: 0,
    draftSheets: 0,
    noSheets: 0,
    avgTeamProgress: 0,
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm";
    switch (status) {
      case "submitted": return <span className={`${baseClasses} bg-[rgba(48,176,208,0.1)] text-[#5cc8e0] border border-[rgba(48,176,208,0.2)] shimmer`}><Clock className="w-3.5 h-3.5" /> Pending Approval</span>;
      case "approved": return <span className={`${baseClasses} bg-[rgba(34,197,94,0.1)] text-[#4ade80] border border-[rgba(34,197,94,0.2)]`}><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case "locked": return <span className={`${baseClasses} bg-[rgba(34,197,94,0.1)] text-[#4ade80] border border-[rgba(34,197,94,0.2)]`}><Lock className="w-3.5 h-3.5" /> Locked</span>;
      case "draft": return <span className={`${baseClasses} bg-[rgba(255,255,255,0.06)] text-[#ede8e4] border border-[rgba(255,255,255,0.1)]`}>Draft Mode</span>;
      case "rejected": return <span className={`${baseClasses} bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)]`}><RotateCcw className="w-3.5 h-3.5" /> Rework Required</span>;
      default: return <span className={`${baseClasses} bg-[rgba(255,255,255,0.06)] text-[#ede8e4] border border-[rgba(255,255,255,0.1)]`}>No Sheet</span>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh" }}>
          <Loader2 className="w-12 h-12 animate-spin text-[#30b0d0]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "80rem", margin: "0 auto", paddingBottom: "4rem" }}>
        {/* Top Hero Banner */}
        <div className="hero-banner">
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "24rem",
              height: "24rem",
              background: "radial-gradient(circle, rgba(48,176,208,0.06) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
              marginRight: "-5rem",
              marginTop: "-5rem",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
                  Manager Overview
                </h1>
                {summary.pendingApprovals > 0 && (
                  <span
                    className="alert-glass"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.25rem 0.75rem",
                      color: "#fbbf24",
                      border: "1px solid rgba(245,158,11,0.2)",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      borderRadius: "9999px",
                    }}
                  >
                    <Clock className="w-3.5 h-3.5 animate-pulse" /> {summary.pendingApprovals} Pending Approval
                  </span>
                )}
              </div>
              <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.6)" }}>
                Monitor team strategic alignment, approve goal sheets, and review quarterly progress check-ins
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "4rem",
                  height: "4rem",
                  borderRadius: "1rem",
                  background: "linear-gradient(135deg, #30b0d0, #1a8ca8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 32px rgba(48,176,208,0.3)",
                  flexShrink: 0,
                }}
              >
                <Users className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {actionError && (
          <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-sans-body" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.05)" }}>
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-[#4ade80]" />
            <span className="font-sans-body" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{actionSuccess}</span>
          </div>
        )}

        {/* Team Summary Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          <div className="summary-card" style={{ padding: "1.5rem", borderRadius: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", background: "rgba(48,176,208,0.1)", border: "1px solid rgba(48,176,208,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Users className="w-6 h-6 text-[#30b0d0]" />
            </div>
            <div>
              <span className="font-sans-body" style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Total Team Size</span>
              <p className="font-serif-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffffff", marginTop: "0.25rem" }}>{summary.totalMembers}</p>
            </div>
          </div>

          <div className="summary-card" style={{ padding: "1.5rem", borderRadius: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", background: summary.pendingApprovals > 0 ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)", border: summary.pendingApprovals > 0 ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Clock className={`w-6 h-6 ${summary.pendingApprovals > 0 ? "text-[#fbbf24] animate-spin" : "text-[rgba(237,232,228,0.4)]"}`} />
            </div>
            <div>
              <span className="font-sans-body" style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Pending Approval</span>
              <p className="font-serif-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: summary.pendingApprovals > 0 ? "#fbbf24" : "#ffffff", marginTop: "0.25rem" }}>{summary.pendingApprovals}</p>
            </div>
          </div>

          <div className="summary-card" style={{ padding: "1.5rem", borderRadius: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CheckCircle2 className="w-6 h-6 text-[#4ade80]" />
            </div>
            <div>
              <span className="font-sans-body" style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Approved / Locked</span>
              <p className="font-serif-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffffff", marginTop: "0.25rem" }}>{summary.approvedSheets}</p>
            </div>
          </div>

          <div className="summary-card" style={{ padding: "1.5rem", borderRadius: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", background: "rgba(48,176,208,0.1)", border: "1px solid rgba(48,176,208,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Activity className="w-6 h-6 text-[#5cc8e0]" />
            </div>
            <div>
              <span className="font-sans-body" style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Avg Team Progress</span>
              <p className="font-serif-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ffffff", marginTop: "0.25rem" }}>{summary.avgTeamProgress.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* 3D Styled View Tabs */}
        <div className="glass" style={{ padding: "0.5rem", borderRadius: "1rem", display: "flex", gap: "0.5rem", width: "fit-content" }}>
          <button
            onClick={() => setActiveTab("members")}
            className="tab-btn font-sans-body"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              fontWeight: 700,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.3s ease",
              cursor: "pointer",
              border: "none",
              background: activeTab === "members" ? "linear-gradient(135deg, #30b0d0, #1a8ca8)" : "transparent",
              color: activeTab === "members" ? "#050a0f" : "rgba(237,232,228,0.6)",
              boxShadow: activeTab === "members" ? "0 4px 16px rgba(48,176,208,0.3)" : "none",
            }}
          >
            <Users className="w-4 h-4" />
            <span>Team Members ({members.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("checkins")}
            className="tab-btn font-sans-body"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              fontWeight: 700,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.3s ease",
              cursor: "pointer",
              border: "none",
              background: activeTab === "checkins" ? "linear-gradient(135deg, #30b0d0, #1a8ca8)" : "transparent",
              color: activeTab === "checkins" ? "#050a0f" : "rgba(237,232,228,0.6)",
              boxShadow: activeTab === "checkins" ? "0 4px 16px rgba(48,176,208,0.3)" : "none",
            }}
          >
            <Clock className="w-4 h-4" />
            <span>Quarterly Check-ins ({checkIns.length})</span>
          </button>
        </div>

        {/* Tab 1: Team Members Grid */}
        {activeTab === "members" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
            {members.map((m) => (
              <div
                key={m.id}
                className="glass-card"
                style={{
                  padding: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.4s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(48,176,208,0.2)";
                  e.currentTarget.style.boxShadow = "0 16px 32px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "3rem",
                        height: "3rem",
                        borderRadius: "0.75rem",
                        background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: "#ffffff",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-serif-display" style={{ fontSize: "1.125rem", fontWeight: 600, color: "#ffffff" }}>
                        {m.firstName} {m.lastName}
                      </h3>
                      <p className="font-sans-body" style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", marginTop: "0.125rem" }}>
                        ID: {m.employeeId}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(m.sheetStatus)}
                </div>

                {/* Metrics Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", padding: "1.25rem 0", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <span className="font-sans-body" style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Goals</span>
                    <p className="font-serif-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", marginTop: "0.25rem" }}>{m.goalCount || 0}</p>
                  </div>
                  <div>
                    <span className="font-sans-body" style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Weightage</span>
                    <p className="font-serif-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: m.totalWeightage === 100 ? "#4ade80" : "#fbbf24", marginTop: "0.25rem" }}>{m.totalWeightage || 0}%</p>
                  </div>
                  <div>
                    <span className="font-sans-body" style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Progress</span>
                    <p className="font-serif-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#5cc8e0", marginTop: "0.25rem" }}>{(m.avgProgress || 0).toFixed(1)}%</p>
                  </div>
                </div>

                {/* Action Button */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {m.sheetId ? (
                    <button
                      onClick={() => { setSelectedMember(m); fetchSheetDetail(m.sheetId!); }}
                      className="login-btn login-btn-primary"
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", padding: "0.625rem 1.25rem" }}
                    >
                      <Eye className="w-4 h-4" />
                      <span>{m.sheetStatus === "submitted" ? "Review & Approve" : "View Sheet"}</span>
                      <ChevronRight className="w-4 h-4 ml-0.5" />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="login-btn"
                      style={{ fontSize: "0.8125rem", padding: "0.625rem 1.25rem", opacity: 0.5, cursor: "not-allowed", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "rgba(237,232,228,0.4)" }}
                    >
                      No Sheet Created
                    </button>
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="empty-state" style={{ gridColumn: "1 / -1", padding: "4rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                <Users className="w-12 h-12 text-[rgba(237,232,228,0.3)] animate-pulse" />
                <h3 className="font-serif-display" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#ffffff" }}>No Team Members Found</h3>
                <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>Your direct reports will appear here once assigned in the system.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Check-ins List */}
        {activeTab === "checkins" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {checkIns.map((c: any) => {
              const goal = c.goal;
              const employee = goal?.goalSheet?.employee;
              return (
                <div
                  key={`${c.goalId}-${c.quarter}`}
                  className="glass-card"
                  style={{
                    padding: "1.5rem 2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "2rem",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(48,176,208,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flex: 1 }}>
                    <div
                      style={{
                        width: "3rem",
                        height: "3rem",
                        borderRadius: "0.75rem",
                        background: "rgba(48,176,208,0.1)",
                        border: "1px solid rgba(48,176,208,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Clock className="w-6 h-6 text-[#30b0d0]" />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <h4 className="font-serif-display" style={{ fontSize: "1.0625rem", fontWeight: 600, color: "#ffffff" }}>
                          {employee?.firstName} {employee?.lastName}
                        </h4>
                        <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", color: "#ede8e4", fontWeight: 600 }}>
                          {c.quarter}
                        </span>
                        {c.status === "completed" && <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "9999px", background: "rgba(34,197,94,0.1)", color: "#4ade80", fontWeight: 600 }}>Completed</span>}
                        {c.status === "on_track" && <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "9999px", background: "rgba(48,176,208,0.1)", color: "#5cc8e0", fontWeight: 600 }}>On Track</span>}
                        {c.status === "at_risk" && <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "9999px", background: "rgba(245,158,11,0.1)", color: "#fbbf24", fontWeight: 600 }}>At Risk</span>}
                      </div>
                      <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.7)" }}>
                        {goal?.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.4)", marginTop: "0.25rem" }}>
                        <span>Target: {goal?.targetValue}</span>
                        <span>•</span>
                        <span>Actual: {c.actualAchievement}</span>
                        {c.employeeComment && (
                          <>
                            <span>•</span>
                            <span style={{ color: "rgba(237,232,228,0.6)", fontStyle: "italic" }}>&quot;{c.employeeComment}&quot;</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setReviewingCheckIn(c)}
                    className="login-btn login-btn-primary"
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", padding: "0.625rem 1.25rem", flexShrink: 0 }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Provide Feedback</span>
                  </button>
                </div>
              );
            })}

            {checkIns.length === 0 && (
              <div className="empty-state" style={{ padding: "4rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                <Clock className="w-12 h-12 text-[rgba(237,232,228,0.3)] animate-pulse" />
                <h3 className="font-serif-display" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#ffffff" }}>No Check-ins Pending Review</h3>
                <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>Quarterly check-in updates submitted by your team will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Modal: Sheet Review & Approval */}
        {showReviewModal && sheetDetail && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
              background: "rgba(5, 10, 15, 0.8)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              className="modal-glass"
              style={{
                width: "100%",
                maxWidth: "64rem",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                borderRadius: "1.5rem",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              }}
            >
              {/* Modal Header */}
              <div style={{ padding: "1.75rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                <div>
                  <h3 className="font-serif-display" style={{ fontSize: "1.375rem", fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span>Review Goal Sheet</span>
                    {getStatusBadge(sheetDetail.status)}
                  </h3>
                  <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.6)", marginTop: "0.25rem" }}>
                    {selectedMember?.firstName} {selectedMember?.lastName} ({selectedMember?.employeeId}) • Cycle: {sheetDetail.cycle?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.75rem",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(237,232,228,0.6)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(237,232,228,0.6)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "2rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", color: "#5cc8e0", border: "1px solid rgba(48,176,208,0.2)", background: "rgba(48,176,208,0.05)" }}>
                  <Sparkles className="w-5 h-5 flex-shrink-0" />
                  <span className="font-sans-body" style={{ fontSize: "0.875rem" }}>
                    You can adjust targets and weightages directly before approving, or return the sheet to the employee with specific rework instructions.
                  </span>
                </div>

                {/* Goals Table / List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <h4 className="font-serif-display" style={{ fontSize: "1.125rem", fontWeight: 600, color: "#ffffff" }}>
                    Configured Objectives ({sheetDetail.goals?.length || 0})
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {sheetDetail.goals?.map((g: any, index: number) => (
                      <div
                        key={g.id}
                        style={{
                          padding: "1.5rem",
                          borderRadius: "1rem",
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1.25rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>
                              #{index + 1}
                            </span>
                            <h5 className="font-serif-display" style={{ fontSize: "1.0625rem", fontWeight: 600, color: "#ffffff" }}>
                              {g.title}
                            </h5>
                          </div>
                          {g.isShared && <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "9999px", background: "rgba(48,176,208,0.1)", color: "#5cc8e0", border: "1px solid rgba(48,176,208,0.2)", fontWeight: 600 }}>Shared Goal</span>}
                        </div>

                        {g.description && (
                          <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.7)", lineHeight: 1.6 }}>
                            {g.description}
                          </p>
                        )}

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.04)" }}>
                          <div style={{ flex: 1, minWidth: "140px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label className="font-sans-body" style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Target Value ({g.uomType?.name})</label>
                            <input
                              type="number"
                              value={edits[g.id]?.targetValue ?? g.targetValue}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setEdits((prev) => ({
                                  ...prev,
                                  [g.id]: { ...prev[g.id], targetValue: isNaN(val) ? 0 : val },
                                }));
                              }}
                              disabled={sheetDetail.status === "approved" || sheetDetail.status === "locked"}
                              style={{
                                width: "100%",
                                padding: "0.625rem 1rem",
                                borderRadius: "0.5rem",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#ffffff",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                outline: "none",
                              }}
                            />
                          </div>

                          <div style={{ flex: 1, minWidth: "140px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label className="font-sans-body" style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Weightage (%)</label>
                            <input
                              type="number"
                              value={edits[g.id]?.weightage ?? g.weightage}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setEdits((prev) => ({
                                  ...prev,
                                  [g.id]: { ...prev[g.id], weightage: isNaN(val) ? 0 : val },
                                }));
                              }}
                              disabled={sheetDetail.status === "approved" || sheetDetail.status === "locked"}
                              style={{
                                width: "100%",
                                padding: "0.625rem 1rem",
                                borderRadius: "0.5rem",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#ffffff",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                outline: "none",
                              }}
                            />
                          </div>

                          <div style={{ flex: 1, minWidth: "140px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <span className="font-sans-body" style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Thrust Area</span>
                            <div style={{ padding: "0.625rem 1rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "rgba(237,232,228,0.7)", fontSize: "0.875rem" }}>
                              {g.thrustArea?.name || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Weightage Verification */}
                {(() => {
                  const currentTotal = sheetDetail.goals?.reduce((sum: number, g: any) => sum + Number(edits[g.id]?.weightage ?? g.weightage), 0) || 0;
                  return (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="font-sans-body" style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(237,232,228,0.7)" }}>Adjusted Total Weightage:</span>
                      <span className="font-serif-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: Math.abs(currentTotal - 100) < 0.01 ? "#4ade80" : "#fbbf24" }}>
                        {currentTotal.toFixed(1)}% {Math.abs(currentTotal - 100) < 0.01 ? "✓ Valid" : "(! Must be exactly 100%)"}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer Actions */}
              <div style={{ padding: "1.5rem 2rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                <div>
                  {sheetDetail.status === "approved" || sheetDetail.status === "locked" ? (
                    <button
                      onClick={() => {
                        const reason = prompt("Enter reason for unlocking this sheet:");
                        if (reason) unlockSheet.mutate({ sheetId: sheetDetail.id, reason });
                      }}
                      disabled={unlockSheet.isPending}
                      className="login-btn"
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}
                    >
                      {unlockSheet.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                      <span>Unlock for Employee Edits</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowRejectDialog(true)}
                      className="login-btn"
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Return for Rework</span>
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="login-btn"
                    style={{ fontSize: "0.875rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(237,232,228,0.8)" }}
                  >
                    Cancel
                  </button>

                  {sheetDetail.status === "submitted" && (
                    <button
                      onClick={() => approveSheet.mutate(sheetDetail.id)}
                      disabled={approveSheet.isPending}
                      className="login-btn login-btn-primary"
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      {approveSheet.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Approve Goal Sheet</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Rejection / Return Reason */}
        {showRejectDialog && sheetDetail && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
              background: "rgba(5, 10, 15, 0.8)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              className="modal-glass"
              style={{
                width: "100%",
                maxWidth: "32rem",
                display: "flex",
                flexDirection: "column",
                borderRadius: "1.5rem",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ padding: "1.75rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <h3 className="font-serif-display" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <RotateCcw className="w-5 h-5 text-[#f87171]" />
                  <span>Return Sheet for Rework</span>
                </h3>
              </div>

              <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.7)", lineHeight: 1.6 }}>
                  Please provide clear, actionable feedback explaining what needs to be adjusted (e.g., target values, weightage distribution, or thrust area alignment).
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label className="font-sans-body" style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Rework Instructions / Feedback</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter specific feedback for the employee..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      borderRadius: "0.75rem",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      outline: "none",
                      resize: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: "1.5rem 2rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end", gap: "1rem", background: "rgba(255,255,255,0.02)" }}>
                <button
                  onClick={() => setShowRejectDialog(false)}
                  className="login-btn"
                  style={{ fontSize: "0.875rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(237,232,228,0.8)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectSheet.mutate({ sheetId: sheetDetail.id, reason: rejectionReason })}
                  disabled={rejectSheet.isPending || !rejectionReason.trim()}
                  className="login-btn login-btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", background: "linear-gradient(135deg, #ef4444, #dc2626)", opacity: rejectionReason.trim() ? 1 : 0.5 }}
                >
                  {rejectSheet.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  <span>Confirm Return</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Check-in Review Modal */}
        <CheckInReview
          open={!!reviewingCheckIn}
          onClose={() => setReviewingCheckIn(null)}
          checkIn={reviewingCheckIn}
        />
      </div>
    </AppLayout>
  );
}