// src/app/(dashboard)/settings/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Settings, User, Bell, Shield, Palette, Save, Loader2 } from "lucide-react";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "60rem", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "0.875rem",
              background: "linear-gradient(135deg, rgba(48,176,208,0.2), rgba(92,200,224,0.08))",
              border: "1px solid rgba(48,176,208,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings className="w-6 h-6 text-[#30b0d0]" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff" }}>Settings</h1>
            <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.45)" }}>Manage your account preferences</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "14rem 1fr", gap: "1.5rem" }}>
          {/* Section Nav */}
          <div className="glass" style={{ borderRadius: "1rem", padding: "0.75rem", height: "fit-content" }}>
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  background: activeSection === id ? "linear-gradient(90deg, rgba(48,176,208,0.12), transparent)" : "transparent",
                  color: activeSection === id ? "#5cc8e0" : "rgba(237,232,228,0.55)",
                  borderLeft: activeSection === id ? "3px solid #30b0d0" : "3px solid transparent",
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content Panel */}
          <div className="glass" style={{ borderRadius: "1rem", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {activeSection === "profile" && (
              <>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#ede8e4" }}>Profile Information</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field label="First Name" defaultValue={session?.user?.firstName ?? ""} />
                  <Field label="Last Name" defaultValue={session?.user?.lastName ?? ""} />
                  <Field label="Email" defaultValue={session?.user?.email ?? ""} disabled />
                  <Field label="Role" defaultValue={session?.user?.role ?? ""} disabled />
                </div>
              </>
            )}

            {activeSection === "notifications" && (
              <>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#ede8e4" }}>Notification Preferences</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <Toggle label="Goal submission reminders" defaultChecked />
                  <Toggle label="Approval status updates" defaultChecked />
                  <Toggle label="Check-in window alerts" defaultChecked />
                  <Toggle label="Escalation notifications" />
                  <Toggle label="Weekly summary digest" />
                </div>
              </>
            )}

            {activeSection === "security" && (
              <>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#ede8e4" }}>Security</h2>
                <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.45)" }}>
                  Password changes are managed by your organization's identity provider. Contact your admin for help.
                </p>
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(48,176,208,0.06)",
                    border: "1px solid rgba(48,176,208,0.15)",
                  }}
                >
                  <p style={{ fontSize: "0.8125rem", color: "#5cc8e0", fontWeight: 600 }}>Session Info</p>
                  <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", marginTop: "0.25rem" }}>
                    Signed in as <strong style={{ color: "#ede8e4" }}>{session?.user?.email}</strong>
                  </p>
                </div>
              </>
            )}

            {activeSection === "appearance" && (
              <>
                <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#ede8e4" }}>Appearance</h2>
                <p style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.45)" }}>
                  Theme is controlled via the toggle in the top navigation bar. The AtomQuest 3D Flow Shader theme is always active.
                </p>
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(48,176,208,0.06)",
                    border: "1px solid rgba(48,176,208,0.15)",
                  }}
                >
                  <p style={{ fontSize: "0.8125rem", color: "#5cc8e0", fontWeight: 600 }}>Active Theme</p>
                  <p style={{ fontSize: "0.8125rem", color: "rgba(237,232,228,0.5)", marginTop: "0.25rem" }}>
                    AtomQuest 3D · Cyan Flow Shader Glassmorphism
                  </p>
                </div>
              </>
            )}

            {/* Save Button */}
            {["profile", "notifications"].includes(activeSection) && (
              <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="login-btn"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.625rem 1.5rem",
                    fontSize: "0.875rem",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, defaultValue, disabled }: { label: string; defaultValue: string; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(237,232,228,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        className="login-input"
        defaultValue={defaultValue}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "0.625rem 0.875rem",
          fontSize: "0.875rem",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : undefined,
        }}
      />
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.75)" }}>{label}</span>
      <button
        onClick={() => setOn((v) => !v)}
        style={{
          width: "2.75rem",
          height: "1.5rem",
          borderRadius: "9999px",
          background: on ? "linear-gradient(90deg, #30b0d0, #5cc8e0)" : "rgba(255,255,255,0.08)",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.25s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "0.1875rem",
            left: on ? "1.3125rem" : "0.1875rem",
            width: "1.125rem",
            height: "1.125rem",
            borderRadius: "50%",
            background: "#ffffff",
            transition: "left 0.25s ease",
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}
