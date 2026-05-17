// src/app/(dashboard)/goals/error.tsx
"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GoalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for tracking
    console.error("Goals route runtime crash caught by Boundary:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at center, #0a1926 0%, #050a0f 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      color: "#ede8e4"
    }}>
      <div className="glass-card" style={{
        maxWidth: "36rem",
        width: "100%",
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)"
      }}>
        {/* Header Icon & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "1rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <AlertCircle className="w-8 h-8 text-[#ef4444]" />
          </div>
          <div>
            <h1 className="font-serif-display" style={{ fontSize: "1.5rem", fontWeight: 600, color: "#ffffff" }}>
              Goals Dashboard Crash
            </h1>
            <p className="font-sans-body" style={{ fontSize: "0.875rem", color: "rgba(237,232,228,0.5)" }}>
              Caught by local diagnostics boundaries
            </p>
          </div>
        </div>

        {/* Error Info Box */}
        <div className="alert-glass" style={{
          padding: "1.25rem",
          background: "rgba(239, 68, 68, 0.04)",
          border: "1px solid rgba(239, 68, 68, 0.15)",
          borderRadius: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}>
          <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#f87171" }}>
            {error.name || "Error"}: {error.message || "Unknown unexpected crash occurred."}
          </div>
          {error.stack && (
            <pre style={{
              margin: 0,
              padding: "0.75rem",
              background: "rgba(0, 0, 0, 0.4)",
              borderRadius: "0.5rem",
              overflow: "auto",
              fontSize: "0.75rem",
              lineHeight: 1.5,
              color: "rgba(237, 232, 228, 0.7)",
              fontFamily: "monospace",
              maxHeight: "12rem"
            }}>
              {error.stack}
            </pre>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <button
            onClick={() => reset()}
            className="login-btn login-btn-primary"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "0.875rem"
            }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          
          <Link
            href="/"
            className="login-btn"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              textDecoration: "none",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
