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
        <Loader2 className="w-8 h-8 animate-spin text-accent-default" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans-body">
      <div className="glass p-6 rounded-2xl bg-skin-900/60 border border-skin-800 shadow-lg flex flex-wrap justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-serif-display font-bold text-skin-50 bg-gradient-to-r from-skin-50 to-accent-light bg-clip-text text-transparent">
            System Escalations
          </h2>
        </div>
        <div className="flex gap-1.5 glass p-1.5 rounded-xl bg-skin-950/80 border border-skin-800 relative z-10 shadow-inner">
          <button
            onClick={() => setFilter("open")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
              filter === "open" ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-md" : "text-skin-400 hover:text-skin-200"
            }`}
          >
            Open ({escalations.length})
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
              filter === "resolved" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md" : "text-skin-400 hover:text-skin-200"
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {escalations.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center text-skin-500 bg-skin-900/30 border border-skin-800 shadow-sm">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500 animate-bounce" />
            <p className="font-serif-display font-bold text-2xl text-skin-100 mb-2">No active escalations</p>
            <p className="text-sm text-skin-400 max-w-md mx-auto leading-relaxed">Everything is running perfectly according to system rules. All workflows are operating within SLA limits.</p>
          </div>
        ) : (
          escalations.map((escalation: any) => (
            <div key={escalation.id} className="glass rounded-2xl bg-skin-900/40 border border-skin-800 shadow-lg hover:shadow-2xl hover:border-skin-700 transition-all duration-500 overflow-hidden relative group">
              <div className="flex flex-col md:flex-row">
                <div className={`w-full md:w-2.5 ${escalation.status === 'open' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]'}`} />
                <div className="flex-1 p-6 md:p-8">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-4 border-b border-skin-800/60">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <Badge className={`px-3 py-1 rounded-lg font-sans-body font-bold text-xs uppercase shadow-sm ${
                          escalation.status === 'open' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {escalation.status}
                        </Badge>
                        <span className="text-xs font-bold text-skin-400 bg-skin-950 px-3 py-1 rounded-md border border-skin-800 shadow-inner">
                          Level {escalation.escalationLevel}
                        </span>
                      </div>
                      <h3 className="font-serif-display font-bold text-skin-50 text-xl tracking-tight pt-1">{escalation.ruleName}</h3>
                    </div>
                    <div className="text-right text-xs font-semibold text-skin-400 glass px-4 py-2 rounded-xl bg-skin-800/30 border border-skin-700/50">
                      <p className="text-skin-200 font-bold mb-0.5">{format(new Date(escalation.triggeredAt), "MMM d, yyyy")}</p>
                      <p className="text-accent-light">{format(new Date(escalation.triggeredAt), "HH:mm")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 glass rounded-xl bg-skin-800/30 border border-skin-700 shadow-inner">
                        <div className="w-10 h-10 rounded-full bg-skin-800 flex items-center justify-center text-accent-light border border-skin-700 shadow-sm">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-skin-400 font-bold uppercase tracking-wider mb-0.5">Triggered For</p>
                          <p className="text-sm font-bold text-skin-50 truncate">{escalation.triggeredFor}</p>
                          <p className="text-xs text-skin-400 truncate">{escalation.triggeredForEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 glass rounded-xl bg-skin-800/30 border border-skin-700 shadow-inner">
                        <div className="w-10 h-10 rounded-full bg-skin-800 flex items-center justify-center text-amber-400 border border-skin-700 shadow-sm">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-skin-400 font-bold uppercase tracking-wider mb-0.5">Triggered By</p>
                          <p className="text-sm font-bold text-skin-50">{escalation.triggeredBy}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      {escalation.status === 'resolved' ? (
                        <div className="glass p-5 rounded-xl bg-green-950/20 border border-green-800/50 shadow-inner h-full flex flex-col justify-center">
                          <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Resolution Details
                          </p>
                          <p className="text-sm text-skin-100 font-medium italic leading-relaxed bg-skin-950/60 p-3.5 rounded-lg border border-skin-800/80 mb-3">
                            &ldquo;{escalation.resolutionNotes}&rdquo;
                          </p>
                          <p className="text-xs text-skin-400 font-medium mt-auto">
                            Resolved by <span className="text-skin-200 font-bold">{escalation.resolvedBy}</span> on <span className="text-accent-light font-bold">{format(new Date(escalation.resolvedAt), "MMM d, yyyy")}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-end h-full pt-4 md:pt-0">
                          <Button 
                            variant="destructive" 
                            className="w-full md:w-auto self-end bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30 px-6 py-6 rounded-xl text-base"
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
