// src/components/admin/CycleManager.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Trash2,
  CalendarDays
} from "lucide-react";
import { format } from "date-fns";

export function CycleManager() {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cycles");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/cycles", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create cycle");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      setOpen(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/cycles/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/cycles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      setIsDeleting(null);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    createMutation.mutate(data);
  };

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
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 shadow-inner">
            <CalendarDays className="w-6 h-6 text-accent-light" />
          </div>
          <h2 className="text-2xl font-serif-display font-bold text-skin-50 bg-gradient-to-r from-skin-50 to-accent-light bg-clip-text text-transparent">
            Appraisal Cycles
          </h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="sm" className="bg-accent-default hover:bg-accent-dark text-white font-semibold shadow-lg shadow-accent-default/20 rounded-xl px-5 py-2.5 relative z-10">
                <Plus className="w-4 h-4 mr-2" /> New Cycle
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px] bg-skin-900 border-skin-700 text-skin-100 shadow-2xl shadow-black/50 rounded-2xl font-sans-body">
            <DialogHeader>
              <DialogTitle className="font-serif-display text-xl font-bold text-skin-50">Create New Appraisal Cycle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 font-sans-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-skin-200 font-medium">Cycle Name</Label>
                  <Input id="name" name="name" placeholder="e.g. FY 2024-25" className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:border-accent-default focus:ring-accent-default shadow-sm" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscalYear" className="text-skin-200 font-medium">Fiscal Year</Label>
                  <Input id="fiscalYear" name="fiscalYear" placeholder="e.g. 2024-25" className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:border-accent-default focus:ring-accent-default shadow-sm" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-skin-200 font-medium">Goal Setting Start</Label>
                  <Input type="date" name="goalSettingStart" className="bg-skin-950 border-skin-700 text-skin-100 focus:border-accent-default focus:ring-accent-default shadow-sm" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-skin-200 font-medium">Goal Setting End</Label>
                  <Input type="date" name="goalSettingEnd" className="bg-skin-950 border-skin-700 text-skin-100 focus:border-accent-default focus:ring-accent-default shadow-sm" required />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-accent-light uppercase tracking-wider">Quarterly Windows</p>
                <div className="grid grid-cols-2 gap-4 border border-skin-700 bg-skin-950/60 p-4 rounded-xl shadow-inner">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-skin-300">Q1 Start / End</Label>
                    <div className="flex gap-2">
                      <Input type="date" name="q1Start" className="text-xs bg-skin-900 border-skin-700 text-skin-100 focus:border-accent-default focus:ring-accent-default" required />
                      <Input type="date" name="q1End" className="text-xs bg-skin-900 border-skin-700 text-skin-100 focus:border-accent-default focus:ring-accent-default" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-skin-300">Q2 Start / End</Label>
                    <div className="flex gap-2">
                      <Input type="date" name="q2Start" className="text-xs bg-skin-900 border-skin-700 text-skin-100 focus:border-accent-default focus:ring-accent-default" required />
                      <Input type="date" name="q2End" className="text-xs bg-skin-900 border-skin-700 text-skin-100 focus:border-accent-default focus:ring-accent-default" required />
                    </div>
                  </div>
                </div>
              </div>

              {createMutation.error && (
                <p className="text-sm text-red-200 bg-red-950/50 border border-red-800 p-3 rounded-xl font-medium">
                  {createMutation.error.message}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-5 border-t border-skin-800">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-skin-700 text-skin-200 hover:bg-skin-800 hover:text-skin-100">Cancel</Button>
                <Button type="submit" className="bg-accent-default hover:bg-accent-dark text-white font-semibold shadow-lg shadow-accent-default/20" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Cycle
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {cycles.map((cycle: any) => (
          <div key={cycle.id} className="glass rounded-2xl bg-skin-900/40 border border-skin-800 shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all duration-500 overflow-hidden relative group">
            <div className={`h-1.5 w-full ${cycle.status === 'active' ? 'bg-gradient-to-r from-accent-light to-accent-dark shadow-[0_0_12px_rgba(48,176,208,0.5)]' : 'bg-skin-700'}`} />
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3.5">
                    <h3 className="font-serif-display font-bold text-skin-50 text-xl tracking-tight">{cycle.name}</h3>
                    <Badge className={`px-3 py-1 rounded-lg font-sans-body font-bold text-xs capitalize shadow-sm ${
                      cycle.status === 'active' 
                        ? 'bg-[#5cc8e0]/20 text-[#5cc8e0] border border-[#5cc8e0]/30 animate-pulse' 
                        : 'bg-skin-800 text-skin-400 border border-skin-700'
                    }`}>
                      {cycle.status === 'active' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 inline-block" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 mr-1.5 inline-block" />
                      )}
                      {cycle.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-skin-400 font-medium">Fiscal Year: <span className="text-skin-200 font-bold">{cycle.fiscalYear}</span></p>
                </div>
                <div className="text-right glass p-4 rounded-xl bg-skin-800/20 border border-skin-800/80 min-w-[140px]">
                  <p className="text-3xl font-serif-display font-extrabold text-accent-light tracking-tight">{cycle._count?.goalSheets || 0}</p>
                  <p className="text-xs text-skin-400 uppercase font-bold tracking-wider pt-0.5">Goal Sheets</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 p-5 glass rounded-xl bg-skin-800/30 border border-skin-700 shadow-inner">
                <div className="space-y-1.5">
                  <p className="text-xs text-skin-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-accent-light" /> Goal Setting
                  </p>
                  <p className="text-sm text-skin-50 font-bold">
                    {format(new Date(cycle.goalSettingStart), "MMM d")} - {format(new Date(cycle.goalSettingEnd), "MMM d, yy")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-skin-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent-light" /> Q1 Window
                  </p>
                  <p className="text-sm text-skin-50 font-bold">
                    {format(new Date(cycle.q1Start), "MMM d")} - {format(new Date(cycle.q1End), "MMM d, yy")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-skin-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent-light" /> Q2 Window
                  </p>
                  <p className="text-sm text-skin-50 font-bold">
                    {format(new Date(cycle.q2Start), "MMM d")} - {format(new Date(cycle.q2End), "MMM d, yy")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-skin-400 font-bold uppercase tracking-wider">Status Info</p>
                  <p className="text-sm text-accent-light font-bold capitalize">{cycle.status}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3.5 mt-8 pt-6 border-t border-skin-800">
                {cycle.status !== 'active' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-skin-700 text-skin-200 hover:bg-skin-800 hover:text-accent-light font-medium"
                    onClick={() => updateStatusMutation.mutate({ id: cycle.id, status: 'active' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    Activate Cycle
                  </Button>
                )}
                {cycle.status === 'active' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-skin-700 text-skin-200 hover:bg-skin-800 hover:text-amber-400 font-medium"
                    onClick={() => updateStatusMutation.mutate({ id: cycle.id, status: 'closed' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    Close Cycle
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="bg-red-950/60 border border-red-800 text-red-200 hover:bg-red-900/80 hover:text-white"
                  onClick={() => {
                    if (confirm("Are you sure? This cannot be undone.")) {
                      deleteMutation.mutate(cycle.id);
                    }
                  }}
                  disabled={deleteMutation.isPending || cycle._count?.goalSheets > 0}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
