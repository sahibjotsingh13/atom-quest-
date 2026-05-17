// src/components/admin/AnalyticsDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from "recharts";
import { BarChart3, TrendingUp, Users, Target, Loader2 } from "lucide-react";

// Premium 3-Flow-Shader Cyan Palette Colors
const COLORS = [
  "#30b0d0", // accent-default
  "#5cc8e0", // accent-light
  "#1a8ca8", // accent-dark
  "#4a8fa8", // skin-400
  "#6bb3cc", // skin-300
  "#2d5a73", // skin-500
  "#9dd1e0", // skin-200
  "#1e3a4d", // skin-600
];

export function AnalyticsDashboard() {
  const [cycleId, setCycleId] = useState("");
  
  const { data: cycles = [] } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cycles");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", cycleId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?cycleId=${cycleId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!cycleId,
  });

  // Set first cycle as default when cycles load
  useEffect(() => {
    if (cycles.length > 0 && !cycleId) {
      setCycleId(cycles[0].id);
    }
  }, [cycles, cycleId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent-default" />
      </div>
    );
  }

  const stats = analytics?.completionStats;

  return (
    <div className="space-y-8 font-sans-body">
      <div className="flex items-center justify-between glass p-6 rounded-2xl bg-skin-900/60 border border-skin-800 shadow-lg">
        <h2 className="text-2xl font-serif-display font-bold text-skin-50 bg-gradient-to-r from-skin-50 to-accent-light bg-clip-text text-transparent">
          Analytics Dashboard
        </h2>
        <Select value={cycleId} onValueChange={(val) => setCycleId(val || "")}>
          <SelectTrigger className="w-64 bg-skin-950 border-skin-700 text-skin-100 focus:ring-accent-default focus:border-accent-default shadow-sm">
            <SelectValue placeholder="Select Cycle..." />
          </SelectTrigger>
          <SelectContent className="bg-skin-900 border-skin-700 text-skin-100 shadow-xl shadow-black/40">
            {cycles.map((c: any) => (
              <SelectItem key={c.id} value={c.id} className="focus:bg-skin-800 focus:text-skin-50">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass rounded-2xl p-6 bg-skin-900/60 border border-skin-800 shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all duration-500 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-3.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-serif-display font-extrabold text-skin-50 tracking-tight">{stats.total_sheets}</p>
                <p className="text-xs font-semibold text-skin-400 uppercase tracking-wider pt-0.5">Total Sheets</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 bg-skin-900/60 border border-skin-800 shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all duration-500 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-serif-display font-extrabold text-emerald-400 tracking-tight">{stats.completed_sheets}</p>
                <p className="text-xs font-semibold text-skin-400 uppercase tracking-wider pt-0.5">Completed</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 bg-skin-900/60 border border-skin-800 shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all duration-500 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500 pointer-events-none"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-inner">
                <TrendingUp className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-3xl font-serif-display font-extrabold text-amber-400 tracking-tight">{stats.pending_approval}</p>
                <p className="text-xs font-semibold text-skin-400 uppercase tracking-wider pt-0.5">Pending Approval</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 bg-skin-900/60 border border-skin-800 shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all duration-500 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-all duration-500 pointer-events-none"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-3.5 bg-accent/10 rounded-xl border border-accent/20 shadow-inner">
                <BarChart3 className="w-6 h-6 text-accent-light" />
              </div>
              <div>
                <p className="text-3xl font-serif-display font-extrabold text-accent-light tracking-tight">
                  {stats.total_sheets > 0 
                    ? Math.round((stats.completed_sheets / stats.total_sheets) * 100) 
                    : 0}%
                </p>
                <p className="text-xs font-semibold text-skin-400 uppercase tracking-wider pt-0.5">Completion Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {analytics && (
        <>
          {/* QoQ Trends */}
          <div className="glass rounded-2xl p-6 bg-skin-900/60 border border-skin-800 shadow-lg relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="pb-6 border-b border-skin-800 mb-6">
              <h3 className="text-xl font-serif-display font-bold text-skin-50 tracking-tight">Quarter-on-Quarter Trends</h3>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.qoqTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="quarter" stroke="rgba(237,232,228,0.5)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="rgba(237,232,228,0.5)" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(18,28,38,0.95)", 
                      borderColor: "rgba(255,255,255,0.1)", 
                      borderRadius: "1rem",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                      color: "#ede8e4",
                      fontFamily: "var(--font-sans)",
                    }} 
                  />
                  <Legend wrapperStyle={{ paddingTop: "1rem", fontSize: "0.875rem", color: "#ede8e4" }} />
                  <Line type="monotone" dataKey="avg_achievement" stroke="#30b0d0" name="Avg Achievement" strokeWidth={3} dot={{ r: 5, fill: "#30b0d0", strokeWidth: 2, stroke: "#050a0f" }} activeDot={{ r: 8, strokeWidth: 2, stroke: "#5cc8e0" }} />
                  <Line type="monotone" dataKey="avg_progress" stroke="#5cc8e0" name="Avg Progress %" strokeWidth={3} dot={{ r: 5, fill: "#5cc8e0", strokeWidth: 2, stroke: "#050a0f" }} activeDot={{ r: 8, strokeWidth: 2, stroke: "#ffffff" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Department Breakdown */}
            <div className="glass rounded-2xl p-6 bg-skin-900/60 border border-skin-800 shadow-lg relative overflow-hidden">
              <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="pb-6 border-b border-skin-800 mb-6">
                <h3 className="text-xl font-serif-display font-bold text-skin-50 tracking-tight">Department Performance</h3>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.departmentBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="department" stroke="rgba(237,232,228,0.5)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="rgba(237,232,228,0.5)" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(18,28,38,0.95)", 
                        borderColor: "rgba(255,255,255,0.1)", 
                        borderRadius: "1rem",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                        color: "#ede8e4",
                        fontFamily: "var(--font-sans)",
                      }} 
                    />
                    <Bar dataKey="avg_progress" fill="#30b0d0" name="Avg Progress" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Thrust Area Distribution */}
            <div className="glass rounded-2xl p-6 bg-skin-900/60 border border-skin-800 shadow-lg relative overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="pb-6 border-b border-skin-800 mb-6">
                <h3 className="text-xl font-serif-display font-bold text-skin-50 tracking-tight">Goal Distribution by Thrust Area</h3>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.thrustAreaDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="goal_count"
                      nameKey="thrust_area"
                    >
                      {analytics.thrustAreaDistribution.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(18,28,38,0.95)", 
                        borderColor: "rgba(255,255,255,0.1)", 
                        borderRadius: "1rem",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                        color: "#ede8e4",
                        fontFamily: "var(--font-sans)",
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Manager Effectiveness */}
          <div className="glass rounded-2xl p-6 bg-skin-900/60 border border-skin-800 shadow-lg relative overflow-hidden">
            <div className="absolute -left-20 -top-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="pb-6 border-b border-skin-800 mb-6">
              <h3 className="text-xl font-serif-display font-bold text-skin-50 tracking-tight">Manager Effectiveness</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans-body">
                <thead>
                  <tr className="border-b border-skin-800">
                    <th className="text-left py-4 px-4 text-skin-400 font-semibold tracking-wider uppercase text-xs">Manager</th>
                    <th className="text-center py-4 px-4 text-skin-400 font-semibold tracking-wider uppercase text-xs">Team Size</th>
                    <th className="text-center py-4 px-4 text-skin-400 font-semibold tracking-wider uppercase text-xs">Approved Sheets</th>
                    <th className="text-center py-4 px-4 text-skin-400 font-semibold tracking-wider uppercase text-xs">Check-ins Done</th>
                    <th className="text-center py-4 px-4 text-skin-400 font-semibold tracking-wider uppercase text-xs">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-skin-800/50">
                  {analytics.managerEffectiveness.map((m: any) => (
                    <tr key={m.manager} className="hover:bg-skin-800/30 transition-colors duration-300">
                      <td className="py-4 px-4 font-bold text-skin-50">{m.manager}</td>
                      <td className="text-center py-4 px-4 text-skin-200 font-medium">{m.team_size}</td>
                      <td className="text-center py-4 px-4 text-skin-200 font-medium">{m.approved_sheets}</td>
                      <td className="text-center py-4 px-4 text-skin-200 font-medium">{m.checkins_completed}</td>
                      <td className="text-center py-4 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="relative w-28 bg-skin-800 rounded-full h-2 overflow-hidden p-0.5 shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-accent-light via-accent to-accent-dark rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(48,176,208,0.5)]"
                              style={{ width: `${m.team_size > 0 ? Math.min(100, (m.checkins_completed / (m.team_size * 4)) * 100) : 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-accent-light w-8 text-right">
                            {m.team_size > 0 ? Math.round((m.checkins_completed / (m.team_size * 4)) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
