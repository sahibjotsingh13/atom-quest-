import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const departmentId = searchParams.get("departmentId");
  const managerId = searchParams.get("managerId");

  const where: any = { isActive: true };
  if (role) where.role = role;
  if (departmentId) where.departmentId = departmentId;
  if (managerId) where.managerId = managerId;

  const users = await prisma.user.findMany({
    where,
    include: {
      department: true,
      manager: { select: { firstName: true, lastName: true } },
      reports: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { firstName: "asc" },
  });

  return NextResponse.json(users);
}
