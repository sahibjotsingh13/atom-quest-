// src/components/layout/AppLayout.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  LayoutDashboard,
  Users,
  CheckCircle,
  LogOut,
  Shield,
  BarChart3,
  AlertTriangle,
  Loader2,
  FileText,
  CalendarDays,
  Sun,
  Moon,
  Search,
  Menu,
  ChevronRight,
  Atom,
  Settings,
} from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = session?.user?.role;

  const { data: teamData } = useQuery({
    queryKey: ["managerTeam"],
    queryFn: async () => {
      const res = await fetch("/api/manager/team");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!session && role === "manager",
  });

  const pendingApprovalsCount = teamData?.summary?.pendingApprovals ?? 0;

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;

    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#050a0f" }}>
        <Loader2 className="w-12 h-12 animate-spin text-[#ff7043]" />
      </div>
    );
  }

  if (!session) return null;

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["employee", "manager", "admin"] },
    { label: "My Goals", href: "/goals", icon: <Target className="w-5 h-5" />, roles: ["employee"] },
    { label: "Check-ins", href: "/employee/checkins", icon: <CheckCircle className="w-5 h-5" />, roles: ["employee"] },
    { label: "My Analytics", href: "/employee/analytics", icon: <BarChart3 className="w-5 h-5" />, roles: ["employee"] },
    { label: "Team", href: "/team", icon: <Users className="w-5 h-5" />, roles: ["manager"] },
    { label: "Approvals", href: "/approvals", icon: <CheckCircle className="w-5 h-5" />, roles: ["manager"] },
    { label: "Team Check-ins", href: "/manager/checkins", icon: <CheckCircle className="w-5 h-5" />, roles: ["manager"] },
    { label: "Analytics", href: "/analytics", icon: <BarChart3 className="w-5 h-5" />, roles: ["manager", "admin"] },
    { label: "Admin", href: "/admin", icon: <Shield className="w-5 h-5" />, roles: ["admin"] },
    { label: "All Sheets", href: "/admin/sheets", icon: <FileText className="w-5 h-5" />, roles: ["admin"] },
    { label: "Shared Goals", href: "/admin/shared-goals", icon: <Target className="w-5 h-5" />, roles: ["admin"] },
    { label: "Cycles", href: "/admin/cycles", icon: <CalendarDays className="w-5 h-5" />, roles: ["admin"] },
    { label: "Escalations", href: "/admin/escalations", icon: <AlertTriangle className="w-5 h-5" />, roles: ["admin"] },
    { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" />, roles: ["employee", "manager", "admin"] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role || ""));

  return (
    <div className="flex h-screen overflow-hidden relative z-10 bg-[var(--background)] text-[var(--foreground)]">
      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "18rem",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          transition: "all 0.3s ease",
          background: "var(--card-bg)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo Area */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.5rem",
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Atom className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)" }}>
                AtomQuest
              </h1>
              <p style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>Goal Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem", overflowY: "auto" }}>
          <div className="font-sans-body" style={{ fontSize: "0.6875rem", fontWeight: 700, color: "rgba(237,232,228,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", paddingLeft: "0.75rem" }}>
            Navigation
          </div>

          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  textDecoration: "none",
                  background: isActive ? "var(--primary-light)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  borderLeft: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--hover-bg)";
                    e.currentTarget.style.color = "var(--foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--muted-foreground)";
                  }
                }}
              >
                <span style={{ color: isActive ? "var(--primary)" : "inherit", transition: "color 0.2s ease" }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.label === "Approvals" && pendingApprovalsCount > 0 && (
                  <span style={{ marginLeft: "auto", background: "var(--primary)", color: "white", fontSize: "0.625rem", padding: "0.125rem 0.5rem", borderRadius: "9999px", fontWeight: 700 }}>
                    {pendingApprovalsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: "0.5rem", marginBottom: "0.75rem", background: "var(--primary-light)", border: "1px solid var(--border)" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "50%",
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "white",
                flexShrink: 0,
              }}
            >
              {session.user?.firstName?.[0]}{session.user?.lastName?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session.user?.firstName} {session.user?.lastName}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", textTransform: "capitalize" }}>
                {role}
              </p>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          </div>
          <button
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.625rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              color: "var(--muted-foreground)",
              transition: "all 0.2s ease",
            }}
            onClick={() => signOut({ callbackUrl: "/login" })}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--destructive-light)";
              e.currentTarget.style.color = "var(--destructive)";
              e.currentTarget.style.borderColor = "var(--destructive)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--muted-foreground)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5,10,15,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 40,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", marginLeft: "18rem" }}>
        {/* Top Navbar */}
        <header style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--border)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: "none",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                background: "transparent",
                border: "none",
                color: "#ede8e4",
                cursor: "pointer",
              }}
              className="sidebar-toggle-btn"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="font-serif-display" style={{ fontSize: "1.25rem", fontWeight: 600, color: "#ffffff", textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}>
              {filteredNav.find((n) => n.href === pathname)?.label || "Dashboard"}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Search */}
            <div style={{ position: "relative", display: "none" }} className="search-box">
              <input
                type="text"
                placeholder="Search goals..."
                className="login-input font-sans-body"
                style={{
                  width: "16rem",
                  paddingLeft: "2.5rem",
                  paddingRight: "1rem",
                  paddingTop: "0.625rem",
                  paddingBottom: "0.625rem",
                  fontSize: "0.8125rem",
                }}
              />
              <Search className="w-4 h-4" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "rgba(237,232,228,0.3)" }} />
            </div>

            {/* Theme Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sun className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <button
                id="themeToggle"
                className="w-10 h-5 rounded-full bg-[var(--border)] relative flex items-center px-1 transition-colors"
                onClick={toggleTheme}
                style={{
                  background: theme === "dark" ? "var(--primary)" : "var(--border)",
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full bg-white transition-transform" 
                  style={{
                    transform: theme === "dark" ? "translateX(20px)" : "translateX(0)"
                  }}
                />
              </button>
              <Moon className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            </div>

            {/* Notifications */}
            <NotificationCenter />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "2rem", position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%) !important;
          }
          .sidebar.open {
            transform: translateX(0) !important;
          }
          main {
            margin-left: 0 !important;
          }
          .sidebar-toggle-btn {
            display: block !important;
          }
        }
        @media (min-width: 1025px) {
          .sidebar {
            transform: translateX(0) !important;
            position: fixed !important;
          }
        }
        @media (min-width: 768px) {
          .search-box {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}