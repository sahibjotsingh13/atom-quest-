import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Quarter, CheckInStatus } from "@prisma/client";
import { calculateProgressScore } from "@/lib/calculate-progress";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("goalId");

  const where: any = {};
  if (goalId) where.goalId = goalId;

  const checkIns = await prisma.checkIn.findMany({
    where,
    include: {
      goal: {
        include: {
          goalSheet: { include: { employee: { select: { firstName: true, lastName: true } } } },
        },
      },
      manager: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(checkIns);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { goalId, quarter, plannedTarget, actualAchievement, actualDate, status, employeeComment } = body;

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: { include: { employee: true } }, uomType: true },
  });
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const isOwner = goal.goalSheet.employeeId === session.user.id;
  const isManager = goal.goalSheet.employee.managerId === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isOwner && !isManager && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cycle = await prisma.cycle.findUnique({ where: { id: goal.goalSheet.cycleId } });
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });

  // Validate check-in window
  const now = new Date();
  let quarterStart: Date, quarterEnd: Date;
  switch (quarter) {
    case "Q1": quarterStart = cycle.q1Start; quarterEnd = cycle.q1End; break;
    case "Q2": quarterStart = cycle.q2Start; quarterEnd = cycle.q2End; break;
    case "Q3": quarterStart = cycle.q3Start; quarterEnd = cycle.q3End; break;
    case "Q4": quarterStart = cycle.q4Start; quarterEnd = cycle.q4End; break;
    default: return NextResponse.json({ error: "Invalid quarter" }, { status: 400 });
  }

  if (now < quarterStart || now > quarterEnd) {
    return NextResponse.json({ error: `Check-in window for ${quarter} is closed` }, { status: 400 });
  }

  // Upsert check-in (one per goal per quarter)
  const checkIn = await prisma.checkIn.upsert({
    where: { goalId_quarter: { goalId, quarter: quarter as Quarter } },
    update: {
      plannedTarget: plannedTarget ? String(plannedTarget) : null,
      actualAchievement: actualAchievement ? String(actualAchievement) : null,
      actualDate: actualDate ? new Date(actualDate) : null,
      status: status as CheckInStatus,
      employeeComment: employeeComment || null,
    },
    create: {
      goalId,
      quarter: quarter as Quarter,
      plannedTarget: plannedTarget ? String(plannedTarget) : null,
      actualAchievement: actualAchievement ? String(actualAchievement) : null,
      actualDate: actualDate ? new Date(actualDate) : null,
      status: status as CheckInStatus,
      employeeComment: employeeComment || null,
    },
    include: { goal: true, manager: true },
  });

  // Sync quarterly actuals back onto the Goal row
  const quarterField = `${quarter.toLowerCase()}Actual` as "q1Actual" | "q2Actual" | "q3Actual" | "q4Actual";
  const quarterStatusField = `${quarter.toLowerCase()}Status` as "q1Status" | "q2Status" | "q3Status" | "q4Status";

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      [quarterField]: actualAchievement ? String(actualAchievement) : null,
      [quarterStatusField]: status,
      actualValue: actualAchievement ? String(actualAchievement) : goal.actualValue,
      actualDate: actualDate ? new Date(actualDate) : goal.actualDate,
    },
  });

  // Recalculate and persist progress score if we have actuals
  if (actualAchievement && goal.targetValue) {
    const score = calculateProgressScore(
      goal.uomType.formulaType,
      Number(goal.targetValue),
      Number(actualAchievement),
      goal.targetDate,
      actualDate ? new Date(actualDate) : null
    );
    await prisma.goal.update({
      where: { id: goalId },
      data: { progressScore: score, achievementPercentage: score },
    });
  }

  return NextResponse.json(checkIn, { status: 201 });
}
