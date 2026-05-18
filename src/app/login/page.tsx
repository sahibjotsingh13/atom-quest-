"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Target, Atom } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password: "demo",
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const demoAccounts = [
    { email: "employee@demo.com", role: "Employee", color: "from-[#4a8fa8] to-[#2d5a73]" },
    { email: "manager@demo.com", role: "Manager", color: "from-[#30b0d0] to-[#1a8ca8]" },
    { email: "admin@demo.com", role: "Admin", color: "from-[#5cc8e0] to-[#4a8fa8]" },
  ];

  const textShadow = "0 2px 24px rgba(0,0,0,0.45)";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        position: "relative",
        overflow: "hidden",
        background: "#050A0F",
      }}
    >
      {/* Ambient glow behind the form */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(48,176,208,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          borderRadius: "50%",
        }}
      />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "1.25rem",
              background: "linear-gradient(135deg, #5cc8e0, #1a8ca8)",
              marginBottom: "1.5rem",
              boxShadow: "0 8px 32px rgba(48, 176, 208, 0.3)",
            }}
          >
            <Atom style={{ width: "36px", height: "36px", color: "#050a0f" }} />
          </div>
          <h1
            className="font-serif-display"
            style={{
              fontSize: "2.25rem",
              fontWeight: 300,
              color: "#ffffff",
              letterSpacing: "0.1em",
              textShadow,
              marginBottom: "0.5rem",
            }}
          >
            AtomQuest
          </h1>
          <p
            className="font-sans-body"
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Goal Setting & Tracking Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="login-glass" style={{ padding: "2.5rem" }}>
          {/* Eyebrow */}
          <p
            className="font-sans-body"
            style={{
              fontSize: "11px",
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            Authentication
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#f87171",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                }}
              >
                <Target style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                className="font-sans-body"
                htmlFor="email"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "rgba(237, 232, 228, 0.7)",
                  letterSpacing: "0.05em",
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                className="login-input"
                style={{ padding: "0.875rem 1rem", fontSize: "0.875rem" }}
              />
            </div>

            {/* Password Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                className="font-sans-body"
                htmlFor="password"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "rgba(237, 232, 228, 0.7)",
                  letterSpacing: "0.05em",
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value="demo"
                disabled
                className="login-input"
                style={{
                  padding: "0.875rem 1rem",
                  fontSize: "0.875rem",
                  opacity: 0.6,
                  cursor: "not-allowed",
                }}
              />
              <p
                className="font-sans-body"
                style={{
                  fontSize: "0.6875rem",
                  color: "rgba(237, 232, 228, 0.35)",
                  marginTop: "0.25rem",
                }}
              >
                Demo mode: password is always &quot;demo&quot;
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-btn login-btn-primary"
              style={{
                width: "100%",
                marginTop: "0.5rem",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              margin: "1.75rem 0 1.25rem",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            <span
              className="font-sans-body"
              style={{
                fontSize: "0.6875rem",
                color: "rgba(237, 232, 228, 0.4)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Demo Accounts
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Demo Accounts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {demoAccounts.map((account) => {
              const isSelected = email === account.email;
              return (
                <button
                  key={account.email}
                  onClick={() => setEmail(account.email)}
                  className={`group relative flex items-center justify-between w-full p-[0.875rem] px-4 rounded-[0.875rem] text-left transition-all duration-300 ease-out outline-none select-none hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-sm ${
                    isSelected
                      ? "border border-[#30b0d0]/30 bg-[#30b0d0]/10 text-[#ede8e4]"
                      : "border border-white/10 bg-white/5 text-[#ede8e4] hover:bg-white/10 hover:border-white/20"
                  }`}
                  style={{
                    boxShadow: isSelected ? "0 4px 12px rgba(48, 176, 208, 0.15)" : undefined,
                  }}
                >
                  <div>
                    <p
                      className="font-sans-body"
                      style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                    >
                      {account.email}
                    </p>
                  </div>
                  <span
                    className="font-sans-body"
                    style={{
                      fontSize: "0.6875rem",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${account.color.split(" ")[0].replace("from-[", "").replace("]", "")}, ${account.color.split(" ")[1].replace("to-[", "").replace("]", "")})`,
                      color: "#ffffff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {account.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <p
          className="font-sans-body"
          style={{
            textAlign: "center",
            fontSize: "0.6875rem",
            color: "rgba(237, 232, 228, 0.25)",
            marginTop: "1.5rem",
            letterSpacing: "0.1em",
          }}
        >
          &copy; 2025 AtomQuest. All rights reserved.
        </p>
      </div>
    </div>
  );
}
