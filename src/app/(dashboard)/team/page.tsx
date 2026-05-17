// src/app/(dashboard)/team/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Users,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  Loader2,
  Sparkles,
  UserCheck,
} from "lucide-react";

export default function TeamPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["managerTeam"],
    queryFn: async () => {
      const res = await fetch("/api/manager/team");
      if (!res.ok) return { members: [], summary: {} };
      return res.json();
    },
  });

  const members: any[] = data?.members ?? [];
  const summary: any = data?.summary ?? {};

  const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
    submitted: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", label: "Submitted" },
    approved:  { bg: "rgba(34,197,94,0.15)",  text: "#22c55e", label: "Approved" },
    draft:     { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa", label: "Draft" },
    locked:    { bg: "rgba(168,85,247,0.15)",  text: "#c084fc", label: "Locked" },
    rejected:  { bg: "rgba(239,68,68,0.15)",   text: "#f87171", label: "Rejected" },
    none:      { bg: "rgba(255,255,255,0.06)",  text: "rgba(237,232,228,0.35)", label: "No Sheet" },
  };

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
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "80rem", margin: "0 auto" }}>
        {/* Header */}
        <div className="hero-banner">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Sparkles className="w-5 h-5 text-[#30b0d0]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                My Team
              </span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.25rem" }}>Team Overview</h1>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>
              Track goal sheets and performance across your direct reports
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))", gap: "1rem" }}>
          {[
            { label: "Total Members",   value: summary.totalMembers ?? 0,    icon: <Users className="w-5 h-5" />,      color: "#30b0d0" },
            { label: "Pending Approval",value: summary.pendingApprovals ?? 0, icon: <Clock className="w-5 h-5" />,      color: "#f59e0b" },
            { label: "Approved",        value: summary.approvedSheets ?? 0,   icon: <CheckCircle className="w-5 h-5" />, color: "#22c55e" },
            { label: "Avg Progress",    value: `${summary.avgTeamProgress ?? 0}%`, icon: <TrendingUp className="w-5 h-5" />, color: "#a78bfa" },
          ].map((c) => (
            <div key={c.label} className="glass iso-card" style={{ padding: "1.25rem", borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.625rem", background: `${c.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color }}>
                  {c.icon}
                </div>
                <span style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.45)", fontWeight: 500 }}>{c.label}</span>
              </div>
              <p style={{ fontSize: "1.875rem", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Member Table */}
        <div className="glass" style={{ borderRadius: "1rem", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <UserCheck className="w-4 h-4 text-[#30b0d0]" />
            <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#ede8e4" }}>Team Members</h2>
          </div>

          {members.length === 0 ? (
            <p style={{ textAlign: "center", padding: "3rem", color: "rgba(237,232,228,0.3)", fontSize: "0.9rem" }}>No team members found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {["Employee", "Goals", "Weightage", "Avg Progress", "Check-ins", "Status"].map((h) => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 700, color: "rgba(237,232,228,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: any, idx: number) => {
                    const s = statusStyle[m.sheetStatus] ?? statusStyle.none;
                    return (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: idx < members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          transition: "background 0.2s ease",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", background: "linear-gradient(135deg, rgba(48,176,208,0.2), rgba(92,200,224,0.08))", border: "1px solid rgba(48,176,208,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#5cc8e0" }}>
                              {m.firstName?.[0]}{m.lastName?.[0]}
                            </div>
                            <div>
                              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ede8e4" }}>{m.firstName} {m.lastName}</p>
                              <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)" }}>{m.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "rgba(237,232,228,0.7)" }}>{m.goalCount}</td>
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "rgba(237,232,228,0.7)" }}>{m.totalWeightage}%</td>
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div style={{ width: "4rem", height: "0.3rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                              <div style={{ width: `${m.avgProgress}%`, height: "100%", background: "linear-gradient(90deg, #30b0d0, #5cc8e0)", borderRadius: "9999px" }} />
                            </div>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0" }}>{m.avgProgress}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", color: "rgba(237,232,228,0.7)" }}>{m.checkinRate}%</td>
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "9999px", background: s.bg, color: s.text }}>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
