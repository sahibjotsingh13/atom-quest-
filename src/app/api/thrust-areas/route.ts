import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const areas = await prisma.thrustArea.findMany({
    where: { isActive: true },
    include: { department: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(areas);
}
