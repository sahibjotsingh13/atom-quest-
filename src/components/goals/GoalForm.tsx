// src/components/goals/GoalForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(255),
  description: z.string().max(1000).optional(),
  thrustAreaId: z.string().min(1, "Select a thrust area"),
  uomTypeId: z.string().min(1, "Select a UoM type"),
  targetValue: z.string().optional(),
  targetDate: z.string().optional(),
  weightage: z.number().min(10, "Minimum weightage is 10%").max(100),
});

type FormData = z.infer<typeof formSchema>;

interface UomType {
  id: string;
  code: string;
  name: string;
  description: string;
  formulaType: string;
  displayFormat: string;
}

interface ThrustArea {
  id: string;
  name: string;
}

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<FormData, "targetValue"> & { targetValue?: number }) => void;
  uomTypes: UomType[];
  thrustAreas: ThrustArea[];
  remainingWeightage: number;
  editingGoal?: any;
}

export function GoalForm({
  open,
  onClose,
  onSubmit,
  uomTypes,
  thrustAreas,
  remainingWeightage,
  editingGoal,
}: GoalFormProps) {
  const [selectedUom, setSelectedUom] = useState<UomType | null>(null);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: editingGoal
      ? {
          title: editingGoal.title,
          description: editingGoal.description || "",
          thrustAreaId: editingGoal.thrustAreaId,
          uomTypeId: editingGoal.uomTypeId,
          targetValue: editingGoal.targetValue?.toString() || "",
          targetDate: editingGoal.targetDate
            ? new Date(editingGoal.targetDate).toISOString().split("T")[0]
            : "",
          weightage: Number(editingGoal.weightage),
        }
      : {
          title: "",
          description: "",
          thrustAreaId: "",
          uomTypeId: "",
          targetValue: "",
          targetDate: "",
          weightage: Math.min(10, remainingWeightage),
        },
  });

  const uomTypeId = watch("uomTypeId");

  useEffect(() => {
    if (uomTypeId) {
      const uom = uomTypes.find((u) => u.id === uomTypeId);
      setSelectedUom(uom || null);
    }
  }, [uomTypeId, uomTypes]);

  useEffect(() => {
    if (open) {
      if (editingGoal) {
        reset({
          title: editingGoal.title,
          description: editingGoal.description || "",
          thrustAreaId: editingGoal.thrustAreaId,
          uomTypeId: editingGoal.uomTypeId,
          targetValue: editingGoal.targetValue?.toString() || "",
          targetDate: editingGoal.targetDate
            ? new Date(editingGoal.targetDate).toISOString().split("T")[0]
            : "",
          weightage: Number(editingGoal.weightage),
        });
      } else {
        reset({
          title: "",
          description: "",
          thrustAreaId: "",
          uomTypeId: "",
          targetValue: "",
          targetDate: "",
          weightage: Math.min(10, remainingWeightage),
        });
        setSelectedUom(null);
      }
    }
  }, [open, editingGoal, reset, remainingWeightage]);

  const handleFormSubmit = (data: FormData) => {
    setError("");

    // Must have a UoM selected before we can validate the target
    if (!selectedUom) {
      setError("Please select a UoM type");
      return;
    }

    // Validate weightage against remaining
    const currentWeightage = editingGoal ? Number(editingGoal.weightage) : 0;
    if (data.weightage > remainingWeightage + currentWeightage) {
      setError(`Weightage cannot exceed remaining allowed ${(remainingWeightage + currentWeightage).toFixed(1)}%`);
      return;
    }

    // Validate target based on UoM type
    if (selectedUom.code === "timeline") {
      if (!data.targetDate) {
        setError("Target date is required for Timeline UoM");
        return;
      }
    } else {
      if (!data.targetValue || parseFloat(data.targetValue) <= 0) {
        setError("A valid target value is required for this UoM type");
        return;
      }
    }

    onSubmit({
      ...data,
      targetValue: data.targetValue ? parseFloat(data.targetValue) : undefined,
      targetDate: data.targetDate || undefined,
    });
  };

  const isTimeline = selectedUom?.code === "timeline";

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-skin-900 border-skin-700 text-skin-100 shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-skin-50 font-bold text-xl">{editingGoal ? "Edit Goal" : "Add New Goal"}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-200">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-skin-200 font-medium">
              Goal Title <span className="text-accent-light">*</span>
            </Label>
            <Input
              id="title"
              className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:border-accent-default focus:ring-accent-default"
              placeholder="e.g., Increase Q3 Sales Revenue"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-skin-200 font-medium">Description</Label>
            <Textarea
              id="description"
              className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:border-accent-default focus:ring-accent-default"
              placeholder="Describe the goal and expected outcomes..."
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Thrust Area & UoM Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-skin-200 font-medium">
                Thrust Area <span className="text-accent-light">*</span>
              </Label>
              <Select
                value={watch("thrustAreaId")}
                onValueChange={(v: string | null) => setValue("thrustAreaId", v ?? "")}
              >
                <SelectTrigger className="bg-skin-950 border-skin-700 text-skin-100">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-skin-900 border-skin-700 text-skin-100">
                  {thrustAreas.map((ta) => (
                    <SelectItem key={ta.id} value={ta.id} className="focus:bg-skin-800 focus:text-skin-50">
                      {ta.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.thrustAreaId && (
                <p className="text-sm text-red-400">{errors.thrustAreaId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-skin-200 font-medium">
                UoM Type <span className="text-accent-light">*</span>
              </Label>
              <Select
                value={watch("uomTypeId")}
                onValueChange={(v: string | null) => setValue("uomTypeId", v ?? "")}
              >
                <SelectTrigger className="bg-skin-950 border-skin-700 text-skin-100">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-skin-900 border-skin-700 text-skin-100">
                  {uomTypes.map((uom) => (
                    <SelectItem key={uom.id} value={uom.id} className="focus:bg-skin-800 focus:text-skin-50">
                      {uom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.uomTypeId && (
                <p className="text-sm text-red-400">{errors.uomTypeId.message}</p>
              )}
            </div>
          </div>

          {/* Dynamic Target Input */}
          {selectedUom && (
            <div className="space-y-2">
              {isTimeline ? (
                <>
                  <Label className="text-skin-200 font-medium">
                    Target Date <span className="text-accent-light">*</span>
                  </Label>
                  <Input type="date" className="bg-skin-950 border-skin-700 text-skin-100 focus:border-accent-default focus:ring-accent-default" {...register("targetDate")} />
                </>
              ) : (
                <>
                  <Label className="text-skin-200 font-medium">
                    Target Value <span className="text-accent-light">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    className="bg-skin-950 border-skin-700 text-skin-100 placeholder:text-skin-500 focus:border-accent-default focus:ring-accent-default"
                    placeholder={
                      selectedUom.code.includes("percentage")
                        ? "e.g., 85"
                        : "e.g., 1000000"
                    }
                    {...register("targetValue")}
                  />
                  <p className="text-xs text-skin-400">{selectedUom.description}</p>
                </>
              )}
            </div>
          )}

          {/* Weightage */}
          <div className="space-y-2">
            <Label className="text-skin-200 font-medium">
              Weightage (%) <span className="text-accent-light">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={10}
                max={100}
                step="0.1"
                className="bg-skin-950 border-skin-700 text-skin-100 focus:border-accent-default focus:ring-accent-default"
                {...register("weightage", { valueAsNumber: true })}
              />
              <span className="text-sm text-skin-300 whitespace-nowrap font-medium">
                Remaining: {remainingWeightage.toFixed(1)}%
              </span>
            </div>
            {errors.weightage && (
              <p className="text-sm text-red-400">{errors.weightage.message}</p>
            )}
            <p className="text-xs text-skin-400">Minimum 10% per goal</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-skin-700 text-skin-200 hover:bg-skin-800 hover:text-skin-100">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-accent-default hover:bg-accent-dark text-white font-semibold shadow-lg shadow-accent-default/20">
              {isSubmitting ? "Saving..." : editingGoal ? "Update Goal" : "Add Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
