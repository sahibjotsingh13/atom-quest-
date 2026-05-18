import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "manager") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { reason } = await req.json();

    if (!reason || reason.trim() === "") {
      return new Response(JSON.stringify({ error: "Rejection reason is required" }), { status: 400 });
    }

    const sheet = await prisma.goalSheet.findFirst({
      where: {
        id: params.id,
        employee: {
          managerId: session.user.id,
        },
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!sheet) {
      return new Response(JSON.stringify({ error: "Goal sheet not found" }), { status: 404 });
    }

    if (sheet.status === "approved" || sheet.status === "locked") {
      return new Response(JSON.stringify({ error: "Cannot reject an approved or locked sheet" }), { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.goalSheet.update({
        where: { id: sheet.id },
        data: {
          status: "rejected",
          rejectionReason: reason,
        },
      });

      await tx.auditLog.create({
        data: {
          tableName: "GoalSheet",
          recordId: sheet.id,
          action: "REJECT",
          changedById: session.user.id,
          changeReason: reason,
          oldValues: { status: sheet.status },
          newValues: { status: "rejected" },
        },
      });

      // Notify employee about rejection
      await tx.notification.create({
        data: {
          userId: sheet.employeeId,
          type: "goal_rejected",
          title: "Goal Sheet Returned for Rework",
          message: `Your manager has returned your goal sheet. Reason: ${reason}`,
          deepLink: `/dashboard`,
          metadata: { sheetId: sheet.id },
        },
      });
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error rejecting sheet:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500 });
  }
}
