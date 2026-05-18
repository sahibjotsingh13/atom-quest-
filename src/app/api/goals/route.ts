import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const goalSheetId = searchParams.get("goalSheetId");
  const isShared = searchParams.get("isShared");

  const where: any = {};
  if (goalSheetId) where.goalSheetId = goalSheetId;
  if (isShared !== null) where.isShared = isShared === "true";

  const goals = await prisma.goal.findMany({
    where,
    include: {
      goalSheet: { include: { employee: { select: { firstName: true, lastName: true } } } },
      thrustArea: true,
      uomType: true,
      checkIns: true,
      sharedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { goalSheetId, thrustAreaId, title, description, uomTypeId, targetValue, targetDate, weightage } = body;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    include: { employee: true, goals: true },
  });
  if (!sheet) return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });

  const isOwner = sheet.employeeId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (sheet.status !== "draft" && sheet.status !== "rejected") {
    return NextResponse.json({ error: "Can only edit goals in draft or rejected state" }, { status: 400 });
  }

  if (weightage < 1) return NextResponse.json({ error: "Minimum weightage per goal is 1%" }, { status: 400 });
  if (sheet.goals.length >= 8) return NextResponse.json({ error: "Maximum 8 goals allowed" }, { status: 400 });

  const currentTotal = sheet.goals.reduce((sum, g) => sum + Number(g.weightage), 0);
  if (currentTotal + Number(weightage) > 100) {
    return NextResponse.json({ error: `Total weightage cannot exceed 100%. Current: ${currentTotal}%` }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      goalSheetId,
      thrustAreaId,
      title,
      description,
      uomTypeId,
      targetValue: targetValue ? String(targetValue) : null,
      targetDate: targetDate ? new Date(targetDate) : null,
      weightage: String(weightage),
    },
    include: { thrustArea: true, uomType: true },
  });

  const newTotal = currentTotal + Number(weightage);
  await prisma.goalSheet.update({ where: { id: goalSheetId }, data: { totalWeightage: newTotal } });

  return NextResponse.json(goal, { status: 201 });
}
