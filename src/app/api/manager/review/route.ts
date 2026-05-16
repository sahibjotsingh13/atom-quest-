// src/app/api/manager/review/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateGoalSheet } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "manager") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { sheetId, action, edits, rejectionReason } = await req.json();

    // Verify sheet belongs to manager's direct report and is pending review
    const sheet = await prisma.goalSheet.findFirst({
      where: {
        id: sheetId,
        employee: {
          managerId: session.user.id,
        },
        status: {
          in: ["submitted", "under_review"],
        },
      },
      include: {
        employee: true,
        goals: true,
      },
    });

    if (!sheet) {
      return new Response(
        JSON.stringify({ error: "Sheet not found or not pending review" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "approve") {
      // Apply inline edits if provided
      if (edits && edits.length > 0) {
        for (const edit of edits) {
          await prisma.goal.update({
            where: { id: edit.goalId },
            data: {
              targetValue:
                edit.targetValue !== undefined
                  ? String(edit.targetValue)
                  : undefined,
              weightage:
                edit.weightage !== undefined
                  ? String(edit.weightage)
                  : undefined,
            },
          });
        }

        // Re-validate weightage after edits
        const updatedGoals = await prisma.goal.findMany({
          where: { goalSheetId: sheetId },
        });

        const validation = validateGoalSheet(
          updatedGoals.map((g) => ({ weightage: Number(g.weightage) }))
        );

        if (!validation.valid) {
          return new Response(
            JSON.stringify({ errors: validation.errors }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Recalculate and persist total weightage
        const newTotal = updatedGoals.reduce(
          (sum, g) => sum + Number(g.weightage),
          0
        );
        await prisma.goalSheet.update({
          where: { id: sheetId },
          data: { totalWeightage: String(newTotal) },
        });
      }

      // Lock the sheet (approve + lock in one step)
      const updatedSheet = await prisma.goalSheet.update({
        where: { id: sheetId },
        data: {
          status: "locked",
          approvedAt: new Date(),
          approvedById: session.user.id,
          lockedAt: new Date(),
          lockedById: session.user.id,
        },
      });

      // Sync shared goal progress from parent goals
      await syncSharedGoals(sheetId);

      // Notify employee
      await prisma.notification.create({
        data: {
          userId: sheet.employeeId,
          type: "in_app",
          category: "goal_approved",
          title: "Goals Approved",
          message: `Your goal sheet has been approved by ${session.user.firstName} ${session.user.lastName}.`,
        },
      });

      return Response.json({
        success: true,
        message: "Goal sheet approved and locked",
        sheet: updatedSheet,
      });
    }

    if (action === "reject") {
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        return new Response(
          JSON.stringify({
            error: "Rejection reason must be at least 10 characters",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const updatedSheet = await prisma.goalSheet.update({
        where: { id: sheetId },
        data: {
          status: "rejected",
          rejectionReason,
        },
      });

      // Notify employee
      await prisma.notification.create({
        data: {
          userId: sheet.employeeId,
          type: "in_app",
          category: "goal_rejected",
          title: "Goals Returned for Rework",
          message: `Your goal sheet has been returned. Reason: ${rejectionReason}`,
        },
      });

      return Response.json({
        success: true,
        message: "Goal sheet returned for rework",
        sheet: updatedSheet,
      });
    }

    if (action === "unlock") {
      const updatedSheet = await prisma.goalSheet.update({
        where: { id: sheetId },
        data: {
          status: "under_review",
          lockedAt: null,
          lockedById: null,
        },
      });

      // Notify employee
      await prisma.notification.create({
        data: {
          userId: sheet.employeeId,
          type: "in_app",
          category: "goal_unlocked",
          title: "Goal Sheet Unlocked",
          message: `Your goal sheet has been unlocked by ${session.user.firstName} for further edits.`,
        },
      });

      return Response.json({
        success: true,
        message: "Goal sheet unlocked for editing",
        sheet: updatedSheet,
      });
    }

    if (action === "reset") {
      const updatedSheet = await prisma.goalSheet.update({
        where: { id: sheetId },
        data: {
          status: "draft",
          submittedAt: null,
          approvedAt: null,
          approvedById: null,
          lockedAt: null,
          lockedById: null,
          rejectionReason: null,
        },
      });

      return Response.json({
        success: true,
        message: "Goal sheet has been reset to draft status",
        sheet: updatedSheet,
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Must be 'approve' or 'reject'" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error reviewing sheet:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// Sync shared goal progress fields from the parent goal to child goals
async function syncSharedGoals(sheetId: string) {
  const sharedGoals = await prisma.goal.findMany({
    where: {
      goalSheetId: sheetId,
      isShared: true,
      parentGoalId: { not: null },
    },
  });

  for (const goal of sharedGoals) {
    const parentGoal = await prisma.goal.findUnique({
      where: { id: goal.parentGoalId! },
    });

    if (parentGoal) {
      await prisma.goal.update({
        where: { id: goal.id },
        data: {
          actualValue: parentGoal.actualValue,
          actualDate: parentGoal.actualDate,
          achievementPercentage: parentGoal.achievementPercentage,
          progressScore: parentGoal.progressScore,
          q1Actual: parentGoal.q1Actual,
          q1Status: parentGoal.q1Status,
          q2Actual: parentGoal.q2Actual,
          q2Status: parentGoal.q2Status,
          q3Actual: parentGoal.q3Actual,
          q3Status: parentGoal.q3Status,
          q4Actual: parentGoal.q4Actual,
          q4Status: parentGoal.q4Status,
        },
      });
    }
  }
}
