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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Appraisal Cycles</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> New Cycle
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Appraisal Cycle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Cycle Name</Label>
                  <Input id="name" name="name" placeholder="e.g. FY 2024-25" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscalYear">Fiscal Year</Label>
                  <Input id="fiscalYear" name="fiscalYear" placeholder="e.g. 2024-25" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Goal Setting Start</Label>
                  <Input type="date" name="goalSettingStart" required />
                </div>
                <div className="space-y-2">
                  <Label>Goal Setting End</Label>
                  <Input type="date" name="goalSettingEnd" required />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Quarterly Windows</p>
                <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-[10px]">Q1 Start/End</Label>
                    <div className="flex gap-2">
                      <Input type="date" name="q1Start" className="text-xs" required />
                      <Input type="date" name="q1End" className="text-xs" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px]">Q2 Start/End</Label>
                    <div className="flex gap-2">
                      <Input type="date" name="q2Start" className="text-xs" required />
                      <Input type="date" name="q2End" className="text-xs" required />
                    </div>
                  </div>
                </div>
              </div>

              {createMutation.error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {createMutation.error.message}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Cycle
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {cycles.map((cycle: any) => (
          <Card key={cycle.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`h-1 w-full ${cycle.status === 'active' ? 'bg-primary' : 'bg-slate-300'}`} />
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 text-lg">{cycle.name}</h3>
                    <Badge variant={cycle.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                      {cycle.status === 'active' ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {cycle.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Fiscal Year: {cycle.fiscalYear}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{cycle._count?.goalSheets || 0}</p>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Goal Sheets</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 p-4 bg-slate-50 rounded-xl">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Goal Setting</p>
                  <p className="text-sm text-slate-700 font-medium">
                    {format(new Date(cycle.goalSettingStart), "MMM d")} - {format(new Date(cycle.goalSettingEnd), "MMM d, yy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Q1 Window</p>
                  <p className="text-sm text-slate-700 font-medium">
                    {format(new Date(cycle.q1Start), "MMM d")} - {format(new Date(cycle.q1End), "MMM d, yy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Q2 Window</p>
                  <p className="text-sm text-slate-700 font-medium">
                    {format(new Date(cycle.q2Start), "MMM d")} - {format(new Date(cycle.q2End), "MMM d, yy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Status Info</p>
                  <p className="text-sm text-slate-700 font-medium capitalize">{cycle.status}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                {cycle.status !== 'active' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: cycle.id, status: 'active' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    Activate
                  </Button>
                )}
                {cycle.status === 'active' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: cycle.id, status: 'closed' })}
                    disabled={updateStatusMutation.isPending}
                  >
                    Close Cycle
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure? This cannot be undone.")) {
                      deleteMutation.mutate(cycle.id);
                    }
                  }}
                  disabled={deleteMutation.isPending || cycle._count?.goalSheets > 0}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
