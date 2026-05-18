// src/app/(dashboard)/admin/escalations/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  Shield,
  User,
} from "lucide-react";
import { format } from "date-fns";

const LEVEL_CONFIG: Record<number, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.25)", label: "L1" },
  2: { bg: "rgba(239,68,68,0.12)", text: "#f87171", border: "rgba(239,68,68,0.25)", label: "L2" },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  open:      { bg: "rgba(239,68,68,0.12)",   text: "#f87171", label: "Open" },
  resolved:  { bg: "rgba(34,197,94,0.12)",   text: "#4ade80", label: "Resolved" },
  dismissed: { bg: "rgba(255,255,255,0.06)", text: "rgba(237,232,228,0.4)", label: "Dismissed" },
};

export default function AdminEscalationsPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<"open" | "resolved">("open");

  const { data: escalations = [], isLoading } = useQuery({
    queryKey: ["adminEscalations", filterStatus],
    queryFn: async () => {
      const res = await fetch(`/api/admin/escalations?status=${filterStatus}`);
      if (!res.ok) throw new Error("Failed to fetch escalations");
      return res.json();
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (escalationId: string) => {
      const res = await fetch(`/api/admin/escalations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalationId, status: "resolved" }),
      });
      if (!res.ok) throw new Error("Failed to resolve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminEscalations"] });
    },
  });

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "80rem", margin: "0 auto" }}>
        {/* Header */}
        <div className="hero-banner">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Sparkles className="w-5 h-5 text-[#30b0d0]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Admin
              </span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.25rem" }}>
              System Escalations
            </h1>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>
              Monitor automated alerts for missed deadlines and goal inactivity
            </p>
          </div>
        </div>

        {/* Level Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))", gap: "1rem" }}>
          {[
            {
              icon: <AlertTriangle className="w-5 h-5 text-[#fbbf24]" />,
              title: "L1 Escalation",
              desc: "Triggered when a deadline is missed by 3 days. Notifies the Employee and Manager.",
              color: "#fbbf24",
            },
            {
              icon: <Shield className="w-5 h-5 text-[#f87171]" />,
              title: "L2 Escalation",
              desc: "Triggered when a deadline is missed by 7 days. Escalates to Department Head and HR.",
              color: "#f87171",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass-card"
              style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                {card.icon}
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: card.color }}>{card.title}</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.55)", lineHeight: 1.6 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["open", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.625rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: filterStatus === s ? "rgba(48,176,208,0.15)" : "rgba(255,255,255,0.04)",
                border: filterStatus === s ? "1px solid rgba(48,176,208,0.3)" : "1px solid rgba(255,255,255,0.06)",
                color: filterStatus === s ? "#30b0d0" : "rgba(237,232,228,0.5)",
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Escalation List */}
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem" }}>
            <Loader2 className="w-8 h-8 animate-spin text-[#30b0d0]" />
          </div>
        ) : escalations.length === 0 ? (
          <div className="glass" style={{ borderRadius: "1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 2rem", gap: "1rem", textAlign: "center" }}>
            <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ede8e4" }}>No Escalations</h3>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.4)", maxWidth: "20rem" }}>
              {filterStatus === "open" ? "All deadlines are on track — no active escalations." : "No resolved escalations found."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {escalations.map((esc: any) => {
              const level = LEVEL_CONFIG[esc.escalationLevel] ?? LEVEL_CONFIG[1];
              const statusCfg = STATUS_CONFIG[esc.status] ?? STATUS_CONFIG.dismissed;
              return (
                <div
                  key={esc.id}
                  className="glass-card"
                  style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}
                >
                  {/* Level badge */}
                  <div style={{
                    width: "2.5rem", height: "2.5rem", borderRadius: "0.625rem", flexShrink: 0,
                    background: level.bg, border: `1px solid ${level.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.6875rem", fontWeight: 800, color: level.text,
                  }}>
                    {level.label}
                  </div>

                  {/* Rule name */}
                  <div style={{ flex: "1 1 12rem", minWidth: 0 }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#ede8e4", marginBottom: "0.125rem" }}>
                      {esc.ruleName}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.45)" }}>
                      <User className="w-3.5 h-3.5" />
                      {esc.triggeredFor}
                      {esc.triggeredForId ? ` · ${esc.triggeredForId}` : ""}
                    </div>
                  </div>

                  {/* Triggered by */}
                  <div style={{ flex: "0 0 auto", textAlign: "center" }}>
                    <p style={{ fontSize: "0.6875rem", color: "rgba(237,232,228,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
                      Triggered By
                    </p>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(237,232,228,0.65)" }}>
                      {esc.triggeredBy ?? "System"}
                    </p>
                  </div>

                  {/* Triggered at */}
                  <div style={{ flex: "0 0 auto", textAlign: "center" }}>
                    <p style={{ fontSize: "0.6875rem", color: "rgba(237,232,228,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
                      Time
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.55)" }}>
                      <Clock className="w-3.5 h-3.5 text-[#30b0d0]" />
                      {esc.triggeredAt ? format(new Date(esc.triggeredAt), "MMM d, h:mm a") : "—"}
                    </div>
                  </div>

                  {/* Status */}
                  <span style={{
                    fontSize: "0.6875rem", fontWeight: 700, padding: "0.3rem 0.875rem",
                    borderRadius: "9999px", background: statusCfg.bg, color: statusCfg.text,
                    textTransform: "capitalize", flexShrink: 0,
                  }}>
                    {statusCfg.label}
                  </span>

                  {/* Resolve action */}
                  {esc.status === "open" && (
                    <button
                      onClick={() => resolveMutation.mutate(esc.id)}
                      disabled={resolveMutation.isPending}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.375rem",
                        padding: "0.5rem 1rem", borderRadius: "0.625rem", flexShrink: 0,
                        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                        color: "#4ade80", fontSize: "0.8125rem", fontWeight: 600,
                        cursor: "pointer", transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.18)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.1)"; }}
                    >
                      {resolveMutation.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Resolve
                    </button>
                  )}
                  {esc.resolvedBy && (
                    <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.3)", flexShrink: 0 }}>
                      by {esc.resolvedBy}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
