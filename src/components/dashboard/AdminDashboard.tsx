// src/components/dashboard/AdminDashboard.tsx
"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CycleManager } from "@/components/admin/CycleManager";
import { SharedGoalPush } from "@/components/admin/SharedGoalPush";
import { EscalationList } from "@/components/admin/EscalationList";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AuditViewer } from "@/components/admin/AuditViewer";
import { ReportExport } from "@/components/admin/ReportExport";
import { Shield, Sparkles } from "lucide-react";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("cycles");

  const tabs = [
    { id: "cycles", label: "Cycles" },
    { id: "shared", label: "Shared Goals" },
    { id: "escalations", label: "Escalations" },
    { id: "analytics", label: "Analytics" },
    { id: "audit", label: "Audit" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "80rem", margin: "0 auto", paddingBottom: "4rem" }}>
        {/* Top Hero Banner */}
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <h1
                  className="font-serif-display"
                  style={{
                    fontSize: "1.875rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: "#ffffff",
                    textShadow: "0 2px 24px rgba(0,0,0,0.45)",
                  }}
                >
                  Admin Control Center
                </h1>
                <span
                  className="alert-glass"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.25rem 0.75rem",
                    color: "#5cc8e0",
                    border: "1px solid rgba(48,176,208,0.2)",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    borderRadius: "9999px",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Live Portal
                </span>
              </div>
              <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.6)" }}>
                System configuration, compliance monitoring, and high-fidelity performance analytics
              </p>
            </div>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #5cc8e0, #1a8ca8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 32px rgba(48,176,208,0.3)",
                flexShrink: 0,
              }}
            >
              <Shield className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* 3D Styled Tabs */}
        <div className="glass" style={{ padding: "0.5rem", borderRadius: "1rem", display: "flex", overflowX: "auto", gap: "0.25rem" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="font-sans-body"
              style={{
                flex: 1,
                minWidth: "100px",
                padding: "0.75rem 1.25rem",
                borderRadius: "0.75rem",
                fontWeight: 700,
                fontSize: "0.8125rem",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                cursor: "pointer",
                border: "none",
                background: activeTab === tab.id
                  ? "linear-gradient(135deg, #30b0d0, #1a8ca8)"
                  : "transparent",
                color: activeTab === tab.id ? "#050a0f" : "rgba(237,232,228,0.6)",
                boxShadow: activeTab === tab.id ? "0 4px 16px rgba(48,176,208,0.3)" : "none",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "#ede8e4";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(237,232,228,0.6)";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {activeTab === "cycles" && <CycleManager />}
          {activeTab === "shared" && <SharedGoalPush />}
          {activeTab === "escalations" && <EscalationList />}
          {activeTab === "analytics" && <AnalyticsDashboard />}
          {activeTab === "audit" && <AuditViewer />}
          {activeTab === "reports" && <ReportExport />}
        </div>
      </div>
    </AppLayout>
  );
}