// src/app/(dashboard)/admin/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FileText,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Target,
  Loader2,
  Lock,
  AlertTriangle,
  History,
} from "lucide-react";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const { overview, checkIns, goals, thrustAreas, cycle } = data || {};

  const statusColors: Record<string, string> = {
    not_started: "bg-slate-100 text-slate-600",
    on_track: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    at_risk: "bg-amber-100 text-amber-700",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500">
              {cycle ? `${cycle.name} · FY ${cycle.fiscalYear}` : "No active cycle"}
            </p>
          </div>
          {cycle && <Badge className="bg-green-100 text-green-700">Active Cycle</Badge>}
        </div>
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2 bg-white hover:bg-slate-50 border-slate-200"
            onClick={() => window.location.href = '/admin/shared-goals'}
          >
            <Target className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold">Push Shared Goals</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2 bg-white hover:bg-slate-50 border-slate-200"
            onClick={() => window.location.href = '/admin/sheets'}
          >
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold">Manage Sheets</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2 bg-white hover:bg-slate-50 border-slate-200"
            onClick={() => window.location.href = '/admin/cycles'}
          >
            <History className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold">Manage Cycles</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2 bg-white hover:bg-slate-50 border-slate-200"
            onClick={() => window.location.href = '/admin/escalations'}
          >
            <AlertTriangle className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold">View Escalations</span>
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">Total Employees</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{overview?.totalEmployees ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">Submitted</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{overview?.sheetsSubmitted ?? 0}</p>
              <Progress
                value={overview?.submissionRate ?? 0}
                className="h-1.5 mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">{overview?.submissionRate ?? 0}% submission rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">Approved</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{overview?.sheetsApproved ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">Locked</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{overview?.sheetsLocked ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Check-in Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Check-in Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600">Completion Rate</span>
                  <span className="text-sm font-bold">{checkIns?.completionRate ?? 0}%</span>
                </div>
                <Progress value={checkIns?.completionRate ?? 0} className="h-2" />
              </div>
              <div className="space-y-3">
                {(checkIns?.byQuarter || []).map((q: any) => (
                  <div key={q.quarter} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {q.quarter}
                      </div>
                      <span className="text-sm text-slate-700">Check-ins</span>
                    </div>
                    <span className="text-sm font-medium">{q.count}</span>
                  </div>
                ))}
                {(!checkIns?.byQuarter || checkIns.byQuarter.length === 0) && (
                  <p className="text-sm text-slate-400 text-center py-4">No check-ins yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Goal Status Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Goal Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(goals?.byStatus || []).map((g: any) => (
                  <div key={g.status} className="flex items-center justify-between">
                    <Badge className={statusColors[g.status] || "bg-slate-100 text-slate-600"}>
                      {g.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-sm font-medium">{g.count} goals</span>
                  </div>
                ))}
                {(!goals?.byStatus || goals.byStatus.length === 0) && (
                  <p className="text-sm text-slate-400 text-center py-4">No goals yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Thrust Areas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Top Thrust Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(thrustAreas || []).map((t: any, i: number) => {
                const max = thrustAreas?.[0]?.goalCount || 1;
                return (
                  <div key={t.name} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-700 w-48 truncate">{t.name}</span>
                    <div className="flex-1">
                      <Progress value={(t.goalCount / max) * 100} className="h-2" />
                    </div>
                    <span className="text-sm text-slate-500 w-16 text-right">{t.goalCount} goals</span>
                  </div>
                );
              })}
              {(!thrustAreas || thrustAreas.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">No thrust areas with goals</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
