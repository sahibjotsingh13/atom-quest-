// src/app/api/master/uom-types/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  const uomTypes = await prisma.uomType.findMany({
    orderBy: { name: "asc" },
  });
  return Response.json(uomTypes);
}
