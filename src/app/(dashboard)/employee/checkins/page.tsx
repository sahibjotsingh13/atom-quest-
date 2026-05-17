// src/app/(dashboard)/employee/checkins/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2, CalendarDays, CheckCircle, Clock, Sparkles } from "lucide-react";
import { QuarterTimeline } from "@/components/checkin/QuarterTimeline";

export default function EmployeeCheckInsPage() {
  const { data: sheet, isLoading } = useQuery({
    queryKey: ["goalSheet"],
    queryFn: async () => {
      const res = await fetch("/api/employee/sheet");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const goals = sheet?.goals || [];
  const isLocked = sheet?.status === "locked";

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
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "72rem", margin: "0 auto", paddingBottom: "4rem" }}>
        
        {/* Header */}
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

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Sparkles className="w-5 h-5 text-[#30b0d0]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Progress Journal
              </span>
            </div>
            <h1 className="font-serif-display" style={{ fontSize: "2rem", fontWeight: 600, color: "#ffffff" }}>
              My Check-ins
            </h1>
            <p className="font-sans-body" style={{ fontSize: "0.9375rem", color: "rgba(237,232,228,0.6)" }}>
              Track and record your quarterly milestones and accomplishments
            </p>
          </div>
        </div>

        {!isLocked && (
          <div className="alert-glass" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1.25rem 1.5rem", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.05)" }}>
            <Clock className="w-5 h-5 flex-shrink-0" />
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Your goal sheet is pending approval. Check-ins will become available after manager approval.
            </span>
          </div>
        )}

        {isLocked && (
          <>
            <div className="glass" style={{ padding: "1.75rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <CalendarDays className="w-5 h-5 text-[#30b0d0]" />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#ffffff" }}>
                  Quarterly Progress Overview
                </h2>
              </div>
              <QuarterTimeline goals={goals} cycle={sheet?.cycle} />
            </div>

            {/* Goal Check-in Status */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>Goal Details</h2>
              {goals.map((goal: any, idx: number) => (
                <div key={goal.id} className="glass" style={{ padding: "1.75rem", borderRadius: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    <div>
                      <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "#ffffff" }}>
                        #{idx + 1} {goal.title}
                      </h3>
                      <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", marginTop: "0.25rem" }}>
                        UoM: <strong style={{ color: "#30b0d0" }}>{goal.uomType?.name}</strong> · Weightage: <strong style={{ color: "#ede8e4" }}>{goal.weightage}%</strong>
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "0.25rem 0.625rem",
                        borderRadius: "9999px",
                        background:
                          goal.status === "completed" ? "rgba(34,197,94,0.15)" :
                          goal.status === "on_track" ? "rgba(59,130,246,0.15)" :
                          goal.status === "at_risk" ? "rgba(245,158,11,0.15)" :
                          "rgba(255,255,255,0.06)",
                        color:
                          goal.status === "completed" ? "#22c55e" :
                          goal.status === "on_track" ? "#60a5fa" :
                          goal.status === "at_risk" ? "#fbbf24" :
                          "rgba(237,232,228,0.4)",
                        textTransform: "capitalize",
                      }}
                    >
                      {(goal.status ?? "not_started").replace(/_/g, " ")}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))", gap: "1rem" }}>
                    {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                      const actual = goal[`${q.toLowerCase()}Actual`];
                      const qStatus = goal[`${q.toLowerCase()}Status`];
                      const hasFeedback = goal[`${q.toLowerCase()}Comment`];

                      const checkedIn = actual !== null && actual !== undefined;

                      return (
                        <div
                          key={q}
                          style={{
                            padding: "1rem",
                            borderRadius: "0.75rem",
                            background: checkedIn ? "rgba(34,197,94,0.03)" : "rgba(255,255,255,0.02)",
                            border: checkedIn 
                              ? "1px solid rgba(34,197,94,0.15)" 
                              : "1px solid rgba(255,255,255,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: checkedIn ? "#4ade80" : "rgba(237,232,228,0.5)" }}>{q} Status</span>
                            {checkedIn ? (
                              <CheckCircle className="w-4 h-4 text-[#4ade80]" />
                            ) : (
                              <Clock className="w-4 h-4 text-rgba(237,232,228,0.3)" />
                            )}
                          </div>
                          {checkedIn ? (
                            <>
                              <p style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>
                                {goal.uomType?.code === "timeline"
                                  ? new Date(actual).toLocaleDateString()
                                  : actual}
                              </p>
                              <p style={{ fontSize: "0.6875rem", color: "rgba(237,232,228,0.5)", textTransform: "capitalize" }}>
                                Status: {qStatus}
                              </p>
                              {hasFeedback && (
                                <p style={{ fontSize: "0.6875rem", color: "#4ade80", marginTop: "0.25rem", fontWeight: 600 }}>
                                  ✓ Manager Feedback Added
                                </p>
                              )}
                            </>
                          ) : (
                            <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.3)" }}>
                              Not Checked In
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {goal.progressScore && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                        <span style={{ color: "rgba(237,232,228,0.5)" }}>Overall Goal Progress</span>
                        <span style={{ fontWeight: 700, color: "#30b0d0" }}>{Number(goal.progressScore).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: "0.375rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Number(goal.progressScore)}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #30b0d0, #5cc8e0)",
                            borderRadius: "9999px",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
