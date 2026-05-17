// src/app/(dashboard)/approvals/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  FileText,
  Target,
  Sparkles,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export default function ManagerApprovalsPage() {
  const queryClient = useQueryClient();
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const { data: teamData, isLoading } = useQuery({
    queryKey: ["managerTeam"],
    queryFn: async () => {
      const res = await fetch("/api/manager/team");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      sheetId,
      action,
      reason,
    }: {
      sheetId: string;
      action: string;
      reason?: string;
    }) => {
      const res = await fetch("/api/manager/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, action, rejectionReason: reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process approval");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerTeam"] });
      setIsRejectDialogOpen(false);
      setIsPreviewDialogOpen(false);
      setRejectionReason("");
      setSelectedSheet(null);
    },
  });

  const pendingSheets = (teamData?.members || []).filter(
    (m: any) => m.sheetStatus === "submitted"
  );

  const handleApprove = (sheetId: string) => {
    if (
      confirm(
        "Are you sure you want to approve this goal sheet? This will lock it for the employee."
      )
    ) {
      reviewMutation.mutate({ sheetId, action: "approve" });
    }
  };

  const handleRejectClick = (sheet: any) => {
    setSelectedSheet(sheet);
    setIsRejectDialogOpen(true);
  };

  const handlePreviewClick = (sheetId: string) => {
    fetch(`/api/manager/sheet/${sheetId}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedSheet(data);
        setIsPreviewDialogOpen(true);
      });
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "80rem", margin: "0 auto" }}>
        {/* Header */}
        <div className="hero-banner">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <Sparkles className="w-5 h-5 text-[#30b0d0]" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#30b0d0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Approvals Queue
              </span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.25rem" }}>
              Pending Approvals
            </h1>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>
              Review and approve goal sheets from your direct reports
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "9999px",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.25)",
              alignSelf: "flex-start",
            }}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fbbf24" }}>
              {pendingSheets.length} pending
            </span>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "16rem" }}>
            <Loader2 className="w-8 h-8 animate-spin text-[#30b0d0]" />
          </div>
        ) : pendingSheets.length > 0 ? (
          <div className="glass" style={{ borderRadius: "1rem", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <FileText className="w-4 h-4 text-[#30b0d0]" />
              <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#ede8e4" }}>Submitted Sheets</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {["Employee", "Submitted On", "Goals", "Weightage", "Actions"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: i === 4 ? "right" : "left",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          color: "rgba(237,232,228,0.35)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingSheets.map((m: any, idx: number) => (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: idx < pendingSheets.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "50%", background: "rgba(48,176,208,0.15)", border: "1px solid rgba(48,176,208,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#5cc8e0" }}>
                            {m.firstName?.[0]}{m.lastName?.[0]}
                          </div>
                          <div>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ede8e4" }}>{m.firstName} {m.lastName}</p>
                            <p style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)" }}>{m.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.6)" }}>
                        {m.submittedAt ? format(new Date(m.submittedAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.8125rem", color: "rgba(237,232,228,0.7)", fontWeight: 500 }}>
                        {m.goalCount} goals
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div style={{ width: "4rem", height: "0.3rem", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(m.totalWeightage, 100)}%`, height: "100%", background: "linear-gradient(90deg, #30b0d0, #5cc8e0)", borderRadius: "9999px" }} />
                          </div>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#30b0d0" }}>{m.totalWeightage}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                          <button
                            onClick={() => handlePreviewClick(m.sheetId)}
                            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.875rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(237,232,228,0.7)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                          >
                            <Eye className="w-3.5 h-3.5" /> Review
                          </button>
                          <button
                            onClick={() => handleApprove(m.sheetId)}
                            disabled={reviewMutation.isPending}
                            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.875rem", borderRadius: "0.5rem", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.2)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.12)"; }}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(m)}
                            disabled={reviewMutation.isPending}
                            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.875rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.18)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass" style={{ borderRadius: "1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 2rem", gap: "1rem", textAlign: "center" }}>
            <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ede8e4" }}>All caught up!</h3>
            <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.4)", maxWidth: "20rem" }}>
              No goal sheets are currently pending your approval.
            </p>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      {isRejectDialogOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,10,15,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setIsRejectDialogOpen(false)} />
          <div className="glass" style={{ position: "relative", zIndex: 1, borderRadius: "1.25rem", padding: "2rem", width: "90%", maxWidth: "28rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ede8e4", marginBottom: "0.375rem" }}>Return for Rework</h2>
              <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)" }}>
                Provide clear feedback for {selectedSheet?.firstName}. They will be able to edit and resubmit.
              </p>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>
                Feedback / Reason (required)
              </label>
              <textarea
                className="login-input"
                placeholder="e.g., Please align the Q3 target for the efficiency goal with the new department guidelines..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                style={{ width: "100%", resize: "vertical", padding: "0.75rem 1rem", fontSize: "0.875rem" }}
              />
              <p style={{ fontSize: "0.6875rem", color: "rgba(237,232,228,0.3)", marginTop: "0.375rem" }}>Minimum 10 characters.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsRejectDialogOpen(false)}
                style={{ padding: "0.625rem 1.25rem", borderRadius: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(237,232,228,0.7)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                disabled={rejectionReason.trim().length < 10 || reviewMutation.isPending}
                onClick={() => reviewMutation.mutate({ sheetId: selectedSheet.sheetId, action: "reject", reason: rejectionReason })}
                style={{ padding: "0.625rem 1.25rem", borderRadius: "0.625rem", background: rejectionReason.trim().length < 10 ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "0.875rem", fontWeight: 700, cursor: rejectionReason.trim().length < 10 ? "not-allowed" : "pointer", opacity: rejectionReason.trim().length < 10 ? 0.5 : 1 }}
              >
                {reviewMutation.isPending ? "Returning…" : "Confirm Return"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      {isPreviewDialogOpen && selectedSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,10,15,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setIsPreviewDialogOpen(false)} />
          <div className="glass" style={{ position: "relative", zIndex: 1, borderRadius: "1.25rem", padding: "2rem", width: "90%", maxWidth: "48rem", maxHeight: "85vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <FileText className="w-5 h-5 text-[#30b0d0]" />
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ede8e4" }}>
                Goal Sheet: {selectedSheet.employee?.firstName} {selectedSheet.employee?.lastName}
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "1rem", borderRadius: "0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "rgba(237,232,228,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee ID</p>
                <p style={{ fontWeight: 600, color: "#ede8e4", marginTop: "0.25rem" }}>{selectedSheet.employee?.employeeId}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "rgba(237,232,228,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Performance Cycle</p>
                <p style={{ fontWeight: 600, color: "#ede8e4", marginTop: "0.25rem" }}>{selectedSheet.cycle?.name}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#ede8e4", paddingBottom: "0.625rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Goals Overview</h3>
              {selectedSheet.goals?.map((goal: any, idx: number) => (
                <div key={goal.id} style={{ padding: "1rem", borderRadius: "0.875rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#30b0d0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Goal {idx + 1} · {goal.thrustArea?.name}
                      </span>
                      <h4 style={{ fontWeight: 700, color: "#ede8e4", marginTop: "0.25rem" }}>{goal.title}</h4>
                      {goal.description && (
                        <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", marginTop: "0.375rem" }}>{goal.description}</p>
                      )}
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.25rem 0.75rem", borderRadius: "9999px", background: "rgba(48,176,208,0.12)", color: "#30b0d0", flexShrink: 0 }}>
                      {goal.weightage}%
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <Target className="w-4 h-4 text-[#30b0d0]" />
                    <span style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.6)" }}>
                      Target: <strong style={{ color: "#ede8e4" }}>
                        {goal.uomType?.code === "timeline"
                          ? goal.targetDate ? format(new Date(goal.targetDate), "MMM d, yyyy") : "—"
                          : `${goal.targetValue} ${goal.uomType?.name}`}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "0.875rem 1rem", borderRadius: "0.75rem", background: "rgba(48,176,208,0.06)", border: "1px solid rgba(48,176,208,0.15)", display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
              <AlertCircle className="w-4 h-4 text-[#30b0d0] mt-0.5 shrink-0" />
              <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.65)" }}>
                Review all goals and weightages carefully. Once approved, the sheet will be locked and ready for quarterly check-ins.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setIsPreviewDialogOpen(false)} style={{ padding: "0.625rem 1.25rem", borderRadius: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(237,232,228,0.7)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                Close
              </button>
              <button
                onClick={() => { setIsPreviewDialogOpen(false); handleRejectClick({ sheetId: selectedSheet.id, firstName: selectedSheet.employee?.firstName }); }}
                style={{ padding: "0.625rem 1.25rem", borderRadius: "0.625rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer" }}
              >
                Return for Rework
              </button>
              <button
                onClick={() => handleApprove(selectedSheet.id)}
                disabled={reviewMutation.isPending}
                className="login-btn"
                style={{ padding: "0.625rem 1.5rem", fontSize: "0.875rem" }}
              >
                {reviewMutation.isPending ? "Approving…" : "Approve Goal Sheet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
