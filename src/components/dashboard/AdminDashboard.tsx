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
import { Shield, Sparkles } from "lucide-react";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("cycles");

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Top Hero Banner */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-skin-200/60 dark:border-skin-800/60 relative overflow-hidden bg-gradient-to-r from-skin-100/40 via-transparent to-accent/5 dark:from-skin-900/40 dark:via-transparent dark:to-accent/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="flex justify-between items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-skin-900 dark:text-skin-50">Admin Control Center</h1>
                <span className="bg-accent/20 text-accent dark:text-accent-light border border-accent/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Live Portal
                </span>
              </div>
              <p className="text-skin-600 dark:text-skin-300 text-sm font-medium">
                System configuration, compliance monitoring, and high-fidelity performance analytics
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-light to-accent-dark flex items-center justify-center shadow-xl transform hover:rotate-12 transition-transform duration-300 flex-shrink-0">
              <Shield className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* 3D Styled Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="flex w-full glass p-2 rounded-2xl mb-6 overflow-x-auto no-scrollbar border border-skin-200/60 dark:border-skin-800/60 bg-white/40 dark:bg-skin-900/40 shadow-lg">
            <TabsTrigger value="cycles" className="flex-1 py-3 rounded-xl font-bold text-sm transition-all data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg">
              Cycles
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1 py-3 rounded-xl font-bold text-sm transition-all data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg">
              Shared Goals
            </TabsTrigger>
            <TabsTrigger value="escalations" className="flex-1 py-3 rounded-xl font-bold text-sm transition-all data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg">
              Escalations
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 py-3 rounded-xl font-bold text-sm transition-all data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex-1 py-3 rounded-xl font-bold text-sm transition-all data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg">
              Audit
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 py-3 rounded-xl font-bold text-sm transition-all data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-lg">
              Reports
            </TabsTrigger>
          </TabsList>

          <div className="mt-8 relative z-10">
            <TabsContent value="cycles" className="m-0">
              <CycleManager />
            </TabsContent>

            <TabsContent value="shared" className="m-0">
              <SharedGoalPush />
            </TabsContent>

            <TabsContent value="escalations" className="m-0">
              <EscalationList />
            </TabsContent>

            <TabsContent value="analytics" className="m-0">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="audit" className="m-0">
              <AuditViewer />
            </TabsContent>

            <TabsContent value="reports" className="m-0">
              <ReportExport />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}