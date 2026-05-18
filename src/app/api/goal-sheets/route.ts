import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SheetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const cycleId = searchParams.get("cycleId");
  const status = searchParams.get("status");

  const where: any = {};
  if (employeeId) where.employeeId = employeeId;
  if (cycleId) where.cycleId = cycleId;
  if (status) where.status = status;

  if (session.user.role === "employee") {
    where.employeeId = session.user.id;
  } else if (session.user.role === "manager") {
    const reports = await prisma.user.findMany({
      where: { managerId: session.user.id },
      select: { id: true },
    });
    const reportIds = reports.map((r) => r.id);
    if (employeeId) {
      if (!reportIds.includes(employeeId) && employeeId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      where.employeeId = { in: [...reportIds, session.user.id] };
    }
  }

  const sheets = await prisma.goalSheet.findMany({
    where,
    include: {
      employee: { select: { firstName: true, lastName: true, email: true, employeeId: true } },
      cycle: true,
      approvedBy: { select: { firstName: true, lastName: true } },
      goals: { include: { thrustArea: true, uomType: true, checkIns: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sheets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { employeeId, cycleId } = body;

  if (session.user.role === "employee" && employeeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.goalSheet.findUnique({
    where: { employeeId_cycleId: { employeeId, cycleId } },
  });
  if (existing) return NextResponse.json({ error: "Goal sheet already exists for this cycle" }, { status: 409 });

  const sheet = await prisma.goalSheet.create({
    data: { employeeId, cycleId, status: SheetStatus.draft, totalWeightage: 0 },
    include: { employee: true, cycle: true },
  });

  return NextResponse.json(sheet, { status: 201 });
}
