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
import { AlertCircle, ChevronDown } from "lucide-react";

// Standard, highly type-safe schema with optional fields and robust preprocessing to avoid any validation failures
const formSchema = z.object({
  title: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : ""),
    z.string().min(1, "Goal title is required").max(150, "Goal title is too long")
  ),
  description: z.string().optional().default(""),
  thrustAreaId: z.string().min(1, "Thrust Area is required"),
  uomTypeId: z.string().min(1, "UoM Type is required"),
  targetValue: z.string().optional().default("100"),
  targetDate: z.string().optional().default(""),
  weightage: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number({ message: "Weightage must be a number" })
      .min(1, "Weightage must be at least 1%")
      .max(100, "Weightage cannot exceed 100%")
  ).optional().default(10),
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
  onSubmit: (data: {
    title: string;
    description: string;
    thrustAreaId: string;
    uomTypeId: string;
    weightage: number;
    targetValue?: number;
    targetDate?: string;
  }) => void;
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
  } = useForm<any>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "Strategic Goal",
      description: "",
      thrustAreaId: "",
      uomTypeId: "",
      targetValue: "100",
      targetDate: "",
      weightage: 10,
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
      setError("");
      if (editingGoal) {
        reset({
          title: editingGoal.title || "Strategic Goal",
          description: editingGoal.description || "",
          thrustAreaId: editingGoal.thrustAreaId || (thrustAreas[0]?.id || ""),
          uomTypeId: editingGoal.uomTypeId || (uomTypes[0]?.id || ""),
          targetValue: editingGoal.targetValue?.toString() || "100",
          targetDate: editingGoal.targetDate
            ? new Date(editingGoal.targetDate).toISOString().split("T")[0]
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          weightage: Number(editingGoal.weightage) || 10,
        });
      } else {
        const defaultThrust = thrustAreas[0]?.id || "";
        const defaultUom = uomTypes[0]?.id || "";
        const defaultWeightage = Math.min(10, remainingWeightage > 0 ? remainingWeightage : 10);

        reset({
          title: "Strategic Goal",
          description: "",
          thrustAreaId: defaultThrust,
          uomTypeId: defaultUom,
          targetValue: "100",
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          weightage: defaultWeightage,
        });

        const activeUom = uomTypes.find(u => u.id === defaultUom);
        setSelectedUom(activeUom || null);
      }
    }
  }, [open, editingGoal, reset, remainingWeightage, thrustAreas, uomTypes]);

  const handleFormSubmit = (data: any) => {
    setError("");

    const finalThrustAreaId = data.thrustAreaId || thrustAreas[0]?.id || "";
    const finalUomTypeId = data.uomTypeId || uomTypes[0]?.id || "";
    const finalTitle = data.title ? data.title.trim() : "Strategic Goal";

    const uom = uomTypes.find((u) => u.id === finalUomTypeId) || uomTypes[0];
    if (!uom) {
      setError("Please ensure UoM types are configured in the system.");
      return;
    }

    const currentWeightage = editingGoal ? Number(editingGoal.weightage) : 0;
    const maxAllowed = remainingWeightage + currentWeightage;
    let finalWeightage = Number(data.weightage) || 10;

    if (finalWeightage > maxAllowed) {
      finalWeightage = maxAllowed;
    }

    let finalTargetDate = data.targetDate || undefined;
    let finalTargetValue = undefined;

    if (uom.code === "timeline") {
      if (!finalTargetDate) {
        finalTargetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      }
    } else {
      const parsedVal = parseFloat(data.targetValue || "100");
      finalTargetValue = isNaN(parsedVal) ? 100 : parsedVal;
    }

    onSubmit({
      title: finalTitle,
      description: data.description || "",
      thrustAreaId: finalThrustAreaId,
      uomTypeId: finalUomTypeId,
      weightage: finalWeightage,
      targetValue: finalTargetValue,
      targetDate: finalTargetDate,
    });
  };

  const isTimeline = selectedUom?.code === "timeline";

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0a1118]/95 border border-white/10 text-[#ede8e4] shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-white font-bold text-xl">{editingGoal ? "Edit Goal" : "Add New Goal"}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="bg-red-950/30 border border-red-800/50 text-red-200">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white/80 font-medium">
              Goal Title <span className="text-[#ff7043]">*</span>
            </Label>
            <Input
              id="title"
              className="bg-[#050a0f] border-white/10 text-white placeholder:text-white/30 focus:border-[#ff7043]/50 focus:ring-[#ff7043]/50"
              placeholder="e.g., Increase Q3 Sales Revenue"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-red-400">{String(errors.title.message)}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white/80 font-medium">Description</Label>
            <Textarea
              id="description"
              className="bg-[#050a0f] border-white/10 text-white placeholder:text-white/30 focus:border-[#ff7043]/50 focus:ring-[#ff7043]/50"
              placeholder="Describe the goal and expected outcomes..."
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Thrust Area & UoM Type Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80 font-medium">
                Thrust Area <span className="text-[#ff7043]">*</span>
              </Label>
              <div className="relative">
                <select
                  id="thrustAreaId"
                  className="w-full h-10 pl-3 pr-10 rounded-md bg-[#050a0f] border border-white/10 text-white focus:border-[#ff7043]/50 focus:ring-[#ff7043]/50 outline-none appearance-none cursor-pointer text-sm"
                  {...register("thrustAreaId")}
                >
                  <option value="">Select...</option>
                  {thrustAreas.map((ta) => (
                    <option key={ta.id} value={ta.id}>
                      {ta.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-white/50">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80 font-medium">
                UoM Type <span className="text-[#ff7043]">*</span>
              </Label>
              <div className="relative">
                <select
                  id="uomTypeId"
                  className="w-full h-10 pl-3 pr-10 rounded-md bg-[#050a0f] border border-white/10 text-white focus:border-[#ff7043]/50 focus:ring-[#ff7043]/50 outline-none appearance-none cursor-pointer text-sm"
                  {...register("uomTypeId")}
                >
                  <option value="">Select...</option>
                  {uomTypes.map((uom) => (
                    <option key={uom.id} value={uom.id}>
                      {uom.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-white/50">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Target Input */}
          {selectedUom && (
            <div className="space-y-2">
              {isTimeline ? (
                <>
                  <Label className="text-white/80 font-medium">
                    Target Date <span className="text-[#ff7043]">*</span>
                  </Label>
                  <Input type="date" className="bg-[#050a0f] border-white/10 text-white focus:border-[#ff7043]/50 focus:ring-[#ff7043]/50" {...register("targetDate")} />
                </>
              ) : (
                <>
                  <Label className="text-white/80 font-medium">
                    Target Value <span className="text-[#ff7043]">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    className="bg-[#050a0f] border-white/10 text-white placeholder:text-white/30 focus:border-[#ff7043]/50 focus:ring-[#ff7043]/50"
                    placeholder={
                      selectedUom.code.includes("percentage")
                        ? "e.g., 85"
                        : "e.g., 100"
                    }
                    {...register("targetValue")}
                  />
                  <p className="text-xs text-white/40">{selectedUom.description}</p>
                </>
              )}
            </div>
          )}

          {/* Weightage */}
          <div className="space-y-2">
            <Label className="text-white/80 font-medium">
              Weightage (%) <span className="text-[#ff7043]">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={100}
                step="1"
                className="bg-[#050a0f] border-white/10 text-white focus:border-[#ff7043]/50 focus:ring-[#ff7043]/50"
                {...register("weightage")}
              />
              <span className="text-sm text-white/60 whitespace-nowrap font-medium">
                Remaining: {remainingWeightage.toFixed(1)}%
              </span>
            </div>
            {errors.weightage && (
              <p className="text-sm text-red-400">{String(errors.weightage.message)}</p>
            )}
            <p className="text-xs text-white/40">Minimum 1% per goal</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-white/10 text-white/75 hover:bg-white/5 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#ff7043] hover:bg-[#d84315] text-white font-semibold shadow-lg shadow-[#ff7043]/20">
              {isSubmitting ? "Saving..." : editingGoal ? "Update Goal" : "Add Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
