// src/app/api/employee/goals/[id]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRemainingWeightage } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, targetValue, targetDate, weightage } = body;

    // Verify goal belongs to employee's sheet (relaxed status check for UAT)
    const goal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        goalSheet: {
          employeeId: session.user.id,
        },
      },
      include: {
        goalSheet: {
          include: { goals: true },
        },
      },
    });

    if (!goal) {
      return new Response("Goal not found or not editable", { status: 404 });
    }

    // If changing weightage, validate
    if (weightage !== undefined && weightage !== Number(goal.weightage)) {
      const otherGoals = goal.goalSheet.goals.filter(g => g.id !== params.id);
      const remaining = calculateRemainingWeightage(otherGoals.map(g => ({
        ...g,
        weightage: Number(g.weightage)
      })));

      if (weightage > remaining) {
        return new Response(
          JSON.stringify({ error: `Weightage exceeds remaining ${remaining.toFixed(1)}%` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Update sheet total
      const newTotal = otherGoals.reduce((sum, g) => sum + Number(g.weightage), 0) + weightage;
      await prisma.goalSheet.update({
        where: { id: goal.goalSheetId },
        data: { totalWeightage: String(newTotal) },
      });
    }

    // Update goal
    const updated = await prisma.goal.update({
      where: { id: params.id },
      data: {
        title: title || goal.title,
        description: description !== undefined ? description : goal.description,
        targetValue: targetValue !== undefined ? String(targetValue) : goal.targetValue,
        targetDate: targetDate ? new Date(targetDate) : goal.targetDate,
        weightage: weightage !== undefined ? String(weightage) : goal.weightage,
      },
      include: {
        thrustArea: true,
        uomType: true,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Error updating goal:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Verify goal belongs to employee's sheet (relaxed status check for UAT)
    const goal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        goalSheet: {
          employeeId: session.user.id,
        },
      },
      include: {
        goalSheet: {
          include: { goals: true },
        },
      },
    });

    if (!goal) {
      return new Response("Goal not found or not editable", { status: 404 });
    }

    // Delete goal
    await prisma.goal.delete({
      where: { id: params.id },
    });

    // Update sheet total
    const remainingGoals = goal.goalSheet.goals.filter(g => g.id !== params.id);
    const newTotal = remainingGoals.reduce((sum, g) => sum + Number(g.weightage), 0);
    await prisma.goalSheet.update({
      where: { id: goal.goalSheetId },
      data: { totalWeightage: String(newTotal) },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return new Response("Internal server error", { status: 500 });
  }
}