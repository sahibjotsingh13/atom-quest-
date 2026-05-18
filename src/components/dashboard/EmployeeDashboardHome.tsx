// src/components/dashboard/EmployeeDashboardHome.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Target,
  Clock,
  CalendarDays,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronRight,
  User,
  Activity,
  ArrowRight,
  Award,
  Plus,
  Compass,
  FileText,
  HelpCircle,
} from "lucide-react";
import { getQuarterStatus } from "@/lib/checkin-window";

// Beautiful SVG Circular Gauge for premium stats representation
function RadialProgress({ value, color, label }: { value: number; color: string; label: string }) {
  const radius = 38;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, value) / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
      <div style={{ position: "relative", width: "96px", height: "96px" }}>
        <svg style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)", filter: `drop-shadow(0 0 4px ${color}40)` }}
          />
        </svg>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "1.25rem",
          fontWeight: 800,
          color: "#ffffff"
        }}>
          {value}%
        </div>
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
    </div>
  );
}

export function EmployeeDashboardHome() {
  const { data: session } = useSession();
  const [greeting, setGreeting] = useState("Welcome");

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

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["recentNotifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return [];
      const data = await res.json();
      return data.slice(0, 4);
    },
  });

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good morning");
    else if (hr < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const goals = sheet?.goals || [];
  const totalWeightage = goals.reduce((sum: number, g: any) => sum + Number(g.weightage), 0);
  const remainingWeightage = Math.max(0, 100 - totalWeightage);
  const isLocked = sheet?.status === "locked" || sheet?.status === "approved";
  const isSubmitted = sheet?.status === "submitted";
  const isRejected = sheet?.status === "rejected";

  const averageProgress = goals.length > 0
    ? Math.round(goals.reduce((sum: number, g: any) => sum + (g.progress || 0), 0) / goals.length)
    : 0;

  const currentWindow = sheet?.cycle ? getQuarterStatus(sheet.cycle) : null;

  const getTimelineMilestones = () => {
    if (!sheet?.cycle) return [];
    return [
      { name: "Goal Setting", active: sheet.status !== "locked", current: sheet.status === "draft" || sheet.status === "rejected" },
      { name: "Q1 Mid-year", active: isLocked, current: currentWindow?.quarter === "Q1" },
      { name: "Q2 Review", active: isLocked, current: currentWindow?.quarter === "Q2" },
      { name: "Q3 Review", active: isLocked, current: currentWindow?.quarter === "Q3" },
      { name: "Annual Appraisal", active: isLocked, current: currentWindow?.quarter === "Q4" },
    ];
  };

  const milestones = getTimelineMilestones();

  const getStatusDisplay = () => {
    switch (sheet?.status) {
      case "draft":
        return {
          title: "Draft Mode",
          color: "#ff7043",
          bg: "rgba(255,112,67,0.06)",
          border: "rgba(255,112,67,0.25)",
          description: "Goal sheet is open for changes. Make sure you hit exactly 100% total weightage before submitting.",
        };
      case "submitted":
        return {
          title: "Awaiting Review",
          color: "#5cc8e0",
          bg: "rgba(92,200,224,0.06)",
          border: "rgba(92,200,224,0.25)",
          description: "Submitted for manager approval. You will receive an alert once reviews are finalized.",
        };
      case "locked":
        return {
          title: "Cycle Approved",
          color: "#4ade80",
          bg: "rgba(74,222,128,0.06)",
          border: "rgba(74,222,128,0.25)",
          description: "Goal sheet is locked. Ready for active quarterly check-ins and performance tracking.",
        };
      case "rejected":
        return {
          title: "Returned to Edit",
          color: "#f87171",
          bg: "rgba(248,113,113,0.06)",
          border: "rgba(248,113,113,0.25)",
          description: "Manager requested adjustments. Check the comments block below and edit the sheet.",
        };
      default:
        return {
          title: "Uninitialized",
          color: "rgba(237,232,228,0.4)",
          bg: "rgba(255,255,255,0.02)",
          border: "rgba(255,255,255,0.06)",
          description: "Goal setting cycle not active or sheet unavailable.",
        };
    }
  };

  const statusMeta = getStatusDisplay();

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "75vh" }}>
          <Loader2 className="w-12 h-12 animate-spin text-[#ff7043]" />
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "65vh", padding: "2rem", gap: "1.5rem" }}>
          <div className="glass-card" style={{ maxWidth: "36rem", width: "100%", padding: "2.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.02)" }}>
            <div style={{ width: "4rem", height: "4rem", borderRadius: "1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle className="w-8 h-8 text-[#f87171]" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h3 className="font-serif-display" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#ffffff" }}>
                Command Center Offline
              </h3>
              <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)", lineHeight: 1.6 }}>
                {queryError?.message || "There is no active performance cycle configured. Please check back later or reach out to your HR administrator."}
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
        
        {/* Futuristic Dashboard Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "1.25rem", flexWrap: "wrap", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles className="w-4 h-4 text-[#ff7043]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#ffab91" }}>
                Command Console
              </span>
            </div>
            <h1 className="font-serif-display" style={{ fontSize: "2rem", fontWeight: 750, color: "#ffffff", letterSpacing: "-0.01em" }}>
              {greeting}, {session?.user?.name || "Team Member"}
            </h1>
          </div>
          
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/goals" className="login-btn login-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", textDecoration: "none", padding: "0.625rem 1.25rem" }}>
              <Target className="w-4 h-4" />
              <span>Goals Canvas</span>
            </Link>
          </div>
        </div>

        {/* Manager Rejection Banner */}
        {sheet?.status === "rejected" && (
          <div className="alert-glass" style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.25rem 1.5rem", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.05)", borderRadius: "0.75rem" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="font-sans-body" style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: "0.9375rem", fontWeight: 750, marginBottom: "0.25rem", color: "#ffffff" }}>
                Goal Sheet Returned for Rework
              </strong>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.5, color: "rgba(237,232,228,0.85)" }}>
                &quot;{sheet.rejectionReason || "Please adjust weights or goal alignments."}&quot;
              </p>
              <Link href="/goals" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", marginTop: "0.75rem", fontSize: "0.8125rem", color: "#ffab91", fontWeight: 700, textDecoration: "none" }}>
                <span>Re-align Goals Sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Main 3-Column Command Hub */}
        <div style={{ display: "grid", gridTemplateColumns: "20rem 1fr 20rem", gap: "2rem", alignItems: "start" }}>
          
          {/* COLUMN 1: Profile & Review Pathway */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Employee Profile Glass Container */}
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(255,112,67,0.1), rgba(255,112,67,0.01))",
                  border: "1px solid rgba(255,112,67,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <User className="w-5 h-5 text-[#ff7043]" />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 750, color: "#ffffff" }}>
                    {session?.user?.name || "Active Employee"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)" }}>
                    {session?.user?.email || "atomberg.com"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                  <span style={{ color: "rgba(237,232,228,0.45)" }}>Department:</span>
                  <span style={{ fontWeight: 600, color: "#ffffff" }}>{sheet?.employee?.department?.name || "Engineering"}</span>
                </div>
                {sheet?.employee?.manager && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "rgba(237,232,228,0.45)" }}>Approver Manager:</span>
                    <span style={{ fontWeight: 600, color: "#ff7043" }}>{sheet.employee.manager.name}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                  <span style={{ color: "rgba(237,232,228,0.45)" }}>Active Cycle:</span>
                  <span style={{ fontWeight: 600, color: "#ffffff", textAlign: "right" }}>{sheet?.cycle?.name || "2026 Appraisal"}</span>
                </div>
              </div>
            </div>

            {/* Vertical Pathway Timeline */}
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h3 style={{ fontSize: "0.8125rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(237,232,228,0.4)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Compass className="w-4 h-4 text-[#ff7043]" />
                <span>Review Pathway</span>
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative", paddingLeft: "1.25rem" }}>
                <div style={{ position: "absolute", top: "0.5rem", bottom: "0.5rem", left: "4px", width: "2px", background: "rgba(255,255,255,0.06)" }} />
                
                {milestones.map((ms, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.125rem", position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      left: "-21px",
                      top: "4px",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: ms.current ? "#ff7043" : ms.active ? "#4ade80" : "rgba(255,255,255,0.1)",
                      boxShadow: ms.current ? "0 0 8px #ff7043" : "none",
                      border: "2px solid #0a1118"
                    }} />
                    <span style={{ fontSize: "0.8125rem", fontWeight: ms.current ? 750 : 600, color: ms.current ? "#ff7043" : ms.active ? "#ffffff" : "rgba(237,232,228,0.4)" }}>
                      {ms.name}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "rgba(237,232,228,0.3)" }}>
                      {ms.current ? "Current Stage" : ms.active ? "Completed/Ready" : "Upcoming"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLUMN 2: Performance Control Deck & Quick Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Core Circular Metrics Deck */}
            <div className="glass-card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 750, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <TrendingUp className="w-5 h-5 text-[#ff7043]" />
                  <span>Performance Ring Deck</span>
                </h3>
                <span style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)", fontWeight: 600 }}>
                  Active Scorecard values
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-around", padding: "1rem 0", flexWrap: "wrap", gap: "1.5rem" }}>
                {/* Gauge 1: Allocated Weight */}
                <RadialProgress
                  value={totalWeightage}
                  color={Math.abs(totalWeightage - 100) < 0.01 ? "#4ade80" : "#ff7043"}
                  label="Weight Balanced"
                />

                {/* Gauge 2: Average Scorecard Progress */}
                <RadialProgress
                  value={averageProgress}
                  color="#4ade80"
                  label="Average Progress"
                />
              </div>

              <div className="alert-glass" style={{ border: `1px solid ${statusMeta.border}`, background: statusMeta.bg, padding: "1.25rem", borderRadius: "0.75rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <Award className="w-5 h-5 flex-shrink-0" style={{ color: statusMeta.color }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 750, color: "#ffffff" }}>
                    Status: {statusMeta.title}
                  </span>
                  <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.55)", lineHeight: 1.4 }}>
                    {statusMeta.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <Link href="/goals" style={{ textDecoration: "none" }}>
                <div className="glass-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "all 0.2s", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "rgba(255,112,67,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus className="w-5 h-5 text-[#ff7043]" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 750, color: "#ffffff" }}>Edit Goals</span>
                    <span style={{ fontSize: "0.6875rem", color: "rgba(237,232,228,0.4)" }}>Modify Sheet</span>
                  </div>
                </div>
              </Link>

              <Link href="/employee/checkins" style={{ textDecoration: "none" }}>
                <div className="glass-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "all 0.2s", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "rgba(74,222,128,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity className="w-5 h-5 text-[#4ade80]" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 750, color: "#ffffff" }}>Check-ins</span>
                    <span style={{ fontSize: "0.6875rem", color: "rgba(237,232,228,0.4)" }}>Enter Updates</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Custom Interactive Quick Guide */}
            <div className="glass" style={{ padding: "1.5rem", borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 750, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <HelpCircle className="w-4 h-4 text-[#ff7043]" />
                <span>Guideline Center</span>
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.75rem", color: "rgba(237,232,228,0.6)" }}>
                  <span style={{ color: "#ff7043" }}>•</span>
                  <span>Goal count must be between 3 and 8 at all times.</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.75rem", color: "rgba(237,232,228,0.6)" }}>
                  <span style={{ color: "#ff7043" }}>•</span>
                  <span>Total allocated weightage of all goals must equal exactly 100%.</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.75rem", color: "rgba(237,232,228,0.6)" }}>
                  <span style={{ color: "#ff7043" }}>•</span>
                  <span>Once your goal sheet is locked, you can submit check-ins.</span>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 3: Active Goals Overview & Logs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Active Goals Feed Stack */}
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "0.8125rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(237,232,228,0.4)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Target className="w-4 h-4 text-[#ff7043]" />
                  <span>Strategic Priorities ({goals.length})</span>
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {goals.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1.5rem 0", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "0.5rem" }}>
                    <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)" }}>No objectives configured.</p>
                  </div>
                ) : (
                  goals.map((g: any) => (
                    <div key={g.id} style={{ display: "flex", flexDirection: "column", gap: "0.375rem", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "0.5rem" }}>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 750, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {g.title}
                      </span>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "rgba(237,232,228,0.45)" }}>
                        <span>Weight: {g.weightage}%</span>
                        <span style={{ color: "#4ade80" }}>Progress: {g.progress || 0}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Terminal Style Actions Log Feed */}
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", background: "rgba(5,10,15,0.6)", border: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Activity className="w-4 h-4 text-[#4ade80]" />
                <h3 style={{ fontSize: "0.8125rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(237,232,228,0.4)" }}>
                  Activity Terminal
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontFamily: "monospace", fontSize: "0.75rem" }}>
                {notifications.length === 0 ? (
                  <div style={{ color: "rgba(237,232,228,0.3)", textAlign: "center", padding: "1rem 0" }}>
                    &gt; NO RECENT SYSTEM LOGS
                  </div>
                ) : (
                  notifications.map((notif: any) => (
                    <div key={notif.id} style={{ display: "flex", flexDirection: "column", gap: "0.125rem", borderLeft: "2px solid rgba(255,112,67,0.3)", paddingLeft: "0.5rem" }}>
                      <span style={{ color: "#ede8e4", fontWeight: 600 }}>
                        &gt; {notif.title}
                      </span>
                      <span style={{ color: "rgba(237,232,228,0.4)" }}>
                        {notif.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </AppLayout>
  );
}
