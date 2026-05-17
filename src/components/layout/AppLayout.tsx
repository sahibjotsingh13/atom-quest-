// src/components/layout/AppLayout.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    // Initialize theme - default to dark for flow shader
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.getElementById("themeToggle")?.classList.add("active");
    } else {
      document.documentElement.classList.remove("dark");
      document.getElementById("themeToggle")?.classList.remove("active");
    }

    // Generate floating particles - cyan/teal for flow shader
    const container = document.getElementById("particles");
    if (container && container.children.length === 0) {
      const colors = ['#30b0d0', '#1a8ca8', '#5cc8e0', '#4a8fa8', '#2d5a73', '#6bb3cc'];
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 20 + 5;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        container.appendChild(particle);
      }
    }

    // 3D Mouse Parallax Effect
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.iso-card, .goal-stack-item');
      const x = (window.innerWidth / 2 - e.pageX) / 50;
      const y = (window.innerHeight / 2 - e.pageY) / 50;

      cards.forEach((card: any, index) => {
        const factor = (index % 3 + 1) * 0.5;
        card.style.transform = `perspective(1000px) rotateY(${x * factor}deg) rotateX(${y * factor}deg) translateZ(10px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const toggle = document.getElementById('themeToggle');

    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      toggle?.classList.remove('active');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      html.classList.add('dark');
      toggle?.classList.add('active');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#050a0f" }}>
        <Loader2 className="w-12 h-12 animate-spin text-[#30b0d0]" />
      </div>
    );
  }

  if (!session) return null;

  const role = session.user?.role;

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["employee", "manager", "admin"] },
    { label: "My Goals", href: "/goals", icon: <Target className="w-5 h-5" />, roles: ["employee"] },
    { label: "Check-ins", href: "/employee/checkins", icon: <CheckCircle className="w-5 h-5" />, roles: ["employee"] },
    { label: "Analytics", href: "/employee/analytics", icon: <BarChart3 className="w-5 h-5" />, roles: ["employee"] },
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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative", zIndex: 10, background: "#050a0f", color: "#ede8e4" }}>
      {/* Floating Background Particles */}
      <div id="particles" style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}></div>

      {/* 3D Sidebar */}
      <aside
        className={`sidebar-3d ${sidebarOpen ? "open" : ""}`}
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
          background: "rgba(5, 10, 15, 0.85)",
          backdropFilter: "blur(16px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "5px 0 25px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo Area */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #5cc8e0, #1a8ca8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(48,176,208,0.3)",
              }}
            >
              <Atom className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="font-serif-display" style={{ fontSize: "1.125rem", fontWeight: 700, background: "linear-gradient(135deg, #5cc8e0, #1a8ca8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                AtomQuest
              </h1>
              <p className="font-sans-body" style={{ fontSize: "0.6875rem", color: "rgba(237,232,228,0.4)" }}>Goal Portal</p>
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
                  borderRadius: "0.75rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  transition: "all 0.3s ease",
                  textDecoration: "none",
                  background: isActive ? "linear-gradient(90deg, rgba(48,176,208,0.12), transparent)" : "transparent",
                  color: isActive ? "#5cc8e0" : "rgba(237,232,228,0.6)",
                  borderLeft: isActive ? "3px solid #30b0d0" : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "#ede8e4";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(237,232,228,0.6)";
                  }
                }}
              >
                <span style={{ color: isActive ? "#30b0d0" : "inherit", transition: "color 0.3s ease" }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.label === "Approvals" && (
                  <span style={{ marginLeft: "auto", background: "#30b0d0", color: "#050a0f", fontSize: "0.625rem", padding: "0.125rem 0.5rem", borderRadius: "9999px", fontWeight: 800 }}>
                    3
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="glass" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: "1rem", marginBottom: "0.75rem", transition: "box-shadow 0.3s ease" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.75rem",
                color: "#ede8e4",
                border: "2px solid rgba(48,176,208,0.15)",
                flexShrink: 0,
              }}
            >
              {session.user?.firstName?.[0]}{session.user?.lastName?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="font-sans-body" style={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session.user?.firstName} {session.user?.lastName}
              </p>
              <p className="font-sans-body" style={{ fontSize: "0.75rem", color: "rgba(237,232,228,0.4)", textTransform: "capitalize" }}>
                {role}
              </p>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "rgba(237,232,228,0.3)", flexShrink: 0 }} />
          </div>
          <button
            className="login-btn font-sans-body"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "0.8125rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#f87171",
            }}
            onClick={() => signOut({ callbackUrl: "/login" })}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
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
        <header className="glass" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
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
              <Sun className="w-4 h-4" style={{ color: "rgba(237,232,228,0.3)" }} />
              <div
                id="themeToggle"
                className={`switch-3d ${theme === "dark" ? "active" : ""}`}
                onClick={toggleTheme}
              ></div>
              <Moon className="w-4 h-4" style={{ color: "rgba(237,232,228,0.3)" }} />
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
          .sidebar-3d {
            transform: translateX(-100%) !important;
          }
          .sidebar-3d.open {
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
          .sidebar-3d {
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