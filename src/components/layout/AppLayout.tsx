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
  Bell, 
  Settings, 
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
  Atom
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    // Initialize theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Generate floating particles
    const container = document.getElementById("particles");
    if (container && container.children.length === 0) {
      const colors = ['#ffab91', '#ff7043', '#a07e6f', '#8d6e63', '#d2bab0'];
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
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-skin-950">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!session) return null;

  const role = session.user?.role;

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["employee", "manager", "admin"] },
    { label: "My Goals", href: "/goals", icon: <Target className="w-5 h-5" />, roles: ["employee"] },
    { label: "Check-ins", href: "/employee/checkins", icon: <CheckCircle className="w-5 h-5" />, roles: ["employee"] },
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
    <div className="flex h-screen overflow-hidden relative z-10 bg-skin-50 dark:bg-skin-950 text-skin-900 dark:text-skin-100 transition-colors duration-500">
      {/* Floating Background Particles */}
      <div id="particles" className="fixed inset-0 pointer-events-none overflow-hidden z-0"></div>

      {/* 3D Sidebar */}
      <aside 
        className={`sidebar-3d fixed lg:static inset-y-0 left-0 w-72 h-full glass flex flex-col border-r border-skin-200 dark:border-skin-800 z-50 transition-all duration-300 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo Area */}
        <div className="p-6 border-b border-skin-200 dark:border-skin-800">
          <Link href="/" className="flex items-center gap-3 perspective-1000">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-light to-accent-dark flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
              <Atom className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-skin-800 to-accent-dark dark:from-skin-100 dark:to-accent-light bg-clip-text text-transparent">AtomQuest</h1>
              <p className="text-xs text-skin-500 dark:text-skin-400">3D Goal Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-skin-400 dark:text-skin-500 uppercase tracking-wider mb-3 px-3">Navigation</div>
          
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium shadow-sm transform hover:translate-x-2 transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-accent-light/20 to-transparent text-accent-dark dark:text-accent-light border-l-4 border-accent"
                    : "hover:bg-skin-100 dark:hover:bg-skin-900 text-skin-600 dark:text-skin-300"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.label === "Approvals" && (
                  <span className="ml-auto bg-accent text-white text-xs px-2 py-0.5 rounded-full badge-bounce">3</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-skin-200 dark:border-skin-800">
          <div className="glass rounded-2xl p-4 flex items-center gap-3 mb-3 hover:shadow-lg transition-shadow">
            <Avatar className="w-10 h-10 border-2 border-accent/20 shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-skin-400 to-skin-600 text-white font-bold">
                {session.user?.firstName?.[0]}
                {session.user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{session.user?.firstName} {session.user?.lastName}</p>
              <p className="text-xs text-skin-500 dark:text-skin-400 capitalize">{role}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-skin-400" />
          </div>
          <Button
            variant="outline"
            className="w-full btn-3d bg-skin-100 dark:bg-skin-900 border-skin-200 dark:border-skin-800 hover:bg-destructive hover:text-white transition-colors"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-skin-50 via-skin-100/50 to-skin-200/30 dark:from-skin-950 dark:via-skin-900/50 dark:to-skin-800/30">
        {/* Top Navbar */}
        <header className="glass border-b border-skin-200 dark:border-skin-800 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="lg:hidden p-2 rounded-lg hover:bg-skin-100 dark:hover:bg-skin-800 transition-colors"
            >
              <Menu className="w-6 h-6 text-skin-800 dark:text-skin-100" />
            </button>
            <h2 className="text-2xl font-bold text-skin-800 dark:text-skin-100">
              {filteredNav.find((n) => n.href === pathname)?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Search goals..." 
                className="input-3d w-64 pl-10 pr-4 py-2.5 rounded-xl bg-skin-100 dark:bg-skin-900 border border-skin-200 dark:border-skin-700 focus:outline-none focus:border-accent dark:focus:border-accent-light text-sm"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-skin-400" />
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-skin-400" />
              <div 
                className={`switch-3d ${theme === "dark" ? "active" : ""}`} 
                onClick={toggleTheme}
              ></div>
              <Moon className="w-4 h-4 text-skin-400" />
            </div>

            {/* Notifications */}
            <NotificationCenter />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}