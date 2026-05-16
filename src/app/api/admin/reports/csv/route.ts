// src/app/api/admin/reports/csv/route.ts
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
    const cycleId = searchParams.get("cycleId");

    // Using raw SQL optimized for PascalCase/camelCase schema
    const data = await prisma.$queryRaw`
      SELECT 
        u."employeeId" as emp_id,
        u."firstName" || ' ' || u."lastName" as employee_name,
        d.name as department,
        g.title as goal,
        g."targetValue" as target,
        g."actualValue" as actual,
        g."progressScore" as score,
        g.weightage
      FROM "GoalSheet" gs
      JOIN "User" u ON gs."employeeId" = u.id
      LEFT JOIN "Department" d ON u."departmentId" = d.id
      JOIN "Goal" g ON g."goalSheetId" = gs.id
      WHERE gs."cycleId" = ${cycleId || ''}::uuid
      ORDER BY d.name, u."lastName"
    `;

    const dataArray = data as any[];
    if (dataArray.length === 0) {
      return new Response("No data found for this cycle", { status: 404 });
    }

    const headers = Object.keys(dataArray[0]);
    const csv = [
      headers.join(','),
      ...dataArray.map((row: any) => 
        headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="report_${cycleId}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating CSV:", error);
    return new Response("Failed to generate CSV", { status: 500 });
  }
}
