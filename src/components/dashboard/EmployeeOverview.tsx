// src/components/dashboard/EmployeeOverview.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CalendarDays,
  Layers,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import { getQuarterStatus } from "@/lib/checkin-window";

export function EmployeeOverview() {
  const { data: session } = useSession();

  // Fetch goal sheet
  const { data: sheet, isLoading } = useQuery({
    queryKey: ["goalSheet"],
    queryFn: async () => {
      const res = await fetch("/api/employee/sheet");
      if (!res.ok) throw new Error("Failed to fetch goal sheet");
      return res.json();
    },
  });

  const goals = sheet?.goals || [];
  const totalWeightage = goals.reduce((sum: number, g: any) => sum + Number(g.weightage), 0);
  const avgProgress =
    goals.length > 0
      ? Math.round(goals.reduce((sum: number, g: any) => sum + (g.progress ?? 0), 0) / goals.length)
      : 0;

  const currentWindow = sheet?.cycle ? getQuarterStatus(sheet.cycle) : null;

  const getStatusDisplay = () => {
    const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm";
    switch (sheet?.status) {
      case "draft":
        return {
          badge: <span className={`${baseClasses} bg-[rgba(255,255,255,0.06)] text-[#ede8e4] border border-[rgba(255,255,255,0.1)]`}>Draft Mode</span>,
          desc: "Your goal sheet is in draft mode. You can continue adding and modifying goals.",
          action: "/goals",
          actionText: "Manage Goals",
        };
      case "submitted":
        return {
          badge: <span className={`${baseClasses} bg-[rgba(48,176,208,0.1)] text-[#5cc8e0] border border-[rgba(48,176,208,0.2)] shimmer`}>Pending Approval</span>,
          desc: "Your goals have been submitted to your manager and are currently awaiting review.",
          action: "/goals",
          actionText: "Review Goals",
        };
      case "locked":
        return {
          badge: <span className={`${baseClasses} bg-[rgba(34,197,94,0.1)] text-[#4ade80] border border-[rgba(34,197,94,0.2)]`}><ShieldCheck className="w-3.5 h-3.5" /> Approved &amp; Locked</span>,
          desc: "Your goal sheet is approved and locked. You can now perform quarterly check-ins.",
          action: "/employee/checkins",
          actionText: "Quarterly Check-ins",
        };
      case "rejected":
        return {
          badge: <span className={`${baseClasses} bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] animate-pulse`}><RotateCcw className="w-3.5 h-3.5" /> Rework Required</span>,
          desc: "Your manager has returned your goal sheet with feedback. Please revise and resubmit.",
          action: "/goals",
          actionText: "Revise Goals",
        };
      default:
        return {
          badge: <span className={`${baseClasses} bg-[rgba(255,255,255,0.06)] text-[#ede8e4] border border-[rgba(255,255,255,0.1)]`}>Draft Mode</span>,
          desc: "Set up and define your performance goals for the active business cycle.",
          action: "/goals",
          actionText: "Create Goal Sheet",
        };
    }
  };

  const statusInfo = getStatusDisplay();

  const cards = [
    {
      label: "Average Progress",
      value: `${avgProgress}%`,
      sub: "Across all goals",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "#30b0d0",
    },
    {
      label: "Total Goals Defined",
      value: goals.length,
      sub: "3 to 8 recommended",
      icon: <Target className="w-5 h-5" />,
      color: "#a855f7",
    },
    {
      label: "Weightage Assigned",
      value: `${totalWeightage}%`,
      sub: "Must equal 100% to submit",
      icon: <Layers className="w-5 h-5" />,
      color: totalWeightage === 100 ? "#22c55e" : "#eab308",
    },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh" }}>
          <div className="animate-pulse" style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", border: "3px solid rgba(48,176,208,0.1)", borderTopColor: "#30b0d0", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>Loading Dashboard...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "72rem", margin: "0 auto", paddingBottom: "4rem" }}>
        
        {/* Hero Welcome Banner */}
        <div className="hero-banner">
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "24rem",
              height: "24rem",
              background: "radial-gradient(circle, rgba(48,176,208,0.08) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
              marginRight: "-5rem",
              marginTop: "-5rem",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Sparkles className="w-5 h-5 text-[#30b0d0]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Employee Portal
              </span>
            </div>
            <h1 className="font-serif-display" style={{ fontSize: "2rem", fontWeight: 600, color: "#ffffff" }}>
              Welcome back, {session?.user?.name || "Team Member"}!
            </h1>
            <p className="font-sans-body" style={{ fontSize: "0.9375rem", color: "rgba(237,232,228,0.6)", maxWidth: "40rem" }}>
              Track your strategic goals, record quarterly check-ins, and align your performance targets with the company vision.
            </p>
          </div>
        </div>

        {/* Goal Sheet Status Overview Panel */}
        <div className="glass" style={{ padding: "1.75rem", borderRadius: "1rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, minWidth: "20rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(237,232,228,0.5)" }}>Active Cycle Status</span>
              {statusInfo.badge}
            </div>
            <p style={{ fontSize: "0.9375rem", color: "#ede8e4", lineHeight: 1.5 }}>
              {statusInfo.desc}
            </p>
            {sheet?.status === "rejected" && sheet?.rejectionReason && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", fontSize: "0.8125rem", color: "#f87171" }}>
                <strong>Rejection Reason:</strong> {sheet.rejectionReason}
              </div>
            )}
          </div>
          <Link
            href={statusInfo.action}
            className="login-btn login-btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", fontSize: "0.875rem" }}
          >
            <span>{statusInfo.actionText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Metric Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(18rem, 1fr))", gap: "1.25rem" }}>
          {cards.map((card) => (
            <div
              key={card.label}
              className="glass iso-card"
              style={{ padding: "1.5rem", borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)", fontWeight: 500 }}>{card.label}</span>
                <div
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "0.75rem",
                    background: `${card.color}15`,
                    color: card.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {card.icon}
                </div>
              </div>
              <div>
                <p style={{ fontSize: "2rem", fontWeight: 700, color: "#ffffff", lineHeight: 1, marginBottom: "0.375rem" }}>
                  {card.value}
                </p>
                <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)" }}>
                  {card.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Two-Column Detail Panels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))", gap: "1.5rem" }}>
          
          {/* Active Goals Briefing */}
          <div className="glass" style={{ padding: "1.75rem", borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#ffffff" }}>My Goals Briefing</h2>
              <Link
                href="/goals"
                style={{ fontSize: "0.8125rem", color: "#30b0d0", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <span>Edit Sheet</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {goals.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 0", gap: "0.75rem", color: "rgba(237,232,228,0.35)" }}>
                <Target className="w-8 h-8 opacity-40" />
                <span style={{ fontSize: "0.875rem" }}>No goals defined yet</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {goals.slice(0, 4).map((g: any, index: number) => (
                  <div
                    key={g.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      padding: "0.875rem 1rem",
                      borderRadius: "0.75rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ede8e4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {index + 1}. {g.title}
                      </span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0" }}>
                        {g.progress ?? 0}%
                      </span>
                    </div>
                    <div style={{ height: "0.25rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${g.progress ?? 0}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #30b0d0, #5cc8e0)",
                        }}
                      />
                    </div>
                  </div>
                ))}
                {goals.length > 4 && (
                  <Link href="/goals" style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", textDecoration: "none", textAlign: "center", marginTop: "0.25rem" }}>
                    + {goals.length - 4} more goal{goals.length - 4 > 1 ? "s" : ""} on your sheet
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Business Cycle & Timeline */}
          <div className="glass" style={{ padding: "1.75rem", borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarDays className="w-5 h-5 text-[#30b0d0]" />
              <span>Timeline &amp; Check-ins</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(48,176,208,0.03)",
                  border: "1px solid rgba(48,176,208,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "#30b0d0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Active Performance Cycle
                </span>
                <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#ffffff" }}>
                  {sheet?.cycle?.name || "Active Cycle"} ({sheet?.cycle?.fiscalYear || "FY26"})
                </span>
              </div>

              {/* Quarter Status Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                  const isActive = currentWindow?.quarter === q && currentWindow?.isOpen;
                  
                  return (
                    <div
                      key={q}
                      style={{
                        padding: "0.875rem",
                        borderRadius: "0.75rem",
                        background: isActive ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.02)",
                        border: isActive 
                          ? "1px solid rgba(34,197,94,0.2)" 
                          : "1px solid rgba(255,255,255,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: isActive ? "#4ade80" : "#ede8e4" }}>
                        Quarter {q.substring(1)}
                      </span>
                      <span style={{ fontSize: "0.6875rem", color: isActive ? "#4ade80" : "rgba(237,232,228,0.4)" }}>
                        {isActive ? "Window Open" : "Inactive"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
