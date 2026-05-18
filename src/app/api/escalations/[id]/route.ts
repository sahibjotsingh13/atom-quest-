import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, resolutionNotes } = body;

  const escalation = await prisma.escalation.findUnique({ where: { id: params.id } });
  if (!escalation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "admin";
  const isManager = session.user.role === "manager";

  if (status === "resolved" && (isAdmin || isManager)) {
    const updated = await prisma.escalation.update({
      where: { id: params.id },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
        resolvedById: session.user.id,
        resolutionNotes: resolutionNotes || null,
      },
      include: { rule: true, triggeredFor: true, resolvedBy: true },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
}
