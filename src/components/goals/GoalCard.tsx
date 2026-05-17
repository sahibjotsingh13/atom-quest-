// src/components/goals/GoalCard.tsx
"use client";

import { Target, TrendingUp, Calendar, Edit2, Trash2, Lock, CheckCircle2, Circle } from "lucide-react";

interface GoalCardProps {
  goal: any;
  index: number;
  isEditable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCheckIn: () => void;
}

export function GoalCard({ goal, index, isEditable, onEdit, onDelete, onCheckIn }: GoalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started": return { bg: "rgba(255,255,255,0.04)", text: "rgba(237,232,228,0.6)", border: "rgba(255,255,255,0.08)" };
      case "on_track": return { bg: "rgba(48,176,208,0.08)", text: "#5cc8e0", border: "rgba(48,176,208,0.15)" };
      case "completed": return { bg: "rgba(34,197,94,0.08)", text: "#4ade80", border: "rgba(34,197,94,0.15)" };
      case "at_risk": return { bg: "rgba(245,158,11,0.08)", text: "#fbbf24", border: "rgba(245,158,11,0.15)" };
      case "delayed": return { bg: "rgba(239,68,68,0.08)", text: "#f87171", border: "rgba(239,68,68,0.15)" };
      default: return { bg: "rgba(255,255,255,0.04)", text: "rgba(237,232,228,0.6)", border: "rgba(255,255,255,0.08)" };
    }
  };

  const formatTarget = () => {
    if (goal.uomType?.code === "timeline" && goal.targetDate) {
      return new Date(goal.targetDate).toLocaleDateString();
    }
    if (goal.uomType?.code?.includes("percentage")) {
      return `${goal.targetValue}%`;
    }
    return goal.targetValue?.toLocaleString();
  };

  const statusColors = getStatusColor(goal.status);

  return (
    <div
      className="goal-stack-item"
      style={{
        padding: "1.5rem",
        borderRadius: "1rem",
        background: goal.isShared ? "rgba(48,176,208,0.03)" : "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: goal.isShared ? "1px solid rgba(48,176,208,0.15)" : "1px solid rgba(255,255,255,0.06)",
        boxShadow: goal.isShared ? "0 8px 32px rgba(48,176,208,0.06)" : "none",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.5s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(48,176,208,0.2)";
        e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = goal.isShared ? "rgba(48,176,208,0.15)" : "rgba(255,255,255,0.06)";
        e.currentTarget.style.boxShadow = goal.isShared ? "0 8px 32px rgba(48,176,208,0.06)" : "none";
      }}
    >
      {/* Decorative glow */}
      <div
        style={{
          position: "absolute",
          top: "-5rem",
          right: "-5rem",
          width: "10rem",
          height: "10rem",
          background: "radial-gradient(circle, rgba(48,176,208,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", position: "relative", zIndex: 1 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Header Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "0.75rem",
                background: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "#ede8e4",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              #{index + 1}
            </span>
            {goal.isShared && (
              <span
                className="font-sans-body"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  background: "rgba(48,176,208,0.08)",
                  color: "#5cc8e0",
                  border: "1px solid rgba(48,176,208,0.15)",
                }}
              >
                <Lock className="w-3.5 h-3.5" /> Shared Goal
              </span>
            )}
            <span
              className="font-sans-body"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.25rem 0.75rem",
                borderRadius: "0.5rem",
                fontSize: "0.6875rem",
                fontWeight: 600,
                textTransform: "capitalize",
                background: statusColors.bg,
                color: statusColors.text,
                border: `1px solid ${statusColors.border}`,
              }}
            >
              {(goal.status || "not_started").replace("_", " ")}
            </span>
          </div>

          {/* Title & Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <h3 className="font-serif-display" style={{ fontSize: "1.125rem", fontWeight: 600, color: "#ffffff", textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}>
              {goal.title}
            </h3>
            {goal.description && (
              <p className="font-sans-body" style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {goal.description}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="glass" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", borderRadius: "0.75rem", background: "rgba(255,255,255,0.02)" }}>
              <Target className="w-4 h-4 text-[#ff7043]" />
              <span className="font-sans-body" style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)", fontWeight: 500 }}>Target:</span>
              <span className="font-sans-body" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#ede8e4" }}>{formatTarget()}</span>
            </div>
            <div className="glass" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", borderRadius: "0.75rem", background: "rgba(255,255,255,0.02)" }}>
              <TrendingUp className="w-4 h-4 text-[#ff7043]" />
              <span className="font-sans-body" style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)", fontWeight: 500 }}>Weightage:</span>
              <span className="font-sans-body" style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#ffab91" }}>{goal.weightage}%</span>
            </div>
            {goal.thrustArea && (
              <div className="glass" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", borderRadius: "0.75rem", background: "rgba(255,255,255,0.02)" }}>
                <Calendar className="w-4 h-4 text-[#ff7043]" />
                <span className="font-sans-body" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(237,232,228,0.8)" }}>{goal.thrustArea.name}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {goal.progressScore !== null && goal.progressScore !== undefined && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", fontWeight: 600 }}>
                <span className="font-sans-body" style={{ color: "rgba(237,232,228,0.6)" }}>Overall Progress</span>
                <span className="font-sans-body" style={{ color: "#ffab91" }}>{Number(goal.progressScore).toFixed(1)}%</span>
              </div>
              <div style={{ position: "relative", height: "0.75rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden", padding: "1px" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: "9999px",
                    transition: "all 1s ease",
                    width: `${Math.min(100, Math.max(0, Number(goal.progressScore)))}%`,
                    background: "linear-gradient(90deg, #ffab91, #d84315)",
                    boxShadow: "0 0 12px rgba(255,112,67,0.3)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Quarter Indicators */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", paddingTop: "0.5rem" }}>
            {["Q1", "Q2", "Q3", "Q4"].map((q) => {
              const actual = goal[`${q.toLowerCase()}Actual`];
              const hasCheckIn = actual !== null && actual !== undefined;
              return (
                <div
                  key={q}
                  className="font-sans-body"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    transition: "transform 0.3s ease",
                    cursor: "default",
                    background: hasCheckIn ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                    color: hasCheckIn ? "#4ade80" : "rgba(237,232,228,0.4)",
                    border: `1px solid ${hasCheckIn ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)"}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {hasCheckIn ? <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" /> : <Circle className="w-3.5 h-3.5" />}
                  <span>{q}</span>
                  {hasCheckIn && <span style={{ fontWeight: 800, marginLeft: "0.25rem", background: "rgba(34,197,94,0.15)", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontSize: "0.625rem" }}>{actual}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingLeft: "1.5rem", borderLeft: "1px solid rgba(255,255,255,0.06)", marginTop: "auto", marginBottom: "auto" }}>
          {isEditable && !goal.isShared && (
            <>
              <button
                className="login-btn"
                style={{
                  width: "3rem",
                  height: "3rem",
                  padding: 0,
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ede8e4",
                }}
                onClick={onEdit}
                title="Edit Goal"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(48,176,208,0.1)";
                  e.currentTarget.style.borderColor = "rgba(48,176,208,0.2)";
                  e.currentTarget.style.color = "#5cc8e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "#ede8e4";
                }}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                className="login-btn"
                style={{
                  width: "3rem",
                  height: "3rem",
                  padding: 0,
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.1)",
                  color: "#f87171",
                }}
                onClick={onDelete}
                title="Delete Goal"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.06)";
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.1)";
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {!isEditable && (
            <button
              className="login-btn login-btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}
              onClick={onCheckIn}
            >
              Check-in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
