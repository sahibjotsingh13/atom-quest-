// src/app/api/manager/checkins/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "manager") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    // Get all check-ins for manager's team
    const checkIns = await prisma.checkIn.findMany({
      where: {
        goal: {
          goalSheet: {
            employee: {
              managerId: session.user.id,
            },
          },
        },
      },
      include: {
        goal: {
          include: {
            thrustArea: true,
            uomType: true,
            goalSheet: {
              include: {
                employee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    employeeId: true,
                  },
                },
              },
            },
          },
        },
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(checkIns);
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
