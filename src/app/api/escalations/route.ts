import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status) where.status = status;

  if (session.user.role === "employee") {
    where.triggeredForId = session.user.id;
  } else if (session.user.role === "manager") {
    where.OR = [
      { triggeredForId: session.user.id },
      { triggeredFor: { managerId: session.user.id } },
    ];
  }

  const escalations = await prisma.escalation.findMany({
    where,
    include: {
      rule: true,
      triggeredFor: { select: { firstName: true, lastName: true, email: true } },
      triggeredBy: { select: { firstName: true, lastName: true } },
      resolvedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { triggeredAt: "desc" },
  });

  return NextResponse.json(escalations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { ruleId, triggeredForId, escalationLevel } = body;

  const rule = await prisma.escalationRule.findUnique({ where: { id: ruleId } });
  if (!rule || !rule.isActive) {
    return NextResponse.json({ error: "Rule not found or inactive" }, { status: 404 });
  }

  const escalation = await prisma.escalation.create({
    data: {
      ruleId,
      triggeredForId,
      triggeredById: session.user.id,
      escalationLevel: escalationLevel || 1,
      status: "open",
    },
    include: {
      rule: true,
      triggeredFor: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(escalation, { status: 201 });
}
