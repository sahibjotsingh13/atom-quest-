// src/app/(dashboard)/admin/shared-goals/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Users, Target, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminSharedGoalsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    thrustAreaId: "",
    uomTypeId: "",
    targetValue: "",
    targetDate: "",
    departmentId: "",
    weightage: "",
  });

  const { data: sharedGoals, isLoading } = useQuery({
    queryKey: ["adminSharedGoals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/shared-goals");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: masterData } = useQuery({
    queryKey: ["masterData"],
    queryFn: async () => {
      const [thrust, uom, depts] = await Promise.all([
        fetch("/api/admin/thrust-areas").then((r) => r.json()),
        fetch("/api/admin/uom-types").then((r) => r.json()),
        fetch("/api/admin/departments").then((r) => r.json()),
      ]);
      return { thrustAreas: thrust, uomTypes: uom, departments: depts };
    },
  });

  const createGoal = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, departmentId: data.departmentId || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSharedGoals"] });
      setOpen(false);
      setForm({ title: "", description: "", thrustAreaId: "", uomTypeId: "", targetValue: "", targetDate: "", departmentId: "", weightage: "" });
    },
  });

  const statusColors: Record<string, string> = {
    not_started: "bg-slate-100 text-slate-600",
    on_track: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    at_risk: "bg-amber-100 text-amber-700",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Shared Goals</h1>
            <p className="text-slate-500">Push departmental KPIs to employees</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Shared Goal
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {(sharedGoals || []).map((goal: any) => (
              <Card key={goal.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                        <Badge variant="outline" className="text-xs">{goal.uomType?.name}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{goal.thrustArea?.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>{goal.childGoals?.length ?? 0} recipients</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(expanded === goal.id ? null : goal.id)}
                      >
                        {expanded === goal.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {expanded === goal.id && goal.childGoals?.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
                      {goal.childGoals.map((child: any) => (
                        <div key={child.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">
                            {child.goalSheet?.employee?.firstName} {child.goalSheet?.employee?.lastName}
                            <span className="text-slate-400 ml-2">· {child.goalSheet?.employee?.employeeId}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${statusColors[child.status] || "bg-slate-100"}`}>
                              {child.status?.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-slate-500">{Number(child.progressScore || 0).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {(!sharedGoals || sharedGoals.length === 0) && (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No shared goals yet</h3>
                <p className="text-slate-500 mb-4">Push departmental KPIs to your team.</p>
                <Button onClick={() => setOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create Shared Goal
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Shared Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Achieve 95% Customer Satisfaction" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Thrust Area *</Label>
                <Select value={form.thrustAreaId} onValueChange={(v) => setForm({ ...form, thrustAreaId: v || "" })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {(masterData?.thrustAreas || []).map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>UoM Type *</Label>
                <Select value={form.uomTypeId} onValueChange={(v) => setForm({ ...form, uomTypeId: v || "" })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {(masterData?.uomTypes || []).map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Value</Label>
                <Input type="number" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} placeholder="e.g. 100" />
              </div>
              <div>
                <Label>Weightage (%) *</Label>
                <Input type="number" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: e.target.value })} placeholder="e.g. 20" />
              </div>
            </div>
            <div>
              <Label>Assign to Department</Label>
              <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v || "" })}>
                <SelectTrigger><SelectValue placeholder="All employees in dept..." /></SelectTrigger>
                <SelectContent>
                  {(masterData?.departments || []).map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createGoal.mutate({ ...form, weightage: Number(form.weightage), targetValue: form.targetValue ? Number(form.targetValue) : null })}
                disabled={createGoal.isPending}
              >
                {createGoal.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Push to Employees
              </Button>
            </div>
            {createGoal.isError && (
              <p className="text-sm text-red-500">{(createGoal.error as any)?.message}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
