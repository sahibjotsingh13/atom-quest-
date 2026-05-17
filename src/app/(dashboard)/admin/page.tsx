// src/app/(dashboard)/admin/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Users,
  FileText,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Target,
  Loader2,
  Lock,
  AlertTriangle,
  History,
  Sparkles,
  Shield,
} from "lucide-react";

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "24rem" }}>
          <Loader2 className="w-8 h-8 animate-spin text-[#30b0d0]" />
        </div>
      </AppLayout>
    );
  }

  const { overview, checkIns, goals, thrustAreas, cycle } = data || {};

  const statusColorMap: Record<string, { bg: string; text: string }> = {
    not_started: { bg: "rgba(255,255,255,0.06)", text: "rgba(237,232,228,0.4)" },
    on_track:    { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa" },
    completed:   { bg: "rgba(34,197,94,0.15)",   text: "#22c55e" },
    at_risk:     { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
  };

  const quickActions = [
    { label: "Push Shared Goals", href: "/admin/shared-goals", icon: <Target className="w-5 h-5" />, color: "#30b0d0" },
    { label: "Manage Sheets",    href: "/admin/sheets",        icon: <FileText className="w-5 h-5" />, color: "#a78bfa" },
    { label: "Manage Cycles",   href: "/admin/cycles",         icon: <History className="w-5 h-5" />, color: "#f59e0b" },
    { label: "View Escalations",href: "/admin/escalations",    icon: <AlertTriangle className="w-5 h-5" />, color: "#f87171" },
  ];

  const statCards = [
    { label: "Total Employees", value: overview?.totalEmployees ?? 0,  icon: <Users className="w-5 h-5" />,      color: "#30b0d0" },
    { label: "Submitted",       value: overview?.sheetsSubmitted ?? 0,  icon: <FileText className="w-5 h-5" />,   color: "#f59e0b", sub: `${overview?.submissionRate ?? 0}% rate` },
    { label: "Approved",        value: overview?.sheetsApproved ?? 0,   icon: <CheckCircle className="w-5 h-5" />, color: "#22c55e" },
    { label: "Locked",          value: overview?.sheetsLocked ?? 0,     icon: <Lock className="w-5 h-5" />,       color: "#a78bfa" },
  ];

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "80rem", margin: "0 auto" }}>
        {/* Header */}
        <div className="hero-banner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Sparkles className="w-5 h-5 text-[#30b0d0]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Admin Control Center
              </span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.25rem" }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>
              {cycle ? `${cycle.name} · FY ${cycle.fiscalYear}` : "No active cycle"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.25rem", borderRadius: "1rem", background: "linear-gradient(135deg, rgba(48,176,208,0.15), rgba(92,200,224,0.05))", border: "1px solid rgba(48,176,208,0.2)", flexShrink: 0 }}>
            <Shield className="w-8 h-8 text-[#30b0d0]" />
            {cycle && (
              <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px", background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                Active Cycle
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))", gap: "1rem" }}>
          {quickActions.map((a) => (
            <button
              key={a.href}
              onClick={() => (window.location.href = a.href)}
              className="glass iso-card"
              style={{ padding: "1.25rem", borderRadius: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", border: "none", cursor: "pointer", transition: "all 0.3s ease" }}
            >
              <div style={{ width: "3rem", height: "3rem", borderRadius: "0.875rem", background: `${a.color}18`, border: `1px solid ${a.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: a.color }}>
                {a.icon}
              </div>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "rgba(237,232,228,0.8)" }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: "1.25rem" }}>
          {statCards.map((c) => (
            <div key={c.label} className="glass iso-card" style={{ padding: "1.5rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: `${c.color}20`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color }}>
                  {c.icon}
                </div>
                <span style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", fontWeight: 500 }}>{c.label}</span>
              </div>
              <p style={{ fontSize: "2.25rem", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>{c.value}</p>
              {c.sub && (
                <>
                  <div style={{ height: "0.25rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden", marginTop: "0.75rem" }}>
                    <div style={{ width: `${overview?.submissionRate ?? 0}%`, height: "100%", background: "linear-gradient(90deg, #30b0d0, #5cc8e0)", borderRadius: "9999px" }} />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.35)", marginTop: "0.375rem" }}>{c.sub}</p>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Check-in Activity */}
          <div className="glass" style={{ borderRadius: "1rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
              <TrendingUp className="w-4 h-4 text-[#30b0d0]" />
              <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#ede8e4" }}>Check-in Activity</h2>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)" }}>Completion Rate</span>
                <span style={{ fontWeight: 700, color: "#30b0d0" }}>{checkIns?.completionRate ?? 0}%</span>
              </div>
              <div style={{ height: "0.375rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: `${checkIns?.completionRate ?? 0}%`, height: "100%", background: "linear-gradient(90deg, #30b0d0, #5cc8e0)", borderRadius: "9999px" }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(checkIns?.byQuarter ?? []).map((q: any) => (
                <div key={q.quarter} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderRadius: "0.625rem", background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "rgba(48,176,208,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 800, color: "#30b0d0" }}>
                      {q.quarter}
                    </div>
                    <span style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.6)" }}>Check-ins</span>
                  </div>
                  <span style={{ fontWeight: 700, color: "#ede8e4" }}>{q.count}</span>
                </div>
              ))}
              {(!checkIns?.byQuarter || checkIns.byQuarter.length === 0) && (
                <p style={{ textAlign: "center", padding: "1rem 0", fontSize: "0.875rem", color: "rgba(237,232,228,0.3)" }}>No check-ins yet</p>
              )}
            </div>
          </div>

          {/* Goal Status */}
          <div className="glass" style={{ borderRadius: "1rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
              <BarChart3 className="w-4 h-4 text-[#30b0d0]" />
              <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#ede8e4" }}>Goal Status Distribution</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(goals?.byStatus ?? []).map((g: any) => {
                const c = statusColorMap[g.status] ?? statusColorMap.not_started;
                return (
                  <div key={g.status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderRadius: "0.625rem", background: "rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "9999px", background: c.bg, color: c.text, textTransform: "capitalize" }}>
                      {g.status.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontWeight: 700, color: "#ede8e4" }}>{g.count} goals</span>
                  </div>
                );
              })}
              {(!goals?.byStatus || goals.byStatus.length === 0) && (
                <p style={{ textAlign: "center", padding: "1rem 0", fontSize: "0.875rem", color: "rgba(237,232,228,0.3)" }}>No goals yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Thrust Areas */}
        <div className="glass" style={{ borderRadius: "1rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
            <Target className="w-4 h-4 text-[#30b0d0]" />
            <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#ede8e4" }}>Top Thrust Areas</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {(thrustAreas ?? []).map((t: any, i: number) => {
              const max = thrustAreas?.[0]?.goalCount || 1;
              const pct = Math.round((t.goalCount / max) * 100);
              return (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "rgba(237,232,228,0.3)", width: "1.25rem" }}>{i + 1}</span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#ede8e4", width: "12rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                  <div style={{ flex: 1, height: "0.375rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #30b0d0, #5cc8e0)", borderRadius: "9999px" }} />
                  </div>
                  <span style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.45)", width: "5rem", textAlign: "right" }}>{t.goalCount} goals</span>
                </div>
              );
            })}
            {(!thrustAreas || thrustAreas.length === 0) && (
              <p style={{ textAlign: "center", padding: "1rem 0", fontSize: "0.875rem", color: "rgba(237,232,228,0.3)" }}>No thrust area data</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
