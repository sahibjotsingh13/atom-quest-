// src/app/api/admin/escalations/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "open";

    const escalations = await prisma.escalation.findMany({
      where: { status: status as string },
      include: {
        rule: true,
        triggeredFor: {
          select: { firstName: true, lastName: true, email: true, employeeId: true },
        },
        triggeredBy: {
          select: { firstName: true, lastName: true },
        },
        resolvedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { triggeredAt: "desc" },
    });

    return Response.json(escalations.map(e => ({
      id: e.id,
      ruleName: e.rule.name,
      triggeredFor: `${e.triggeredFor.firstName} ${e.triggeredFor.lastName}`,
      triggeredForEmail: e.triggeredFor.email,
      triggeredForId: e.triggeredFor.employeeId,
      triggeredBy: e.triggeredBy ? `${e.triggeredBy.firstName} ${e.triggeredBy.lastName}` : "System",
      escalationLevel: e.escalationLevel,
      status: e.status,
      triggeredAt: e.triggeredAt.toISOString(),
      resolvedAt: e.resolvedAt?.toISOString(),
      resolvedBy: e.resolvedBy ? `${e.resolvedBy.firstName} ${e.resolvedBy.lastName}` : null,
      resolutionNotes: e.resolutionNotes,
    })));
  } catch (error) {
    console.error("Error fetching escalations:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { escalationId, status, resolutionNotes } = await req.json();

    const escalation = await prisma.escalation.update({
      where: { id: escalationId },
      data: {
        status,
        resolvedAt: status === "resolved" ? new Date() : undefined,
        resolvedById: status === "resolved" ? session.user.id : undefined,
        resolutionNotes,
      },
    });

    return Response.json(escalation);
  } catch (error) {
    console.error("Error updating escalation:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
