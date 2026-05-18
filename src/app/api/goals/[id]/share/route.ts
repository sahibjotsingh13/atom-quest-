import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { targetGoalSheetId } = body;

  const originalGoal = await prisma.goal.findUnique({
    where: { id: params.id },
    include: { goalSheet: true, uomType: true, thrustArea: true },
  });
  if (!originalGoal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const targetSheet = await prisma.goalSheet.findUnique({
    where: { id: targetGoalSheetId },
    include: { goals: true },
  });
  if (!targetSheet) return NextResponse.json({ error: "Target sheet not found" }, { status: 404 });

  if (targetSheet.goals.length >= 8) {
    return NextResponse.json({ error: "Target sheet already has max goals" }, { status: 400 });
  }

  const currentTotal = targetSheet.goals.reduce((sum, g) => sum + Number(g.weightage), 0);
  if (currentTotal + Number(originalGoal.weightage) > 100) {
    return NextResponse.json({ error: "Weightage would exceed 100%" }, { status: 400 });
  }

  const sharedGoal = await prisma.goal.create({
    data: {
      goalSheetId: targetGoalSheetId,
      thrustAreaId: originalGoal.thrustAreaId,
      title: originalGoal.title,
      description: originalGoal.description,
      uomTypeId: originalGoal.uomTypeId,
      targetValue: originalGoal.targetValue,
      targetDate: originalGoal.targetDate,
      weightage: originalGoal.weightage,
      isShared: true,
      parentGoalId: originalGoal.id,
      sharedById: session.user.id,
    },
    include: { thrustArea: true, uomType: true, parentGoal: true },
  });

  await prisma.goalSheet.update({
    where: { id: targetGoalSheetId },
    data: { totalWeightage: currentTotal + Number(originalGoal.weightage) },
  });

  return NextResponse.json(sharedGoal, { status: 201 });
}
