// src/components/dashboard/AdminDashboard.tsx
"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CycleManager } from "@/components/admin/CycleManager";
import { SharedGoalPush } from "@/components/admin/SharedGoalPush";
import { EscalationList } from "@/components/admin/EscalationList";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AuditViewer } from "@/components/admin/AuditViewer";
import { ReportExport } from "@/components/admin/ReportExport";
import { Shield } from "lucide-react";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("cycles");

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Control Center</h1>
            <p className="text-slate-500">System configuration, compliance monitoring, and performance analytics</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
            <TabsTrigger value="cycles" className="flex-1 py-2.5">
              Cycles
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1 py-2.5">
              Shared Goals
            </TabsTrigger>
            <TabsTrigger value="escalations" className="flex-1 py-2.5">
              Escalations
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 py-2.5">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex-1 py-2.5">
              Audit
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 py-2.5">
              Reports
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="cycles">
              <CycleManager />
            </TabsContent>

            <TabsContent value="shared">
              <SharedGoalPush />
            </TabsContent>

            <TabsContent value="escalations">
              <EscalationList />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="audit">
              <AuditViewer />
            </TabsContent>

            <TabsContent value="reports">
              <ReportExport />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}