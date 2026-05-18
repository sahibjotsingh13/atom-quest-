// src/app/api/admin/unlock/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const unlockSchema = z.object({
  sheetId: z.string().uuid("Invalid sheet ID"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = unlockSchema.parse(body);
    const { sheetId, reason } = validated;

    // First check if the sheet exists
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: sheetId },
      include: {
        employee: true,
      }
    });

    if (!sheet) {
      return new Response("Goal sheet not found", { status: 404 });
    }

    if (sheet.status !== "locked") {
      return new Response(
        JSON.stringify({ error: "Only locked sheets can be unlocked" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Unlock the sheet
    const updated = await prisma.goalSheet.update({
      where: { id: sheetId },
      data: {
        status: "approved", // Back to approved but editable
        lockedAt: null,
        lockedById: null,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        tableName: "goal_sheets",
        recordId: sheetId,
        action: "UPDATE",
        changedById: session.user.id,
        changeReason: reason,
        oldValues: { status: "locked", lockedAt: sheet.lockedAt },
        newValues: { status: "approved", lockedAt: null },
      },
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: sheet.employeeId,
        type: "in_app",
        category: "sheet_unlocked",
        title: "Goal Sheet Unlocked",
        message: `Your goal sheet has been unlocked by admin. Reason: ${reason}`,
      },
    });

    // Notify manager
    if (sheet.employee.managerId) {
      await prisma.notification.create({
        data: {
          userId: sheet.employee.managerId,
          type: "in_app",
          category: "sheet_unlocked",
          title: "Goal Sheet Unlocked",
          message: `${sheet.employee.firstName}'s goal sheet has been unlocked by admin.`,
        },
      });
    }

    return Response.json({
      success: true,
      message: "Goal sheet unlocked successfully",
      sheet: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Error unlocking sheet:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
