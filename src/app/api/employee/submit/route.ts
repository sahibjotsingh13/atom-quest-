// src/app/api/employee/submit/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateGoalSheet } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { sheetId } = await req.json();

    // Get sheet with goals
    const sheet = await prisma.goalSheet.findFirst({
      where: {
        id: sheetId,
        employeeId: session.user.id,
        status: "draft",
      },
      include: { goals: true },
    });

    if (!sheet) {
      return new Response("Goal sheet not found or already submitted", { status: 404 });
    }

    // Validate
    const validation = validateGoalSheet(sheet.goals.map(g => ({ weightage: Number(g.weightage) })));
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ errors: validation.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update status
    const updated = await prisma.goalSheet.update({
      where: { id: sheetId },
      data: {
        status: "submitted",
        submittedAt: new Date(),
      },
    });

    // Create notification for manager
    const employee = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { manager: true },
    });

    if (employee?.manager) {
      await prisma.notification.create({
        data: {
          userId: employee.manager.id,
          type: "in_app",
          category: "goal_submitted",
          title: "Goal Sheet Submitted",
          message: `${employee.firstName} ${employee.lastName} has submitted their goal sheet for approval.`,
        },
      });
    }

    return Response.json(updated);
  } catch (error) {
    console.error("Error submitting goal sheet:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
