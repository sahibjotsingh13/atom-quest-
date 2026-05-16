// src/app/api/admin/cycles/[id]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (!["draft", "active", "closed", "archived"].includes(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // If activating, deactivate other active cycles
    if (status === "active") {
      await prisma.cycle.updateMany({
        where: { status: "active", id: { not: params.id } },
        data: { status: "closed" },
      });
    }

    const cycle = await prisma.cycle.update({
      where: { id: params.id },
      data: { status },
    });

    return Response.json(cycle);
  } catch (error) {
    console.error("Error updating cycle:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    // Check if cycle has goal sheets
    const cycle = await prisma.cycle.findUnique({
      where: { id: params.id },
      include: { _count: { select: { goalSheets: true } } },
    });

    if (cycle && cycle._count.goalSheets > 0) {
      return new Response(
        JSON.stringify({ error: "Cannot delete cycle with existing goal sheets" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await prisma.cycle.delete({ where: { id: params.id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting cycle:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
