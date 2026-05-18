// src/lib/validation.ts
import { z } from "zod";

// Goal creation schema
export const goalSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(255, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  thrustAreaId: z.string().uuid("Please select a thrust area"),
  uomTypeId: z.string().uuid("Please select a UoM type"),
  targetValue: z.number().positive("Target must be positive").optional(),
  targetDate: z.string().optional(),
  weightage: z.number()
    .min(1, "Minimum weightage is 1%")
    .max(100, "Maximum weightage is 100%"),
}).refine((data) => {
  // Timeline UoM requires targetDate, others require targetValue
  const isTimeline = data.uomTypeId === "timeline"; // We'll check this properly in the form
  if (isTimeline) {
    return !!data.targetDate;
  }
  return !!data.targetValue && data.targetValue > 0;
}, {
  message: "Target value or date is required based on UoM type",
  path: ["targetValue"],
});

export type GoalFormData = z.infer<typeof goalSchema>;

// Validation rules for goal sheets
export const GOAL_RULES = {
  MAX_GOALS: 8,
  MIN_WEIGHTAGE: 1,
  MAX_WEIGHTAGE: 100,
  TOTAL_WEIGHTAGE: 100,
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGoalSheet(goals: Array<{ weightage: number }>): ValidationResult {
  const errors: string[] = [];
  
  // Rule 1: Maximum 8 goals
  if (goals.length > GOAL_RULES.MAX_GOALS) {
    errors.push(`Maximum ${GOAL_RULES.MAX_GOALS} goals allowed. Current: ${goals.length}`);
  }
  
  // Rule 2: Total weightage must equal 100%
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (Math.abs(totalWeightage - GOAL_RULES.TOTAL_WEIGHTAGE) > 0.01) {
    errors.push(`Total weightage must equal ${GOAL_RULES.TOTAL_WEIGHTAGE}%. Current: ${totalWeightage.toFixed(1)}%`);
  }
  
  // Rule 3: Minimum 10% per goal
  const underweightGoals = goals.filter(g => g.weightage < GOAL_RULES.MIN_WEIGHTAGE);
  if (underweightGoals.length > 0) {
    errors.push(`${underweightGoals.length} goal(s) have weightage below ${GOAL_RULES.MIN_WEIGHTAGE}%`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function calculateRemainingWeightage(goals: Array<{ weightage: number }>): number {
  const used = goals.reduce((sum, g) => sum + g.weightage, 0);
  return Math.max(0, GOAL_RULES.TOTAL_WEIGHTAGE - used);
}

export function calculateProgressScore(
  uomCode: string,
  target: number,
  actual: number,
  targetDate?: Date,
  actualDate?: Date
): number {
  switch (uomCode) {
    case "numeric_min":
    case "percentage_min":
      return Math.min((actual / target) * 100, 100);
    
    case "numeric_max":
    case "percentage_max":
      return Math.min((target / actual) * 100, 100);
    
    case "timeline":
      if (!targetDate || !actualDate) return 0;
      if (actualDate <= targetDate) return 100;
      const daysLate = Math.ceil((actualDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, 100 - daysLate * 2);
    
    case "zero":
      return actual === 0 ? 100 : 0;
    
    default:
      return 0;
  }
}