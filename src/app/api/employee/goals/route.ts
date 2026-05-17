// src/app/api/employee/goals/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GOAL_RULES, calculateRemainingWeightage } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { goalSheetId, title, description, thrustAreaId, uomTypeId, targetValue, targetDate, weightage } = body;

    // Verify sheet belongs to employee and is in draft
    const sheet = await prisma.goalSheet.findFirst({
      where: {
        id: goalSheetId,
        employeeId: session.user.id,
        status: "draft",
      },
      include: { goals: true },
    });

    if (!sheet) {
      return new Response("Goal sheet not found or not editable", { status: 404 });
    }

    // Check max goals
    if (sheet.goals.length >= GOAL_RULES.MAX_GOALS) {
      return new Response(
        JSON.stringify({ error: `Maximum ${GOAL_RULES.MAX_GOALS} goals allowed` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check weightage
    const goalsWithNumbers = sheet.goals.map(g => ({
      ...g,
      weightage: Number(g.weightage)
    }));

    const remaining = calculateRemainingWeightage(goalsWithNumbers);
    if (weightage > remaining) {
      return new Response(
        JSON.stringify({ 
          error: `Weightage exceeds remaining ${remaining.toFixed(1)}%` 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get UoM type to validate target
    const uomType = await prisma.uomType.findUnique({
      where: { id: uomTypeId },
    });

    // Create goal
    const goal = await prisma.goal.create({
      data: {
        goalSheetId,
        thrustAreaId,
        title,
        description: description || null,
        uomTypeId,
        targetValue: targetValue ? String(targetValue) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        weightage: String(weightage),
      },
      include: {
        thrustArea: true,
        uomType: true,
      },
    });

    // Update sheet total weightage
    const newTotal = sheet.goals.reduce((sum, g) => sum + Number(g.weightage), 0) + weightage;
    await prisma.goalSheet.update({
      where: { id: goalSheetId },
      data: { totalWeightage: String(newTotal) },
    });

    return Response.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return new Response("Internal server error", { status: 500 });
  }
}