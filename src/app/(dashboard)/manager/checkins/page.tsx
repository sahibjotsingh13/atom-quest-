// src/app/(dashboard)/manager/checkins/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { CheckInReview } from "@/components/manager/CheckInReview";
import {
  Loader2,
  MessageSquare,
  Filter,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  not_started: { bg: "rgba(255,255,255,0.06)",  text: "rgba(237,232,228,0.45)", label: "Not Started" },
  on_track:    { bg: "rgba(59,130,246,0.15)",   text: "#60a5fa",                label: "On Track"    },
  completed:   { bg: "rgba(34,197,94,0.15)",    text: "#4ade80",                label: "Completed"   },
  at_risk:     { bg: "rgba(245,158,11,0.15)",   text: "#fbbf24",                label: "At Risk"     },
};

export default function ManagerCheckInsPage() {
  const [selectedCheckIn, setSelectedCheckIn] = useState<any>(null);
  const [filterQuarter, setFilterQuarter] = useState("all");

  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ["managerCheckIns"],
    queryFn: async () => {
      const res = await fetch("/api/manager/checkins");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filtered = filterQuarter === "all"
    ? checkIns
    : checkIns.filter((ci: any) => ci.quarter === filterQuarter);

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
                Manager
              </span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.25rem" }}>
              Team Check-ins
            </h1>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>
              Review and provide feedback on your team's quarterly progress
            </p>
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "9999px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Clock className="w-4 h-4 text-[#fbbf24]" />
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fbbf24" }}>
                {checkIns.filter((ci: any) => !ci.managerComment).length} pending
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "9999px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#4ade80" }}>
                {checkIns.filter((ci: any) => ci.managerComment).length} reviewed
              </span>
            </div>
          </div>
        </div>

        {/* Quarter filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(237,232,228,0.4)", fontSize: "0.8125rem" }}>
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>
          {["all", "Q1", "Q2", "Q3", "Q4"].map((q) => (
            <button
              key={q}
              onClick={() => setFilterQuarter(q)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "0.625rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: filterQuarter === q ? "rgba(48,176,208,0.15)" : "rgba(255,255,255,0.04)",
                border: filterQuarter === q ? "1px solid rgba(48,176,208,0.3)" : "1px solid rgba(255,255,255,0.06)",
                color: filterQuarter === q ? "#30b0d0" : "rgba(237,232,228,0.5)",
              }}
            >
              {q === "all" ? "All Quarters" : q}
            </button>
          ))}
        </div>

        {/* Check-in Cards */}
        {filtered.length === 0 ? (
          <div className="glass" style={{ borderRadius: "1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 2rem", gap: "1rem", textAlign: "center" }}>
            <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare className="w-7 h-7 text-[rgba(237,232,228,0.25)]" />
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ede8e4" }}>No Check-ins</h3>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.35)", maxWidth: "22rem" }}>
              Check-ins will appear here when your team members submit their quarterly progress.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map((checkIn: any) => {
              const statusStyle = STATUS_STYLE[checkIn.status] ?? STATUS_STYLE.not_started;
              const isPending = !checkIn.managerComment;
              const employee = checkIn.goal?.goalSheet?.employee;
              return (
                <div
                  key={checkIn.id}
                  className="glass-card"
                  onClick={() => setSelectedCheckIn(checkIn)}
                  style={{
                    padding: "1.25rem 1.5rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.875rem",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(48,176,208,0.3)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                      {/* Avatar */}
                      <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, rgba(48,176,208,0.2), rgba(92,200,224,0.08))", border: "1px solid rgba(48,176,208,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#5cc8e0" }}>
                        {employee?.firstName?.[0]}{employee?.lastName?.[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#ede8e4" }}>
                          {employee?.firstName} {employee?.lastName}
                        </p>
                        <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.45)", marginTop: "0.125rem" }}>
                          {checkIn.goal?.title ?? "—"} · <span style={{ color: "#30b0d0" }}>{checkIn.quarter}</span>
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px", background: statusStyle.bg, color: statusStyle.text }}>
                        {statusStyle.label}
                      </span>
                      <span style={{
                        fontSize: "0.6875rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px",
                        background: isPending ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)",
                        color: isPending ? "#fbbf24" : "#4ade80",
                      }}>
                        {isPending ? "Pending Review" : "Reviewed"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[rgba(237,232,228,0.25)]" />
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                    {[
                      { label: "Actual", value: checkIn.goal?.uomType?.code === "timeline"
                        ? (checkIn.actualDate ? new Date(checkIn.actualDate).toLocaleDateString() : "—")
                        : (checkIn.actualAchievement ?? "—") },
                      { label: "Progress", value: `${Number(checkIn.goal?.progressScore ?? 0).toFixed(1)}%` },
                      { label: "Date", value: checkIn.checkInDate ? new Date(checkIn.checkInDate).toLocaleDateString() : "—" },
                    ].map((m) => (
                      <div key={m.label} style={{ padding: "0.625rem 0.875rem", borderRadius: "0.625rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "rgba(237,232,228,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
                          {m.label}
                        </p>
                        <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#ede8e4" }}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Employee comment */}
                  {checkIn.employeeComment && (
                    <div style={{ padding: "0.75rem 1rem", borderRadius: "0.625rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(237,232,228,0.35)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Employee Comment
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.7)", lineHeight: 1.5 }}>
                        {checkIn.employeeComment}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Drawer */}
      <CheckInReview
        open={!!selectedCheckIn}
        onClose={() => setSelectedCheckIn(null)}
        checkIn={selectedCheckIn}
      />
    </AppLayout>
  );
}
