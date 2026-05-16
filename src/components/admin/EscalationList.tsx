// src/components/admin/EscalationList.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  ArrowRight,
  Loader2,
  Filter
} from "lucide-react";
import { format } from "date-fns";

export function EscalationList() {
  const [filter, setFilter] = useState("open");
  const queryClient = useQueryClient();

  const { data: escalations = [], isLoading } = useQuery({
    queryKey: ["escalations", filter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/escalations?status=${filter}`);
      return res.json();
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string, notes: string }) => {
      const res = await fetch("/api/admin/escalations", {
        method: "PATCH",
        body: JSON.stringify({ escalationId: id, status: "resolved", resolutionNotes: notes }),
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escalations"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">System Escalations</h2>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter("open")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === "open" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter("resolved")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === "resolved" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {escalations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-lg">No active escalations</p>
              <p className="text-sm">Everything is running smoothly according to system rules.</p>
            </CardContent>
          </Card>
        ) : (
          escalations.map((escalation: any) => (
            <Card key={escalation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className={`w-full md:w-2 ${escalation.status === 'open' ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div className="flex-1 p-6">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={escalation.status === 'open' ? 'destructive' : 'success'} className="uppercase text-[10px]">
                            {escalation.status}
                          </Badge>
                          <span className="text-xs text-slate-500">Level {escalation.escalationLevel}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg">{escalation.ruleName}</h3>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>{format(new Date(escalation.triggeredAt), "MMM d, yyyy")}</p>
                        <p>{format(new Date(escalation.triggeredAt), "HH:mm")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">Triggered For</p>
                            <p className="text-sm font-medium text-slate-900">{escalation.triggeredFor}</p>
                            <p className="text-xs text-slate-500 truncate">{escalation.triggeredForEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">Triggered By</p>
                            <p className="text-sm font-medium text-slate-900">{escalation.triggeredBy}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between">
                        {escalation.status === 'resolved' ? (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-100 h-full">
                            <p className="text-xs text-green-600 font-semibold uppercase mb-1">Resolution Details</p>
                            <p className="text-sm text-green-800 italic">"{escalation.resolutionNotes}"</p>
                            <p className="text-xs text-green-600 mt-2">Resolved by {escalation.resolvedBy} on {format(new Date(escalation.resolvedAt), "MMM d")}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col justify-end h-full pt-4">
                            <Button 
                              variant="destructive" 
                              className="w-full md:w-auto self-end"
                              onClick={() => {
                                const notes = prompt("Enter resolution notes:");
                                if (notes) resolveMutation.mutate({ id: escalation.id, notes });
                              }}
                            >
                              Resolve Escalation
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
