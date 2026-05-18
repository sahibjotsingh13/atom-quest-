import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SheetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: params.id },
    include: {
      employee: { select: { firstName: true, lastName: true, email: true, employeeId: true, managerId: true } },
      cycle: true,
      approvedBy: { select: { firstName: true, lastName: true } },
      lockedBy: { select: { firstName: true, lastName: true } },
      goals: {
        include: { thrustArea: true, uomType: true, checkIns: true, childGoals: true, parentGoal: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = sheet.employeeId === session.user.id;
  const isManager = sheet.employee.managerId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isManager && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(sheet);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, rejectionReason } = body;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: params.id },
    include: { employee: true },
  });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = sheet.employeeId === session.user.id;
  const isManager = sheet.employee.managerId === session.user.id;
  const isAdmin = session.user.role === "admin";

  const updateData: any = {};

  if (status === "submitted" && isOwner && sheet.status === "draft") {
    const goals = await prisma.goal.findMany({ where: { goalSheetId: params.id } });
    const totalWeight = goals.reduce((sum, g) => sum + Number(g.weightage), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json({ error: `Total weightage must be exactly 100%. Current: ${totalWeight}%` }, { status: 400 });
    }
    if (goals.length === 0 || goals.length > 8) {
      return NextResponse.json({ error: "Must have 1-8 goals" }, { status: 400 });
    }
    updateData.status = SheetStatus.submitted;
    updateData.submittedAt = new Date();
    updateData.totalWeightage = totalWeight;
  } else if (status === "approved" && (isManager || isAdmin) && sheet.status === "submitted") {
    updateData.status = SheetStatus.approved;
    updateData.approvedAt = new Date();
    updateData.approvedById = session.user.id;
  } else if (status === "rejected" && (isManager || isAdmin) && sheet.status === "submitted") {
    updateData.status = SheetStatus.rejected;
    updateData.rejectionReason = rejectionReason || "Rejected by manager";
  } else if (status === "locked" && isAdmin && sheet.status === "approved") {
    updateData.status = SheetStatus.locked;
    updateData.lockedAt = new Date();
    updateData.lockedById = session.user.id;
  } else if (status === "draft" && isOwner && sheet.status === "rejected") {
    updateData.status = SheetStatus.draft;
    updateData.submittedAt = null;
  } else {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  }

  const updated = await prisma.goalSheet.update({
    where: { id: params.id },
    data: updateData,
    include: { employee: true, cycle: true, goals: { include: { thrustArea: true, uomType: true } } },
  });

  return NextResponse.json(updated);
}
