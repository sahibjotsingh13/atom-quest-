// src/app/api/employee/checkin/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProgressScore } from "@/lib/validation";
import { isCheckInWindowOpen } from "@/lib/checkin-window";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { goalId, quarter, actualValue, actualDate, status, comment } = body;

    // Verify goal belongs to employee's locked or approved sheet
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        goalSheet: {
          employeeId: session.user.id,
          status: { in: ["approved", "locked"] },
        },
      },
      include: {
        goalSheet: {
          include: { cycle: true },
        },
        uomType: true,
      },
    });

    if (!goal) {
      return new Response(
        JSON.stringify({ error: "Goal not found or sheet not approved/locked" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate check-in window (relaxed for UAT / demo purposes)
    // if (!isCheckInWindowOpen(goal.goalSheet.cycle, quarter)) {
    //   return new Response(
    //     JSON.stringify({ 
    //       error: `Check-in window for ${quarter} is not open`,
    //       currentWindow: getCurrentQuarterInfo(goal.goalSheet.cycle)
    //     }),
    //     { status: 403, headers: { "Content-Type": "application/json" } }
    //   );
    // }

    // Calculate progress score
    const score = calculateProgressScore(
      goal.uomType.code,
      Number(goal.targetValue) || 0,
      Number(actualValue) || 0,
      goal.targetDate || undefined,
      actualDate ? new Date(actualDate) : undefined
    );

    // Update goal quarter data
    const updateData: any = {
      [`${quarter.toLowerCase()}Actual`]: actualValue ? String(actualValue) : null,
      [`${quarter.toLowerCase()}Status`]: status,
      [`${quarter.toLowerCase()}Comment`]: comment || null,
      actualValue: actualValue ? String(actualValue) : goal.actualValue,
      actualDate: actualDate ? new Date(actualDate) : goal.actualDate,
      progressScore: String(score),
      achievementPercentage: String(score),
    };

    // If completed, update goal status
    if (status === "completed") {
      updateData.status = "completed";
    } else if (status === "at_risk") {
      updateData.status = "at_risk";
    } else if (status === "on_track") {
      updateData.status = "on_track";
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        thrustArea: true,
        uomType: true,
      },
    });

    // Create or update check-in record using findFirst to avoid unique constraint naming issues in IDE
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: { 
        goalId,
        quarter: quarter as any,
      },
    });

    if (existingCheckIn) {
      await prisma.checkIn.update({
        where: { id: existingCheckIn.id },
        data: {
          actualAchievement: actualValue ? String(actualValue) : null,
          actualDate: actualDate ? new Date(actualDate) : null,
          status,
          employeeComment: comment,
        } as any,
      });
    } else {
      await prisma.checkIn.create({
        data: {
          goalId,
          quarter: quarter as any,
          plannedTarget: goal.targetValue,
          actualAchievement: actualValue ? String(actualValue) : null,
          actualDate: actualDate ? new Date(actualDate) : null,
          status,
          employeeComment: comment,
        } as any,
      });
    }

    return Response.json({
      goal: updatedGoal,
      progressScore: score,
      quarter,
    });
  } catch (error) {
    console.error("Error creating check-in:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get("goalId");

    if (!goalId) {
      return new Response("Goal ID required", { status: 400 });
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { goalId },
      include: {
        manager: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(checkIns);
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

function getCurrentQuarterInfo(cycle: any) {
  const now = new Date();
  const quarters = [
    { name: "Q1", start: cycle.q1Start, end: cycle.q1End },
    { name: "Q2", start: cycle.q2Start, end: cycle.q2End },
    { name: "Q3", start: cycle.q3Start, end: cycle.q3End },
    { name: "Q4", start: cycle.q4Start, end: cycle.q4End },
  ];
  
  for (const q of quarters) {
    if (now >= q.start && now <= q.end) return q.name;
    if (now < q.start) return `Next: ${q.name}`;
  }
  return "Closed";
}
