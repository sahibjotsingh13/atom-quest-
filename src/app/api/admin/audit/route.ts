// src/app/api/admin/audit/route.ts
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
    const recordId = searchParams.get("recordId");
    const tableName = searchParams.get("tableName") || "goal_sheets";

    const logs = await prisma.auditLog.findMany({
      where: {
        tableName,
        ...(recordId ? { recordId } : {}),
      },
      include: {
        changedBy: {
          select: { firstName: true, lastName: true, email: true, role: true },
        },
      },
      orderBy: { changedAt: "desc" },
      take: 100,
    });

    return Response.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
