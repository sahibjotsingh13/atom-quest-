// src/app/(dashboard)/admin/shared-goals/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2, Plus, Users, Target, ChevronDown, ChevronUp, Sparkles, Network } from "lucide-react";

export default function AdminSharedGoalsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    thrustAreaId: "",
    uomTypeId: "",
    targetValue: "",
    targetDate: "",
    departmentId: "",
    weightage: "",
  });

  const { data: sharedGoals, isLoading } = useQuery({
    queryKey: ["adminSharedGoals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/shared-goals");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: masterData } = useQuery({
    queryKey: ["masterData"],
    queryFn: async () => {
      const [thrust, uom, depts] = await Promise.all([
        fetch("/api/admin/thrust-areas").then((r) => r.json()),
        fetch("/api/admin/uom-types").then((r) => r.json()),
        fetch("/api/admin/departments").then((r) => r.json()),
      ]);
      return { thrustAreas: thrust, uomTypes: uom, departments: depts };
    },
  });

  const createGoal = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, departmentId: data.departmentId || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSharedGoals"] });
      setOpen(false);
      setForm({ title: "", description: "", thrustAreaId: "", uomTypeId: "", targetValue: "", targetDate: "", departmentId: "", weightage: "" });
    },
  });

  const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
    not_started: { bg: "rgba(255,255,255,0.06)",  text: "rgba(237,232,228,0.5)" },
    on_track:    { bg: "rgba(59,130,246,0.15)",   text: "#60a5fa" },
    completed:   { bg: "rgba(34,197,94,0.15)",    text: "#22c55e" },
    at_risk:     { bg: "rgba(245,158,11,0.15)",   text: "#fbbf24" },
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "64rem", margin: "0 auto" }}>
        {/* Header */}
        <div className="hero-banner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Network className="w-5 h-5 text-[#30b0d0]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Admin
              </span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.25rem" }}>
              Shared Goals
            </h1>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>
              Push departmental KPIs and cascaded objectives to employees
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="login-button"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", fontSize: "0.875rem", width: "auto", margin: 0 }}
          >
            <Plus className="w-4 h-4" />
            Create Shared Goal
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem" }}>
            <Loader2 className="w-8 h-8 animate-spin text-[#30b0d0]" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {(sharedGoals || []).map((goal: any) => (
              <div key={goal.id} className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ede8e4" }}>{goal.title}</h3>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "9999px", background: "rgba(255,255,255,0.06)", color: "rgba(237,232,228,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {goal.uomType?.name}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.45)" }}>
                      Thrust Area: <span style={{ color: "#30b0d0" }}>{goal.thrustArea?.name}</span>
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", background: "rgba(255,255,255,0.03)", padding: "0.375rem 0.75rem", borderRadius: "0.5rem" }}>
                      <Users className="w-4 h-4" />
                      <span style={{ fontWeight: 600 }}>{goal.childGoals?.length ?? 0}</span> recipients
                    </div>
                    <button
                      onClick={() => setExpanded(expanded === goal.id ? null : goal.id)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "2rem", height: "2rem", borderRadius: "0.5rem", background: expanded === goal.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#ede8e4", cursor: "pointer", transition: "all 0.2s ease" }}
                    >
                      {expanded === goal.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expanded === goal.id && goal.childGoals?.length > 0 && (
                  <div style={{ marginTop: "0.5rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {goal.childGoals.map((child: any) => {
                      const s = STATUS_STYLE[child.status] || STATUS_STYLE.not_started;
                      return (
                        <div key={child.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 1rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.02)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ede8e4" }}>
                              {child.goalSheet?.employee?.firstName} {child.goalSheet?.employee?.lastName}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.3)" }}>
                              · {child.goalSheet?.employee?.employeeId}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "9999px", background: s.bg, color: s.text, textTransform: "capitalize" }}>
                              {child.status?.replace(/_/g, " ")}
                            </span>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "rgba(237,232,228,0.5)", width: "3rem", textAlign: "right" }}>
                              {Number(child.progressScore || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {(!sharedGoals || sharedGoals.length === 0) && (
              <div className="glass" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 2rem", borderRadius: "1rem", textAlign: "center", gap: "1.25rem" }}>
                <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Target className="w-8 h-8 text-[rgba(237,232,228,0.2)]" />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ede8e4", marginBottom: "0.375rem" }}>No shared goals yet</h3>
                  <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.4)" }}>Push departmental KPIs to your team to align organizational objectives.</p>
                </div>
                <button
                  onClick={() => setOpen(true)}
                  className="login-button"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", fontSize: "0.875rem", width: "auto", margin: 0, marginTop: "0.5rem" }}
                >
                  <Plus className="w-4 h-4" /> Create Shared Goal
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,10,15,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setOpen(false)} />
          <div className="glass" style={{ position: "relative", zIndex: 1, borderRadius: "1.25rem", padding: "2rem", width: "90%", maxWidth: "36rem", display: "flex", flexDirection: "column", gap: "1.5rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ede8e4", marginBottom: "0.25rem" }}>Create Shared Goal</h2>
              <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)" }}>This goal will be automatically added to the goal sheets of selected employees.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>Title *</label>
                <input
                  className="login-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Achieve 95% Customer Satisfaction"
                  style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>Description</label>
                <textarea
                  className="login-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  style={{ width: "100%", resize: "vertical", padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>Thrust Area *</label>
                  <select
                    className="login-input"
                    value={form.thrustAreaId}
                    onChange={(e) => setForm({ ...form, thrustAreaId: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                  >
                    <option value="">Select...</option>
                    {(masterData?.thrustAreas || []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>UoM Type *</label>
                  <select
                    className="login-input"
                    value={form.uomTypeId}
                    onChange={(e) => setForm({ ...form, uomTypeId: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                  >
                    <option value="">Select...</option>
                    {(masterData?.uomTypes || []).map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>Target Value</label>
                  <input
                    type="number"
                    className="login-input"
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    placeholder="e.g. 100"
                    style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>Weightage (%) *</label>
                  <input
                    type="number"
                    className="login-input"
                    value={form.weightage}
                    onChange={(e) => setForm({ ...form, weightage: e.target.value })}
                    placeholder="e.g. 20"
                    style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>Assign to Department</label>
                <select
                  className="login-input"
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.875rem" }}
                >
                  <option value="">All employees in dept...</option>
                  {(masterData?.departments || []).map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {createGoal.isError && (
                <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "0.8125rem", fontWeight: 500 }}>
                  {(createGoal.error as any)?.message}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                onClick={() => setOpen(false)}
                style={{ padding: "0.625rem 1.25rem", borderRadius: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(237,232,228,0.7)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                disabled={!form.title || !form.thrustAreaId || !form.uomTypeId || !form.weightage || createGoal.isPending}
                onClick={() => createGoal.mutate({ ...form, weightage: Number(form.weightage), targetValue: form.targetValue ? Number(form.targetValue) : null })}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1.25rem", borderRadius: "0.625rem", background: "linear-gradient(135deg, #30b0d0, #5cc8e0)", border: "none", color: "#000", fontSize: "0.875rem", fontWeight: 700, cursor: (!form.title || !form.thrustAreaId || !form.uomTypeId || !form.weightage) ? "not-allowed" : "pointer", opacity: (!form.title || !form.thrustAreaId || !form.uomTypeId || !form.weightage) ? 0.5 : 1 }}
              >
                {createGoal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Push to Employees
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
