// src/components/admin/SharedGoalPush.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Share2,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building2,
} from "lucide-react";

export function SharedGoalPush() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thrustAreaId: "",
    uomTypeId: "",
    targetValue: "",
    targetDate: "",
    weightage: "",
    departmentId: "",
  });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [useDepartment, setUseDepartment] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: uomTypes = [] } = useQuery({
    queryKey: ["uomTypes"],
    queryFn: async () => {
      const res = await fetch("/api/uom-types");
      return res.json();
    },
  });

  const { data: thrustAreas = [] } = useQuery({
    queryKey: ["thrustAreas"],
    queryFn: async () => {
      const res = await fetch("/api/thrust-areas");
      return res.json();
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      return res.json();
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/users?role=employee");
      return res.json();
    },
  });

  const pushGoal = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to push shared goal");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSuccess(`Shared goal pushed to ${data.recipients} employees successfully!`);
      setFormData({
        title: "",
        description: "",
        thrustAreaId: "",
        uomTypeId: "",
        targetValue: "",
        targetDate: "",
        weightage: "",
        departmentId: "",
      });
      setSelectedEmployees([]);
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.thrustAreaId || !formData.uomTypeId || !formData.weightage) {
      setError("Please fill all required fields");
      return;
    }

    const weightage = parseFloat(formData.weightage);
    if (weightage < 10 || weightage > 100) {
      setError("Weightage must be between 10% and 100%");
      return;
    }

    if (!useDepartment && selectedEmployees.length === 0) {
      setError("Please select at least one employee");
      return;
    }

    pushGoal.mutate({
      ...formData,
      targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
      weightage,
      employeeIds: useDepartment ? undefined : selectedEmployees,
      departmentId: useDepartment ? formData.departmentId || undefined : undefined,
    });
  };

  const selectedUom = uomTypes.find((u: any) => u.id === formData.uomTypeId);
  const isTimeline = selectedUom?.code === "timeline";

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8 bg-skin-900/60 border border-skin-800 shadow-lg relative overflow-hidden font-sans-body">
      <div className="absolute -right-20 -top-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="flex items-center gap-3.5 pb-6 border-b border-skin-800 mb-6">
        <div className="p-3.5 bg-accent/10 rounded-xl border border-accent/20 shadow-inner">
          <Share2 className="w-6 h-6 text-accent-light" />
        </div>
        <h2 className="text-2xl font-serif-display font-bold text-skin-50 bg-gradient-to-r from-skin-50 to-accent-light bg-clip-text text-transparent tracking-tight">
          Push Shared Goal (Departmental KPI)
        </h2>
      </div>

      <div className="space-y-6 max-w-4xl">
        {error && (
          <Alert variant="destructive" className="bg-red-950/50 border border-red-800 text-red-200 font-sans-body shadow-inner">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-950/40 border border-green-800/80 text-emerald-300 font-sans-body shadow-inner">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="font-bold tracking-wide">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 font-sans-body">
          {/* Goal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-skin-200 font-medium">
                Goal Title <span className="text-accent-light">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Reduce Customer Churn Rate"
                className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:ring-accent-default focus:border-accent-default shadow-sm py-5 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-skin-200 font-medium">
                Thrust Area <span className="text-accent-light">*</span>
              </Label>
              <Select
                value={formData.thrustAreaId}
                onValueChange={(v) => setFormData({ ...formData, thrustAreaId: v || "" })}
              >
                <SelectTrigger className="bg-skin-950 border-skin-700 text-skin-100 focus:ring-accent-default focus:border-accent-default shadow-sm py-5 text-base">
                  <SelectValue placeholder="Select Thrust Area..." />
                </SelectTrigger>
                <SelectContent className="bg-skin-900 border-skin-700 text-skin-100 shadow-xl shadow-black/40">
                  {thrustAreas.map((ta: any) => (
                    <SelectItem key={ta.id} value={ta.id} className="focus:bg-skin-800 focus:text-skin-50 py-2.5">
                      {ta.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-skin-200 font-medium">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the departmental KPI, objectives, and success criteria in detail..."
              rows={3}
              className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:ring-accent-default focus:border-accent-default shadow-sm text-base"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-skin-200 font-medium">
                UoM Type <span className="text-accent-light">*</span>
              </Label>
              <Select
                value={formData.uomTypeId}
                onValueChange={(v) => setFormData({ ...formData, uomTypeId: v || "" })}
              >
                <SelectTrigger className="bg-skin-950 border-skin-700 text-skin-100 focus:ring-accent-default focus:border-accent-default shadow-sm py-5 text-base">
                  <SelectValue placeholder="Select UoM Type..." />
                </SelectTrigger>
                <SelectContent className="bg-skin-900 border-skin-700 text-skin-100 shadow-xl shadow-black/40">
                  {uomTypes.map((u: any) => (
                    <SelectItem key={u.id} value={u.id} className="focus:bg-skin-800 focus:text-skin-50 py-2.5">
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-skin-200 font-medium">
                Weightage (%) <span className="text-accent-light">*</span>
              </Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={formData.weightage}
                onChange={(e) => setFormData({ ...formData, weightage: e.target.value })}
                placeholder="e.g., 20"
                className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:ring-accent-default focus:border-accent-default shadow-sm py-5 text-base"
              />
            </div>
          </div>

          {/* Target — numeric or date depending on UoM */}
          <div className="space-y-2 max-w-md">
            {isTimeline ? (
              <>
                <Label className="text-skin-200 font-medium">Target Date</Label>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="bg-skin-950 border-skin-700 text-skin-100 focus:ring-accent-default focus:border-accent-default shadow-sm py-5 text-base"
                />
              </>
            ) : (
              <>
                <Label className="text-skin-200 font-medium">Target Value</Label>
                <Input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  placeholder="e.g., 95"
                  className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:ring-accent-default focus:border-accent-default shadow-sm py-5 text-base"
                />
              </>
            )}
          </div>

          {/* Target Audience Toggle */}
          <div className="glass p-6 rounded-2xl bg-skin-800/30 border border-skin-700 space-y-6 shadow-inner">
            <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-skin-700/60">
              <button
                type="button"
                onClick={() => setUseDepartment(true)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  useDepartment
                    ? "bg-accent-default text-white shadow-lg shadow-accent-default/20 ring-2 ring-accent/30"
                    : "bg-skin-900 text-skin-400 hover:bg-skin-800 hover:text-skin-100 border border-skin-700"
                }`}
              >
                <Building2 className="w-4 h-4" />
                By Department
              </button>
              <button
                type="button"
                onClick={() => setUseDepartment(false)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  !useDepartment
                    ? "bg-accent-default text-white shadow-lg shadow-accent-default/20 ring-2 ring-accent/30"
                    : "bg-skin-900 text-skin-400 hover:bg-skin-800 hover:text-skin-100 border border-skin-700"
                }`}
              >
                <Users className="w-4 h-4" />
                Specific Employees
              </button>
            </div>

            {useDepartment ? (
              <div className="space-y-2 max-w-md">
                <Label className="text-skin-200 font-medium">Select Target Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) => setFormData({ ...formData, departmentId: v || "" })}
                >
                  <SelectTrigger className="bg-skin-950 border-skin-700 text-skin-100 focus:ring-accent-default focus:border-accent-default shadow-sm py-5 text-base">
                    <SelectValue placeholder="All departments (Organization-wide)..." />
                  </SelectTrigger>
                  <SelectContent className="bg-skin-900 border-skin-700 text-skin-100 shadow-xl shadow-black/40">
                    <SelectItem value="" className="focus:bg-skin-800 focus:text-skin-50 py-2.5 font-bold text-accent-light">
                      🏢 All Departments (Org-wide KPI)
                    </SelectItem>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={d.id} className="focus:bg-skin-800 focus:text-skin-50 py-2.5 font-semibold">
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-skin-200 font-medium">Select Specific Employees</Label>
                  {selectedEmployees.length > 0 && (
                    <Badge className="bg-[#5cc8e0]/20 text-[#5cc8e0] border border-[#5cc8e0]/30 px-3 py-1 rounded-lg font-bold text-xs">
                      {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                    </Badge>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-skin-700 rounded-xl p-3 bg-skin-950/60 shadow-inner">
                  {employees.map((emp: any) => (
                    <div
                      key={emp.id}
                      className="flex items-center gap-4 p-3 hover:bg-skin-800/40 rounded-xl cursor-pointer border border-transparent hover:border-skin-700 transition-all duration-300"
                      onClick={() => toggleEmployee(emp.id)}
                    >
                      <Checkbox
                        checked={selectedEmployees.includes(emp.id)}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                        className="border-skin-600 data-[state=checked]:bg-accent-default data-[state=checked]:border-accent-default"
                      />
                      <div>
                        <p className="text-base font-bold text-skin-50">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs font-semibold text-skin-400 pt-0.5">
                          ID: {emp.employeeId} <span className="mx-1 text-skin-600">•</span> {emp.department?.name || "No Dept"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <p className="text-sm text-skin-500 text-center py-8 font-medium">No active employees found in the master database</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Weightage Progress Preview */}
          {formData.weightage && (
            <div className="space-y-2 glass p-4 rounded-xl bg-skin-800/20 border border-skin-800/80 max-w-md shadow-inner">
              <div className="flex justify-between text-xs font-bold text-skin-300">
                <span>Goal Weightage Allocation</span>
                <span className="text-accent-light">{formData.weightage}%</span>
              </div>
              <div className="relative w-full bg-skin-800 rounded-full h-2 overflow-hidden p-0.5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-accent-light to-accent-dark rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(48,176,208,0.5)]"
                  style={{ width: `${Math.min(100, parseFloat(formData.weightage) || 0)}%` }}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-accent-default hover:bg-accent-dark text-white font-bold shadow-xl shadow-accent-default/20 rounded-xl py-6 text-base tracking-wide" disabled={pushGoal.isPending}>
            {pushGoal.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2.5 animate-spin" />
                Pushing Shared KPI Across Portal...
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5 mr-2.5" />
                Push KPI to{" "}
                {useDepartment
                  ? formData.departmentId
                    ? departments.find((d: any) => d.id === formData.departmentId)?.name || "Department"
                    : "All Company Departments"
                  : `${selectedEmployees.length} Selected Employee${selectedEmployees.length !== 1 ? "s" : ""}`}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
