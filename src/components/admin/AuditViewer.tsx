// src/components/admin/AuditViewer.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Search, Calendar, User, ArrowRight } from "lucide-react";

interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  changedBy: { firstName: string; lastName: string; email: string; role: string };
  changedAt: string;
  oldValues: any;
  newValues: any;
  changeReason?: string;
  ipAddress?: string;
}

export function AuditViewer() {
  const [tableName, setTableName] = useState("goal_sheets");
  const [recordId, setRecordId] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["auditLogs", tableName, recordId],
    queryFn: async () => {
      const params = new URLSearchParams({ tableName });
      if (recordId) params.set("recordId", recordId);
      const res = await fetch(`/api/admin/audit?${params}`);
      return res.json();
    },
  });

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return "null";
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "INSERT": return "bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30";
      case "UPDATE": return "bg-[#5cc8e0]/20 text-[#5cc8e0] border border-[#5cc8e0]/30";
      case "DELETE": return "bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30";
      default: return "bg-skin-800 text-skin-300 border border-skin-700";
    }
  };

  return (
    <div className="space-y-8 font-sans-body">
      <div className="glass p-6 rounded-2xl bg-skin-900/60 border border-skin-800 shadow-lg relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3 pb-6 border-b border-skin-800 mb-6">
          <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 shadow-inner">
            <FileText className="w-6 h-6 text-accent-light" />
          </div>
          <h2 className="text-2xl font-serif-display font-bold text-skin-50 bg-gradient-to-r from-skin-50 to-accent-light bg-clip-text text-transparent">
            Audit Trail
          </h2>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Select value={tableName} onValueChange={(val) => setTableName(val || "goal_sheets")}>
            <SelectTrigger className="w-56 bg-skin-950 border-skin-700 text-skin-100 focus:ring-accent-default focus:border-accent-default shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-skin-900 border-skin-700 text-skin-100 shadow-xl shadow-black/40">
              <SelectItem value="goal_sheets" className="focus:bg-skin-800 focus:text-skin-50">Goal Sheets</SelectItem>
              <SelectItem value="goals" className="focus:bg-skin-800 focus:text-skin-50">Goals</SelectItem>
              <SelectItem value="users" className="focus:bg-skin-800 focus:text-skin-50">Users</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-skin-500" />
            <Input
              placeholder="Filter by Record ID..."
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              className="pl-10 bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:ring-accent-default focus:border-accent-default shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-5">
          {logs.map((log: AuditLog) => (
            <div key={log.id} className="glass rounded-2xl p-6 bg-skin-900/40 border border-skin-800 border-l-4 border-l-accent-default shadow-md hover:shadow-xl hover:border-skin-700 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-skin-800/60">
                <div className="flex items-center gap-3.5">
                  <Badge className={`px-3 py-1 rounded-lg font-sans-body font-bold text-xs shadow-sm ${getActionColor(log.action)}`}>
                    {log.action}
                  </Badge>
                  <span className="text-base font-bold text-skin-50 tracking-wide">
                    {log.tableName}
                  </span>
                  <span className="text-xs text-skin-400 font-mono bg-skin-950/80 px-2.5 py-1 rounded-md border border-skin-800">
                    ID: {log.recordId.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-skin-400 bg-skin-800/40 px-3 py-1.5 rounded-lg border border-skin-700/50">
                  <Calendar className="w-3.5 h-3.5 text-accent-light" />
                  {new Date(log.changedAt).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-sm text-skin-300 mb-4 bg-skin-800/20 p-3 rounded-xl border border-skin-800/80">
                <div className="w-7 h-7 rounded-full bg-skin-800 flex items-center justify-center text-accent-light border border-skin-700">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-skin-100">{log.changedBy.firstName} {log.changedBy.lastName}</span>
                <span className="text-skin-400 font-medium">({log.changedBy.role})</span>
                {log.ipAddress && (
                  <span className="text-xs text-skin-500 font-mono ml-auto bg-skin-950 px-2.5 py-1 rounded border border-skin-800">{log.ipAddress}</span>
                )}
              </div>

              {log.changeReason && (
                <div className="mb-4 p-3.5 glass rounded-xl bg-amber-950/20 border border-amber-800/50 text-sm text-amber-200/90 shadow-inner">
                  <strong className="text-amber-400 font-bold">Reason for Change:</strong> {log.changeReason}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass rounded-xl p-4 bg-red-950/20 border border-red-900/40 shadow-inner">
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-red-900/30">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Before Change</p>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  </div>
                  <pre className="text-xs text-skin-200 font-mono overflow-auto max-h-40 p-2.5 bg-skin-950/80 rounded-lg border border-skin-800/80 leading-relaxed">
                    {formatValue(log.oldValues)}
                  </pre>
                </div>
                <div className="glass rounded-xl p-4 bg-green-950/20 border border-green-900/40 shadow-inner">
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-green-900/30">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">After Change</p>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <pre className="text-xs text-skin-200 font-mono overflow-auto max-h-40 p-2.5 bg-skin-950/80 rounded-lg border border-skin-800/80 leading-relaxed">
                    {formatValue(log.newValues)}
                  </pre>
                </div>
              </div>
            </div>
          ))}

          {logs.length === 0 && !isLoading && (
            <div className="glass rounded-2xl p-12 text-center text-skin-500 bg-skin-900/30 border border-skin-800">
              <FileText className="w-12 h-12 mx-auto mb-4 text-skin-600 animate-bounce" />
              <p className="text-lg font-serif-display font-bold text-skin-300 mb-1">No audit logs found</p>
              <p className="text-sm text-skin-500">Try adjusting your filters or searching for a different record ID.</p>
            </div>
          )}
          
          {isLoading && (
            <div className="glass rounded-2xl p-12 text-center text-skin-400 bg-skin-900/30 border border-skin-800">
              <div className="animate-spin w-10 h-10 border-4 border-accent-default border-t-transparent rounded-full mx-auto mb-4 shadow-[0_0_16px_rgba(48,176,208,0.5)]" />
              <p className="font-medium text-skin-300">Loading comprehensive audit trail...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
