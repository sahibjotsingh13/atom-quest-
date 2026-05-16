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
      case "INSERT": return "bg-green-100 text-green-700";
      case "UPDATE": return "bg-blue-100 text-blue-700";
      case "DELETE": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={tableName} onValueChange={(val) => setTableName(val || "goal_sheets")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="goal_sheets">Goal Sheets</SelectItem>
                <SelectItem value="goals">Goals</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Filter by Record ID..."
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-4">
            {logs.map((log: AuditLog) => (
              <Card key={log.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium text-slate-700">
                        {log.tableName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {log.recordId.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(log.changedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{log.changedBy.firstName} {log.changedBy.lastName}</span>
                    <span className="text-slate-400">({log.changedBy.role})</span>
                    {log.ipAddress && (
                      <span className="text-xs text-slate-400 font-mono ml-2">{log.ipAddress}</span>
                    )}
                  </div>

                  {log.changeReason && (
                    <div className="mb-3 p-2 bg-amber-50 rounded text-sm text-amber-800">
                      <strong>Reason:</strong> {log.changeReason}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wide">Before</p>
                      <pre className="text-xs text-slate-700 overflow-auto max-h-32">
                        {formatValue(log.oldValues)}
                      </pre>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wide">After</p>
                      <pre className="text-xs text-slate-700 overflow-auto max-h-32">
                        {formatValue(log.newValues)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {logs.length === 0 && !isLoading && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No audit logs found</p>
              </div>
            )}
            
            {isLoading && (
              <div className="text-center py-12 text-slate-500">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p>Loading audit logs...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
