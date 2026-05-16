// src/app/(dashboard)/admin/cycles/page.tsx
"use client";
// Admin Cycles Management Page

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Loader2, Plus, CalendarDays, CheckCircle2, History } from "lucide-react";
import { format } from "date-fns";

export default function AdminCyclesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    fiscalYear: "",
    goalSettingStart: "",
    goalSettingEnd: "",
    q1Start: "",
    q1End: "",
    q2Start: "",
    q2End: "",
    q3Start: "",
    q3End: "",
    q4Start: "",
    q4End: "",
  });

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["adminCycles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cycles");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createCycle = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create cycle");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCycles"] });
      setIsOpen(false);
      setFormData({
        name: "",
        fiscalYear: "",
        goalSettingStart: "",
        goalSettingEnd: "",
        q1Start: "",
        q1End: "",
        q2Start: "",
        q2End: "",
        q3Start: "",
        q3End: "",
        q4Start: "",
        q4End: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCycle.mutate(formData);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Performance Cycles</h1>
            <p className="text-slate-500">Configure fiscal years and quarterly check-in windows</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Performance Cycle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cycle Name</Label>
                    <Input
                      placeholder="e.g., FY 2025-26"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fiscal Year</Label>
                    <Input
                      placeholder="e.g., 2025"
                      value={formData.fiscalYear}
                      onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-1 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-500" />
                    Goal Setting Window
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formData.goalSettingStart}
                        onChange={(e) => setFormData({ ...formData, goalSettingStart: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={formData.goalSettingEnd}
                        onChange={(e) => setFormData({ ...formData, goalSettingEnd: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quarter 1</h3>
                    <div className="space-y-2">
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={formData.q1Start}
                        onChange={(e) => setFormData({ ...formData, q1Start: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={formData.q1End}
                        onChange={(e) => setFormData({ ...formData, q1End: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quarter 2</h3>
                    <div className="space-y-2">
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={formData.q2Start}
                        onChange={(e) => setFormData({ ...formData, q2Start: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={formData.q2End}
                        onChange={(e) => setFormData({ ...formData, q2End: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quarter 3</h3>
                    <div className="space-y-2">
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={formData.q3Start}
                        onChange={(e) => setFormData({ ...formData, q3Start: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={formData.q3End}
                        onChange={(e) => setFormData({ ...formData, q3End: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quarter 4</h3>
                    <div className="space-y-2">
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={formData.q4Start}
                        onChange={(e) => setFormData({ ...formData, q4Start: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={formData.q4End}
                        onChange={(e) => setFormData({ ...formData, q4End: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCycle.isPending}>
                    {createCycle.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create & Activate Cycle
                  </Button>
                </div>
                {createCycle.isError && (
                  <p className="text-sm text-red-500 text-center">{(createCycle.error as any)?.message}</p>
                )}
              </form>
            </DialogContent>
          </Dialog>
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
                    <TableHead>Cycle Name</TableHead>
                    <TableHead>Goal Setting</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map((cycle: any) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">
                        {cycle.name}
                        <p className="text-xs text-slate-500 font-normal">FY {cycle.fiscalYear}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs">
                          {format(new Date(cycle.goalSettingStart), "MMM d, yyyy")} - {format(new Date(cycle.goalSettingEnd), "MMM d, yyyy")}
                        </p>
                      </TableCell>
                      <TableCell>
                        {cycle.status === "active" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center w-fit gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 flex items-center w-fit gap-1">
                            <History className="w-3 h-3" />
                            Closed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {format(new Date(cycle.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
