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
      const res = await fetch("/api/master/uom-types");
      return res.json();
    },
  });

  const { data: thrustAreas = [] } = useQuery({
    queryKey: ["thrustAreas"],
    queryFn: async () => {
      const res = await fetch("/api/master/thrust-areas");
      return res.json();
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/master/departments");
      return res.json();
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/master/employees");
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Push Shared Goal (Departmental KPI)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Goal Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Reduce Customer Churn Rate"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Thrust Area <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.thrustAreaId}
                onValueChange={(v) => setFormData({ ...formData, thrustAreaId: v || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {thrustAreas.map((ta: any) => (
                    <SelectItem key={ta.id} value={ta.id}>
                      {ta.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the departmental KPI..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                UoM Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.uomTypeId}
                onValueChange={(v) => setFormData({ ...formData, uomTypeId: v || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {uomTypes.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Weightage (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={formData.weightage}
                onChange={(e) => setFormData({ ...formData, weightage: e.target.value })}
                placeholder="e.g., 20"
              />
            </div>
          </div>

          {/* Target — numeric or date depending on UoM */}
          <div className="space-y-2">
            {isTimeline ? (
              <>
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </>
            ) : (
              <>
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  placeholder="e.g., 95"
                />
              </>
            )}
          </div>

          {/* Target Audience Toggle */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setUseDepartment(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useDepartment
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Building2 className="w-4 h-4" />
                By Department
              </button>
              <button
                type="button"
                onClick={() => setUseDepartment(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !useDepartment
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Users className="w-4 h-4" />
                Specific Employees
              </button>
            </div>

            {useDepartment ? (
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) => setFormData({ ...formData, departmentId: v || "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Employees</Label>
                  {selectedEmployees.length > 0 && (
                    <Badge className="bg-primary/10 text-primary">
                      {selectedEmployees.length} selected
                    </Badge>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2">
                  {employees.map((emp: any) => (
                    <div
                      key={emp.id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                      onClick={() => toggleEmployee(emp.id)}
                    >
                      <Checkbox
                        checked={selectedEmployees.includes(emp.id)}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {emp.employeeId} · {emp.department?.name || "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No employees found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Weightage Progress Preview */}
          {formData.weightage && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Goal Weightage</span>
                <span>{formData.weightage}%</span>
              </div>
              <Progress value={parseFloat(formData.weightage) || 0} className="h-1.5" />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={pushGoal.isPending}>
            {pushGoal.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Pushing Goal...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Push to{" "}
                {useDepartment
                  ? formData.departmentId
                    ? departments.find((d: any) => d.id === formData.departmentId)?.name || "Department"
                    : "All Departments"
                  : `${selectedEmployees.length} Employee${selectedEmployees.length !== 1 ? "s" : ""}`}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
