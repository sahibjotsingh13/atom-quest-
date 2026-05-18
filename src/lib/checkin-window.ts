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

  let openQuarter = null;
  for (const q of quarters) {
    if (now >= q.start && now <= q.end) {
      openQuarter = {
        quarter: q.name,
        isOpen: true,
        startDate: q.start,
        endDate: q.end,
        label: q.label,
      };
      break;
    }
  }

  if (openQuarter) return openQuarter;

  // Fallback for UAT/Demo purposes: find the first quarter that hasn't ended yet
  // or default to Q4 if all have ended, and force isOpen: true!
  let fallbackQuarter = quarters[3]; // Default to Q4
  for (const q of quarters) {
    if (now <= q.end) {
      fallbackQuarter = q;
      break;
    }
  }

  return {
    quarter: fallbackQuarter.name,
    isOpen: true,
    startDate: fallbackQuarter.start,
    endDate: fallbackQuarter.end,
    label: `${fallbackQuarter.label} (Demo Mode)`,
  };
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
  return true; // Force true for UAT/Demo so check-ins are always enabled
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
