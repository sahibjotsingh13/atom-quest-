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

const COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0891b2", "#65a30d"];

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = analytics?.completionStats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={cycleId} onValueChange={(val) => setCycleId(val || "")}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select Cycle..." />
          </SelectTrigger>
          <SelectContent>
            {cycles.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_sheets}</p>
                  <p className="text-sm text-slate-500">Total Sheets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg"><Target className="w-6 h-6 text-green-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.completed_sheets}</p>
                  <p className="text-sm text-slate-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg"><TrendingUp className="w-6 h-6 text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending_approval}</p>
                  <p className="text-sm text-slate-500">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg"><BarChart3 className="w-6 h-6 text-purple-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.total_sheets > 0 
                      ? Math.round((stats.completed_sheets / stats.total_sheets) * 100) 
                      : 0}%
                  </p>
                  <p className="text-sm text-slate-500">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {analytics && (
        <>
          {/* QoQ Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Quarter-on-Quarter Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.qoqTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avg_achievement" stroke="#2563eb" name="Avg Achievement" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_progress" stroke="#059669" name="Avg Progress %" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.departmentBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avg_progress" fill="#2563eb" name="Avg Progress" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Thrust Area Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Goal Distribution by Thrust Area</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.thrustAreaDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="goal_count"
                        nameKey="thrust_area"
                      >
                        {analytics.thrustAreaDistribution.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manager Effectiveness */}
          <Card>
            <CardHeader>
              <CardTitle>Manager Effectiveness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Manager</th>
                      <th className="text-center py-3 px-4 text-slate-500 font-medium">Team Size</th>
                      <th className="text-center py-3 px-4 text-slate-500 font-medium">Approved Sheets</th>
                      <th className="text-center py-3 px-4 text-slate-500 font-medium">Check-ins Done</th>
                      <th className="text-center py-3 px-4 text-slate-500 font-medium">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.managerEffectiveness.map((m: any) => (
                      <tr key={m.manager} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">{m.manager}</td>
                        <td className="text-center py-3 px-4">{m.team_size}</td>
                        <td className="text-center py-3 px-4">{m.approved_sheets}</td>
                        <td className="text-center py-3 px-4">{m.checkins_completed}</td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-3">
                            <Progress 
                              value={m.team_size > 0 ? (m.checkins_completed / (m.team_size * 4)) * 100 : 0} 
                              className="w-24 h-2" 
                            />
                            <span className="text-xs font-medium text-slate-600">
                              {m.team_size > 0 ? Math.round((m.checkins_completed / (m.team_size * 4)) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
