// src/app/(dashboard)/employee/analytics/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  BarChart3,
  Target,
  CheckCircle,
  TrendingUp,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function EmployeeAnalyticsPage() {
  const { data: sheet, isLoading } = useQuery({
    queryKey: ["goalSheet"],
    queryFn: async () => {
      const res = await fetch("/api/employee/sheet");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const goals: any[] = sheet?.goals ?? [];
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const onTrack = goals.filter((g) => g.status === "on_track").length;
  const atRisk = goals.filter((g) => g.status === "at_risk").length;
  const avgProgress =
    totalGoals > 0
      ? Math.round(goals.reduce((sum: number, g: any) => sum + (g.progress ?? 0), 0) / totalGoals)
      : 0;

  const cards = [
    { label: "Total Goals", value: totalGoals, icon: <Target className="w-5 h-5" />, color: "#30b0d0" },
    { label: "Completed", value: completedGoals, icon: <CheckCircle className="w-5 h-5" />, color: "#22c55e" },
    { label: "On Track", value: onTrack, icon: <TrendingUp className="w-5 h-5" />, color: "#3b82f6" },
    { label: "At Risk", value: atRisk, icon: <BarChart3 className="w-5 h-5" />, color: "#f59e0b" },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "24rem" }}>
          <Loader2 className="w-8 h-8 animate-spin text-[#30b0d0]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "72rem", margin: "0 auto" }}>
        {/* Header */}
        <div className="hero-banner">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Sparkles className="w-5 h-5 text-[#30b0d0]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                My Analytics
              </span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.25rem" }}>
              Performance Overview
            </h1>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>
              Your goal progress and performance metrics at a glance
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))", gap: "1.25rem" }}>
          {cards.map((card) => (
            <div
              key={card.label}
              className="glass iso-card"
              style={{ padding: "1.5rem", borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.75rem",
                    background: `${card.color}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: card.color,
                  }}
                >
                  {card.icon}
                </div>
                <span style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.55)", fontWeight: 500 }}>{card.label}</span>
              </div>
              <p style={{ fontSize: "2.25rem", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Avg Progress */}
        <div className="glass" style={{ padding: "1.5rem", borderRadius: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#ede8e4" }}>Average Goal Progress</span>
            <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "#30b0d0" }}>{avgProgress}%</span>
          </div>
          <div style={{ height: "0.5rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
            <div
              style={{
                width: `${avgProgress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #30b0d0, #5cc8e0)",
                borderRadius: "9999px",
                transition: "width 0.8s ease",
              }}
            />
          </div>
        </div>

        {/* Goal breakdown table */}
        {goals.length > 0 && (
          <div className="glass" style={{ padding: "1.5rem", borderRadius: "1rem" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#ede8e4", marginBottom: "1rem" }}>Goal Breakdown</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {goals.map((g: any) => (
                <div
                  key={g.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ede8e4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.description}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)", marginTop: "0.125rem" }}>
                      {g.thrustArea?.name ?? "—"} · {g.weightage}%
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    <div style={{ width: "6rem", height: "0.375rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${g.progress ?? 0}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #30b0d0, #5cc8e0)",
                          borderRadius: "9999px",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0", width: "2.5rem", textAlign: "right" }}>
                      {g.progress ?? 0}%
                    </span>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "0.25rem 0.625rem",
                        borderRadius: "9999px",
                        background:
                          g.status === "completed" ? "rgba(34,197,94,0.15)" :
                          g.status === "on_track" ? "rgba(59,130,246,0.15)" :
                          g.status === "at_risk" ? "rgba(245,158,11,0.15)" :
                          "rgba(255,255,255,0.06)",
                        color:
                          g.status === "completed" ? "#22c55e" :
                          g.status === "on_track" ? "#60a5fa" :
                          g.status === "at_risk" ? "#fbbf24" :
                          "rgba(237,232,228,0.4)",
                        textTransform: "capitalize",
                      }}
                    >
                      {(g.status ?? "not_started").replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {goals.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem", color: "rgba(237,232,228,0.35)", fontSize: "0.9375rem" }}>
            No goals found. Start by adding goals to your sheet.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
