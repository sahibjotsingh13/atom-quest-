// src/app/api/admin/sheets/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const cycleId = searchParams.get("cycleId");

    const where: any = {};
    if (status) where.status = status;
    if (cycleId) where.cycleId = cycleId;

    const sheets = await prisma.goalSheet.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true,
            manager: true,
          },
        },
        cycle: true,
        goals: true,
        approvedBy: {
          select: { firstName: true, lastName: true },
        },
        lockedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json(sheets);
  } catch (error) {
    console.error("Error fetching sheets:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
