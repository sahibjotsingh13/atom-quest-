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

  // Notify employee if manager acknowledges or comments on check-in
  if ((body.isAcknowledged === true || (body.managerComment !== undefined && body.managerComment.trim().length > 0)) && (isManager || isAdmin)) {
    let title = `${checkIn.quarter} Check-in Reviewed`;
    let message = `Your check-in for "${checkIn.goal.title}" has been reviewed.`;
    let category = "checkin_feedback";
    
    if (body.isAcknowledged === true) {
      title = `${checkIn.quarter} Check-in Acknowledged`;
      message = `Your check-in for "${checkIn.goal.title}" has been acknowledged by ${session.user.firstName} ${session.user.lastName}.`;
      category = "checkin_acknowledged";
    } else if (body.managerComment) {
      title = `New Manager Feedback on ${checkIn.quarter} Check-in`;
      message = `${session.user.firstName} ${session.user.lastName} added a comment on your ${checkIn.quarter} check-in for "${checkIn.goal.title}".`;
      category = "checkin_feedback";
    }

    await prisma.notification.create({
      data: {
        userId: checkIn.goal.goalSheet.employeeId,
        type: "in_app",
        category,
        title,
        message,
        deepLink: `/employee/checkins`,
        metadata: { checkInId: checkIn.id, goalId: checkIn.goalId, quarter: checkIn.quarter },
      },
    });
  }

  return NextResponse.json(updated);
}
