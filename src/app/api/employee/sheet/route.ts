// src/app/api/employee/sheet/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Find active goal cycle
    const activeCycle = await prisma.cycle.findFirst({
      where: { status: "active" },
    });

    if (!activeCycle) {
      return new Response("No active goal cycle found", { status: 404 });
    }

    // Find or create goal sheet for this cycle
    let sheet = await prisma.goalSheet.findFirst({
      where: {
        employeeId: session.user.id,
        cycleId: activeCycle.id,
      },
      include: {
        cycle: true,
        goals: {
          include: {
            thrustArea: true,
            uomType: true,
            checkIns: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!sheet) {
      // Auto-create sheet if it doesn't exist
      sheet = await prisma.goalSheet.create({
        data: {
          employeeId: session.user.id,
          cycleId: activeCycle.id,
          status: "draft",
          totalWeightage: "0",
        },
        include: {
          cycle: true,
          goals: {
            include: {
              thrustArea: true,
              uomType: true,
              checkIns: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    return Response.json(sheet);
  } catch (error) {
    console.error("Error fetching goal sheet:", error);
    return new Response("Internal server error", { status: 500 });
  }
}