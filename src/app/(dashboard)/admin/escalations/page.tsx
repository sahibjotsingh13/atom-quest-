// src/app/(dashboard)/admin/escalations/page.tsx
"use client";
// System Escalations Monitoring Page

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Loader2, AlertTriangle, User, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminEscalationsPage() {
  const { data: escalations = [], isLoading } = useQuery({
    queryKey: ["adminEscalations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/escalations");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const statusColors: Record<string, string> = {
    open: "bg-red-100 text-red-700",
    resolved: "bg-green-100 text-green-700",
    dismissed: "bg-slate-100 text-slate-600",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Escalations</h1>
          <p className="text-slate-500">Monitor automated alerts for missed deadlines and goal inactivity</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Employee / Dept</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Triggered At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escalations.map((esc: any) => (
                    <TableRow key={esc.id}>
                      <TableCell>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          esc.escalationLevel === 1 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          L{esc.escalationLevel}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium">
                              {esc.employee?.firstName} {esc.employee?.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{esc.employee?.department?.name || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {esc.employee?.manager ? (
                          `${esc.employee.manager.firstName} ${esc.employee.manager.lastName}`
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(esc.triggeredAt), "MMM d, h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] uppercase ${statusColors[esc.status] || "bg-slate-100"}`}>
                          {esc.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {escalations.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No active escalations</p>
                <p className="text-xs text-slate-400">The system is running within defined timelines.</p>
              </div>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-50 border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                L1 Escalation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 leading-relaxed">
                Triggered when a deadline is missed by 3 days. Notifies the Employee and their direct Manager.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                L2 Escalation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 leading-relaxed">
                Triggered when a deadline is missed by 7 days. Escalates to the Department Head and HR Admin.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
