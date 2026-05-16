// src/lib/checkin-window.ts
import { prisma } from "./prisma";

export interface WindowStatus {
  quarter: string;
  isOpen: boolean;
  startDate: Date;
  endDate: Date;
  label: string;
}

/**
 * Client-safe function to calculate the current quarter status from a cycle object.
 * Handles both Date objects and ISO strings.
 */
export function getQuarterStatus(cycle: any): WindowStatus | null {
  if (!cycle) return null;

  const now = new Date();
  
  // Ensure we have Date objects
  const q1Start = new Date(cycle.q1Start);
  const q1End = new Date(cycle.q1End);
  const q2Start = new Date(cycle.q2Start);
  const q2End = new Date(cycle.q2End);
  const q3Start = new Date(cycle.q3Start);
  const q3End = new Date(cycle.q3End);
  const q4Start = new Date(cycle.q4Start);
  const q4End = new Date(cycle.q4End);

  const quarters = [
    { name: "Q1", start: q1Start, end: q1End, label: "Q1 (July)" },
    { name: "Q2", start: q2Start, end: q2End, label: "Q2 (October)" },
    { name: "Q3", start: q3Start, end: q3End, label: "Q3 (January)" },
    { name: "Q4", start: q4Start, end: q4End, label: "Q4 (March/April)" },
  ];

  for (const q of quarters) {
    if (now >= q.start && now <= q.end) {
      return {
        quarter: q.name,
        isOpen: true,
        startDate: q.start,
        endDate: q.end,
        label: q.label,
      };
    }
  }

  // Check if we're in any quarter period but window closed
  for (const q of quarters) {
    // Basic heuristic: if current month is within +- 1 month of the target month
    // but not in the specific start/end range
    const month = now.getMonth();
    const startMonth = q.start.getMonth();
    
    if (Math.abs(month - startMonth) <= 1) {
       return {
        quarter: q.name,
        isOpen: false,
        startDate: q.start,
        endDate: q.end,
        label: q.label,
      };
    }
  }

  return null;
}

/**
 * Server-side function to fetch a cycle and get its quarter status.
 * @deprecated Use getQuarterStatus(cycle) on the client if you already have the cycle data.
 */
export async function getCurrentQuarter(cycleId: string): Promise<WindowStatus | null> {
  // This function still uses prisma, so it should only be called on the server or via Server Actions
  const cycle = await prisma.cycle.findUnique({
    where: { id: cycleId },
  });

  return getQuarterStatus(cycle);
}

export function isCheckInWindowOpen(cycle: any, quarter: string): boolean {
  const now = new Date();
  
  // Ensure we have Date objects
  const q1Start = new Date(cycle.q1Start);
  const q1End = new Date(cycle.q1End);
  const q2Start = new Date(cycle.q2Start);
  const q2End = new Date(cycle.q2End);
  const q3Start = new Date(cycle.q3Start);
  const q3End = new Date(cycle.q3End);
  const q4Start = new Date(cycle.q4Start);
  const q4End = new Date(cycle.q4End);

  switch (quarter) {
    case "Q1":
      return now >= q1Start && now <= q1End;
    case "Q2":
      return now >= q2Start && now <= q2End;
    case "Q3":
      return now >= q3Start && now <= q3End;
    case "Q4":
      return now >= q4Start && now <= q4End;
    default:
      return false;
  }
}

export function getQuarterLabel(quarter: string): string {
  switch (quarter) {
    case "Q1": return "Q1 Check-in (July)";
    case "Q2": return "Q2 Check-in (October)";
    case "Q3": return "Q3 Check-in (January)";
    case "Q4": return "Q4 / Annual (March/April)";
    default: return quarter;
  }
}
