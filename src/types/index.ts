// src/types/index.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "employee" | "manager" | "admin";
  employeeId: string;
  departmentId?: string;
  managerId?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  thrustAreaId: string;
  thrustArea?: { name: string };
  uomTypeId: string;
  uomType?: { code: string; name: string; formulaType: string };
  targetValue?: number;
  targetDate?: Date;
  weightage: number;
  status: string;
  actualValue?: number;
  actualDate?: Date;
  progressScore?: number;
  achievementPercentage?: number;
  isShared: boolean;
  parentGoalId?: string;
  q1Actual?: number;
  q1Status?: string;
  q1Comment?: string;
  q2Actual?: number;
  q2Status?: string;
  q2Comment?: string;
  q3Actual?: number;
  q3Status?: string;
  q3Comment?: string;
  q4Actual?: number;
  q4Status?: string;
  q4Comment?: string;
}

export interface GoalSheet {
  id: string;
  employeeId: string;
  cycleId: string;
  status: string;
  totalWeightage: number;
  goals: Goal[];
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  lockedAt?: Date;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  sheetStatus?: string;
  goalCount: number;
  avgProgress: number;
}