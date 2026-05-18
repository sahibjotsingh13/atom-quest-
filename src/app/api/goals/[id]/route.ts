import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateProgressScore } from "@/lib/calculate-progress";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goal = await prisma.goal.findUnique({
    where: { id: params.id },
    include: {
      goalSheet: { include: { employee: { select: { firstName: true, lastName: true, managerId: true } } } },
      thrustArea: true,
      uomType: true,
      checkIns: true,
      childGoals: true,
      parentGoal: true,
    },
  });

  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = goal.goalSheet.employeeId === session.user.id;
  const isManager = goal.goalSheet.employee.managerId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isManager && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(goal);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const goal = await prisma.goal.findUnique({
    where: { id: params.id },
    include: { goalSheet: { include: { employee: true, goals: true } }, uomType: true },
  });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = goal.goalSheet.employeeId === session.user.id;
  const isAdmin = session.user.role === "admin";

  // Progress update path (actuals / status)
  if (body.actualValue !== undefined || body.actualDate !== undefined || body.status !== undefined) {
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updateData: any = {};
    if (body.actualValue !== undefined) updateData.actualValue = String(body.actualValue);
    if (body.actualDate !== undefined) updateData.actualDate = body.actualDate ? new Date(body.actualDate) : null;
    if (body.status !== undefined) updateData.status = body.status;

    if (body.actualValue !== undefined && goal.targetValue !== null) {
      const score = calculateProgressScore(
        goal.uomType.formulaType,
        Number(goal.targetValue),
        Number(body.actualValue),
        goal.targetDate,
        body.actualDate ? new Date(body.actualDate) : null
      );
      updateData.progressScore = score;
      updateData.achievementPercentage = score;
    }

    const updated = await prisma.goal.update({
      where: { id: params.id },
      data: updateData,
      include: { thrustArea: true, uomType: true },
    });

    return NextResponse.json(updated);
  }

  // Metadata edit path (title, weightage, etc.) — only valid in draft/rejected
  if (goal.goalSheet.status !== "draft" && goal.goalSheet.status !== "rejected") {
    return NextResponse.json({ error: "Can only edit in draft state" }, { status: 400 });
  }
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.thrustAreaId !== undefined) updateData.thrustAreaId = body.thrustAreaId;
  if (body.uomTypeId !== undefined) updateData.uomTypeId = body.uomTypeId;
  if (body.targetValue !== undefined) updateData.targetValue = body.targetValue ? String(body.targetValue) : null;
  if (body.targetDate !== undefined) updateData.targetDate = body.targetDate ? new Date(body.targetDate) : null;

  if (body.weightage !== undefined) {
    const newWeight = Number(body.weightage);
    if (newWeight < 10) return NextResponse.json({ error: "Minimum weightage is 10%" }, { status: 400 });
    const otherTotal = goal.goalSheet.goals.reduce(
      (sum, g) => sum + (g.id === params.id ? 0 : Number(g.weightage)),
      0
    );
    if (otherTotal + newWeight > 100) {
      return NextResponse.json({ error: "Total weightage cannot exceed 100%" }, { status: 400 });
    }
    updateData.weightage = String(newWeight);
    await prisma.goalSheet.update({
      where: { id: goal.goalSheetId },
      data: { totalWeightage: otherTotal + newWeight },
    });
  }

  const updated = await prisma.goal.update({
    where: { id: params.id },
    data: updateData,
    include: { thrustArea: true, uomType: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goal = await prisma.goal.findUnique({
    where: { id: params.id },
    include: { goalSheet: { include: { employee: true } } },
  });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = goal.goalSheet.employeeId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (goal.goalSheet.status !== "draft" && goal.goalSheet.status !== "rejected") {
    return NextResponse.json({ error: "Can only delete in draft state" }, { status: 400 });
  }

  await prisma.goal.delete({ where: { id: params.id } });

  const remainingGoals = await prisma.goal.findMany({ where: { goalSheetId: goal.goalSheetId } });
  const newTotal = remainingGoals.reduce((sum, g) => sum + Number(g.weightage), 0);
  await prisma.goalSheet.update({ where: { id: goal.goalSheetId }, data: { totalWeightage: newTotal } });

  return NextResponse.json({ success: true });
}
