// src/app/(dashboard)/admin/sheets/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2, Search, Lock, Unlock, FileText, Filter, Sparkles } from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  draft:        { bg: "rgba(255,255,255,0.06)",  text: "rgba(237,232,228,0.5)" },
  submitted:    { bg: "rgba(59,130,246,0.15)",   text: "#60a5fa" },
  under_review: { bg: "rgba(168,85,247,0.15)",   text: "#c084fc" },
  approved:     { bg: "rgba(34,197,94,0.15)",    text: "#22c55e" },
  locked:       { bg: "rgba(245,158,11,0.15)",   text: "#fbbf24" },
};

export default function AdminSheetsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [unlockReason, setUnlockReason] = useState("");
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);

  const { data: sheets = [], isLoading } = useQuery({
    queryKey: ["adminSheets"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sheets");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const unlockSheet = useMutation({
    mutationFn: async ({ sheetId, reason }: { sheetId: string; reason: string }) => {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to unlock sheet");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSheets"] });
      setIsUnlockDialogOpen(false);
      setUnlockReason("");
      setSelectedSheet(null);
    },
  });

  const filteredSheets = sheets.filter((sheet: any) => {
    const matchesSearch =
      sheet.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sheet.status === statusFilter;
    return matchesSearch && matchesStatus;
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
              Organisation Goal Sheets
            </h1>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>
              Manage and monitor all employee goal sheets
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass" style={{ padding: "1rem 1.25rem", borderRadius: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "12rem" }}>
            <Search className="w-4 h-4 text-[#30b0d0]" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }} />
            <input
              className="login-input"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", paddingLeft: "2.5rem", fontSize: "0.875rem" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <Filter className="w-4 h-4 text-[#30b0d0]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="login-input"
              style={{ fontSize: "0.875rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem" }}>
            <Loader2 className="w-8 h-8 animate-spin text-[#30b0d0]" />
          </div>
        ) : (
          <div className="glass" style={{ borderRadius: "1rem", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <FileText className="w-4 h-4 text-[#30b0d0]" />
              <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#ede8e4" }}>
                {filteredSheets.length} sheet{filteredSheets.length !== 1 ? "s" : ""}
              </h2>
            </div>
            {filteredSheets.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem", gap: "0.75rem" }}>
                <FileText className="w-12 h-12 text-[rgba(237,232,228,0.1)]" />
                <p style={{ fontSize: "0.9375rem", color: "rgba(237,232,228,0.35)" }}>No goal sheets found matching your criteria</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {["Employee", "Cycle", "Goals", "Weightage", "Status", "Actions"].map((h) => (
                        <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6875rem", fontWeight: 700, color: "rgba(237,232,228,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSheets.map((sheet: any, idx: number) => {
                      const s = STATUS_STYLE[sheet.status] ?? STATUS_STYLE.draft;
                      return (
                        <tr
                          key={sheet.id}
                          style={{ borderBottom: idx < filteredSheets.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.2s ease" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          <td style={{ padding: "0.875rem 1rem" }}>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ede8e4" }}>
                              {sheet.employee.firstName} {sheet.employee.lastName}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)", marginTop: "0.125rem" }}>
                              {sheet.employee.employeeId} · {sheet.employee.department?.name || "No Dept"}
                            </p>
                          </td>
                          <td style={{ padding: "0.875rem 1rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.65)" }}>{sheet.cycle.name}</td>
                          <td style={{ padding: "0.875rem 1rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.7)", fontWeight: 500 }}>{sheet.goals.length}</td>
                          <td style={{ padding: "0.875rem 1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ width: "3.5rem", height: "0.3rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                                <div style={{ width: `${Math.min(Number(sheet.totalWeightage), 100)}%`, height: "100%", background: "linear-gradient(90deg, #30b0d0, #5cc8e0)", borderRadius: "9999px" }} />
                              </div>
                              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#30b0d0" }}>{Number(sheet.totalWeightage).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "0.875rem 1rem" }}>
                            <span style={{ fontSize: "0.6875rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "9999px", background: s.bg, color: s.text, textTransform: "capitalize" }}>
                              {sheet.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td style={{ padding: "0.875rem 1rem" }}>
                            {sheet.status === "locked" ? (
                              <button
                                onClick={() => { setSelectedSheet(sheet); setIsUnlockDialogOpen(true); }}
                                style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.875rem", borderRadius: "0.5rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
                              >
                                <Unlock className="w-3.5 h-3.5" /> Unlock
                              </button>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.25)" }}>
                                <Lock className="w-3.5 h-3.5" /> Editable
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unlock Dialog */}
      {isUnlockDialogOpen && selectedSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,10,15,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setIsUnlockDialogOpen(false)} />
          <div className="glass" style={{ position: "relative", zIndex: 1, borderRadius: "1.25rem", padding: "2rem", width: "90%", maxWidth: "28rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ede8e4", marginBottom: "0.375rem" }}>Unlock Goal Sheet</h2>
              <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)" }}>
                This will return {selectedSheet.employee.firstName}'s sheet to Approved status, allowing further check-ins or edits.
              </p>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>
                Reason for Unlocking (required)
              </label>
              <textarea
                className="login-input"
                placeholder="e.g., Requested revision for Q1 targets..."
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                rows={3}
                style={{ width: "100%", resize: "vertical", padding: "0.75rem 1rem", fontSize: "0.875rem" }}
              />
              <p style={{ fontSize: "0.6875rem", color: "rgba(237,232,228,0.3)", marginTop: "0.375rem" }}>
                Minimum 10 characters. Recorded in audit log and sent to employee.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsUnlockDialogOpen(false)}
                style={{ padding: "0.625rem 1.25rem", borderRadius: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(237,232,228,0.7)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                disabled={unlockReason.trim().length < 10 || unlockSheet.isPending}
                onClick={() => unlockSheet.mutate({ sheetId: selectedSheet.id, reason: unlockReason })}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1.25rem", borderRadius: "0.625rem", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24", fontSize: "0.875rem", fontWeight: 700, cursor: unlockReason.trim().length < 10 ? "not-allowed" : "pointer", opacity: unlockReason.trim().length < 10 ? 0.5 : 1 }}
              >
                {unlockSheet.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                Confirm Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
