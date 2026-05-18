import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const checkIn = await prisma.checkIn.findUnique({
    where: { id: params.id },
    include: { goal: { include: { goalSheet: { include: { employee: true } } } } },
  });
  if (!checkIn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isManager = checkIn.goal.goalSheet.employee.managerId === session.user.id;
  const isAdmin = session.user.role === "admin";

  const updateData: any = {};
  if (body.managerComment !== undefined && (isManager || isAdmin)) {
    updateData.managerComment = body.managerComment;
    updateData.managerId = session.user.id;
  }
  if (body.isAcknowledged !== undefined && (isManager || isAdmin)) {
    updateData.isAcknowledged = body.isAcknowledged;
    updateData.acknowledgedAt = body.isAcknowledged ? new Date() : null;
  }

  const updated = await prisma.checkIn.update({
    where: { id: params.id },
    data: updateData,
    include: { goal: true, manager: true },
  });

  return NextResponse.json(updated);
}
