// src/components/layout/AppLayout.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  CalendarDays
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
  const role = session?.user?.role;

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

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
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">AtomQuest</h1>
              <p className="text-xs text-slate-500">Goal Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.icon}
                {item.label}
                {item.label === "Approvals" && (
                  <Badge variant="secondary" className="ml-auto text-xs">3</Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {session.user?.firstName?.[0]}
                {session.user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {session.user?.firstName} {session.user?.lastName}
              </p>
              <p className="text-xs text-slate-500 capitalize">{role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {filteredNav.find((n) => n.href === pathname)?.label || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}