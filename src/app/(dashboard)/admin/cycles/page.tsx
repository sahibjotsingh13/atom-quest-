// src/app/(dashboard)/admin/cycles/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2, Plus, CalendarDays, CheckCircle2, History, Sparkles, X } from "lucide-react";
import { format } from "date-fns";

export default function AdminCyclesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", fiscalYear: "",
    goalSettingStart: "", goalSettingEnd: "",
    q1Start: "", q1End: "",
    q2Start: "", q2End: "",
    q3Start: "", q3End: "",
    q4Start: "", q4End: "",
  });

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["adminCycles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cycles");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createCycle = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create cycle");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCycles"] });
      setIsOpen(false);
      setFormData({ name: "", fiscalYear: "", goalSettingStart: "", goalSettingEnd: "", q1Start: "", q1End: "", q2Start: "", q2End: "", q3Start: "", q3End: "", q4Start: "", q4End: "" });
    },
  });

  const set = (key: string, val: string) => setFormData((f) => ({ ...f, [key]: val }));

  const quarters = [
    { key: "q1", label: "Quarter 1" },
    { key: "q2", label: "Quarter 2" },
    { key: "q3", label: "Quarter 3" },
    { key: "q4", label: "Quarter 4" },
  ];

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "80rem", margin: "0 auto" }}>
        {/* Header */}
        <div className="hero-banner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Sparkles className="w-5 h-5 text-[#30b0d0]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Admin</span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.25rem" }}>Performance Cycles</h1>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>Configure fiscal years and quarterly check-in windows</p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="login-btn"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", fontSize: "0.875rem" }}
          >
            <Plus className="w-4 h-4" /> New Cycle
          </button>
        </div>

        {/* Cycles List */}
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem" }}>
            <Loader2 className="w-8 h-8 animate-spin text-[#30b0d0]" />
          </div>
        ) : (
          <div className="glass" style={{ borderRadius: "1rem", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <CalendarDays className="w-4 h-4 text-[#30b0d0]" />
              <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#ede8e4" }}>All Cycles</h2>
            </div>
            {cycles.length === 0 ? (
              <p style={{ textAlign: "center", padding: "3rem", fontSize: "0.9rem", color: "rgba(237,232,228,0.3)" }}>
                No cycles yet. Create your first performance cycle.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {["Cycle Name", "Goal Setting Window", "Status", "Created"].map((h) => (
                        <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 700, color: "rgba(237,232,228,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map((cycle: any, idx: number) => (
                      <tr
                        key={cycle.id}
                        style={{ borderBottom: idx < cycles.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.2s ease" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ede8e4" }}>{cycle.name}</p>
                          <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)" }}>FY {cycle.fiscalYear}</p>
                        </td>
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.6)" }}>
                          {format(new Date(cycle.goalSettingStart), "MMM d")} – {format(new Date(cycle.goalSettingEnd), "MMM d, yyyy")}
                        </td>
                        <td style={{ padding: "0.875rem 1rem" }}>
                          {cycle.status === "active" ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px", background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", color: "rgba(237,232,228,0.4)" }}>
                              <History className="w-3 h-3" /> Closed
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.4)" }}>
                          {format(new Date(cycle.createdAt), "MMM d, yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Cycle Dialog */}
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,10,15,0.75)", backdropFilter: "blur(8px)" }} onClick={() => setIsOpen(false)} />
          <div className="glass" style={{ position: "relative", zIndex: 1, borderRadius: "1.25rem", padding: "2rem", width: "90%", maxWidth: "48rem", maxHeight: "88vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ede8e4" }}>Create New Performance Cycle</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(237,232,228,0.5)", padding: "0.25rem" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createCycle.mutate(formData); }} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <FormField label="Cycle Name" placeholder="e.g., FY 2025-26" value={formData.name} onChange={(v) => set("name", v)} required />
                <FormField label="Fiscal Year" placeholder="e.g., 2025" value={formData.fiscalYear} onChange={(v) => set("fiscalYear", v)} required />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem", paddingBottom: "0.625rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <CalendarDays className="w-4 h-4 text-[#30b0d0]" />
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#ede8e4" }}>Goal Setting Window</h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <FormField label="Start Date" type="date" value={formData.goalSettingStart} onChange={(v) => set("goalSettingStart", v)} required />
                  <FormField label="End Date" type="date" value={formData.goalSettingEnd} onChange={(v) => set("goalSettingEnd", v)} required />
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#ede8e4", marginBottom: "0.875rem" }}>Quarterly Windows</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  {quarters.map((q) => (
                    <div key={q.key} style={{ padding: "1rem", borderRadius: "0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(237,232,228,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>{q.label}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                        <FormField label="Start" type="date" value={(formData as any)[`${q.key}Start`]} onChange={(v) => set(`${q.key}Start`, v)} required />
                        <FormField label="End" type="date" value={(formData as any)[`${q.key}End`]} onChange={(v) => set(`${q.key}End`, v)} required />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {createCycle.isError && (
                <p style={{ fontSize: "0.875rem", color: "#f87171", textAlign: "center" }}>{(createCycle.error as any)?.message}</p>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button type="button" onClick={() => setIsOpen(false)} style={{ padding: "0.625rem 1.25rem", borderRadius: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(237,232,228,0.7)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={createCycle.isPending} className="login-btn" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.5rem", fontSize: "0.875rem" }}>
                  {createCycle.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create & Activate Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function FormField({ label, placeholder, value, onChange, type = "text", required }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      <input
        className="login-input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ width: "100%", fontSize: "0.875rem" }}
      />
    </div>
  );
}
