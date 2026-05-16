// src/app/api/master/thrust-areas/route.ts
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const thrustAreas = await prisma.thrustArea.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return Response.json(thrustAreas);
}
