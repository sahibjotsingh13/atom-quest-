// src/app/api/manager/feedback/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "manager") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { goalId, quarter, comment } = await req.json();

    // Validate quarter value
    const validQuarters = ["Q1", "Q2", "Q3", "Q4"];
    if (!validQuarters.includes(quarter)) {
      return new Response(
        JSON.stringify({ error: "Invalid quarter. Must be Q1, Q2, Q3, or Q4" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify goal belongs to one of the manager's direct reports
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        goalSheet: {
          employee: {
            managerId: session.user.id,
          },
        },
      },
      include: {
        goalSheet: true,
      },
    });

    if (!goal) {
      return new Response("Goal not found", { status: 404 });
    }

    // Update the quarter comment on the Goal row
    const updateData: Record<string, string> = {};
    updateData[`${quarter.toLowerCase()}Comment`] = comment;

    await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });

    // Create or update the corresponding CheckIn record
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        goalId,
        quarter: quarter as any,
      },
    });

    if (existingCheckIn) {
      await prisma.checkIn.update({
        where: { id: existingCheckIn.id },
        data: {
          managerComment: comment,
          managerId: session.user.id,
        },
      });
    } else {
      await prisma.checkIn.create({
        data: {
          goalId,
          quarter: quarter as any,
          managerComment: comment,
          managerId: session.user.id,
          status: "on_track",
        },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error adding feedback:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "manager") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get("goalId");
    const quarter = searchParams.get("quarter");

    if (!goalId || !quarter) {
      return new Response("Goal ID and quarter required", { status: 400 });
    }

    const checkIn = await prisma.checkIn.findFirst({
      where: {
        goalId,
        quarter: quarter as any,
      },
      include: {
        goal: true,
      },
    });

    return Response.json(checkIn);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
