// src/app/api/manager/sheet/[id]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "manager") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const sheet = await prisma.goalSheet.findFirst({
      where: {
        id: params.id,
        employee: {
          managerId: session.user.id,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
        goals: {
          include: {
            thrustArea: true,
            uomType: true,
            checkIns: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        cycle: true,
      },
    });

    if (!sheet) {
      return new Response("Goal sheet not found", { status: 404 });
    }

    return Response.json(sheet);
  } catch (error) {
    console.error("Error fetching sheet:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
