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
    const { goalUpdates } = await req.json();

    const sheet = await prisma.goalSheet.findFirst({
      where: {
        id: params.id,
        employee: {
          managerId: session.user.id,
        },
      },
      include: {
        goals: true,
        employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
    });

    if (!sheet) {
      return new Response(JSON.stringify({ error: "Goal sheet not found" }), { status: 404 });
    }

    if (sheet.status === "approved" || sheet.status === "locked") {
      return new Response(JSON.stringify({ error: "Sheet is already approved or locked" }), { status: 400 });
    }

    // Process inline edits and approve in a transaction
    await prisma.$transaction(async (tx) => {
      if (goalUpdates && Object.keys(goalUpdates).length > 0) {
        for (const [goalId, updates] of Object.entries(goalUpdates)) {
          const typedUpdates = updates as { targetValue?: number; weightage?: number };
          await tx.goal.update({
            where: { id: goalId, goalSheetId: sheet.id },
            data: {
              targetValue: typedUpdates.targetValue !== undefined ? String(typedUpdates.targetValue) : undefined,
              weightage: typedUpdates.weightage !== undefined ? String(typedUpdates.weightage) : undefined,
            },
          });
        }
      }

      // Re-calculate total weightage to ensure it is 100%
      const updatedGoals = await tx.goal.findMany({
        where: { goalSheetId: sheet.id },
      });
      const totalWeightage = updatedGoals.reduce((sum, g) => sum + Number(g.weightage), 0);

      if (Math.abs(totalWeightage - 100) > 0.01) {
        throw new Error(`Total weightage must be exactly 100%. Current: ${totalWeightage.toFixed(1)}%`);
      }

      // Check BRD: min 10% per goal
      const underWeighted = updatedGoals.find((g) => Number(g.weightage) < 10);
      if (underWeighted) {
        throw new Error(`Goal "${underWeighted.title}" has ${Number(underWeighted.weightage)}% weightage. Minimum is 10%.`);
      }

      await tx.goalSheet.update({
        where: { id: sheet.id },
        data: {
          status: "approved",
          totalWeightage,
          approvedAt: new Date(),
          approvedById: session.user.id,
          rejectionReason: null,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          tableName: "GoalSheet",
          recordId: sheet.id,
          action: "APPROVE",
          changedById: session.user.id,
          changeReason: "Manager approved goal sheet",
          oldValues: { status: sheet.status },
          newValues: { status: "approved", goalUpdates: goalUpdates || {} },
        },
      });

      // Notify employee
      await tx.notification.create({
        data: {
          userId: sheet.employeeId,
          type: "goal_approved",
          title: "Goal Sheet Approved! 🎉",
          message: `Your goal sheet has been reviewed and approved by your manager. Goals are now active.`,
          deepLink: `/dashboard`,
          metadata: { sheetId: sheet.id },
        },
      });
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error approving sheet:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500 });
  }
}
