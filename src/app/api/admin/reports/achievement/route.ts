// src/app/api/admin/reports/achievement/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get("cycleId");

    if (!cycleId) {
      return new Response("Cycle ID required", { status: 400 });
    }

    // Using raw SQL for efficient reporting
    // Note: Database uses PascalCase for tables and camelCase for columns
    const data = await prisma.$queryRaw`
      SELECT 
        u."employeeId" as "Employee ID",
        u."firstName" || ' ' || u."lastName" as "Employee Name",
        d.name as "Department",
        m."firstName" || ' ' || m."lastName" as "Manager",
        c.name as "Cycle",
        g.title as "Goal Title",
        ta.name as "Thrust Area",
        ut.name as "UoM Type",
        g."targetValue" as "Planned Target",
        g."actualValue" as "Actual Achievement",
        g."achievementPercentage" as "Achievement %",
        g."progressScore" as "Progress Score",
        g.weightage as "Weightage",
        g.status as "Goal Status",
        g."q1Actual" as "Q1 Actual",
        g."q1Status" as "Q1 Status",
        g."q2Actual" as "Q2 Actual",
        g."q2Status" as "Q2 Status",
        g."q3Actual" as "Q3 Actual",
        g."q3Status" as "Q3 Status",
        g."q4Actual" as "Q4 Actual",
        g."q4Status" as "Q4 Status"
      FROM "GoalSheet" gs
      JOIN "User" u ON gs."employeeId" = u.id
      LEFT JOIN "Department" d ON u."departmentId" = d.id
      LEFT JOIN "User" m ON u."managerId" = m.id
      JOIN "Cycle" c ON gs."cycleId" = c.id
      JOIN "Goal" g ON g."goalSheetId" = gs.id
      JOIN "ThrustArea" ta ON g."thrustAreaId" = ta.id
      JOIN "UomType" ut ON g."uomTypeId" = ut.id
      WHERE gs."cycleId" = ${cycleId}::uuid
        AND gs.status = 'locked'
      ORDER BY d.name, u."lastName", g.title
    `;

    const worksheet = XLSX.utils.json_to_sheet(data as any[]);
    
    // Auto-width columns
    const colWidths = (data as any[]).reduce(( widths: number[], row: any) => {
      Object.keys(row).forEach((key, i) => {
        const val = row[key];
        const len = val ? String(val).length : 5;
        widths[i] = Math.max(widths[i] || 0, len);
      });
      return widths;
    }, []);
    worksheet['!cols'] = colWidths.map((w: number) => ({ wch: Math.min(w + 2, 50) }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Achievement Report');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="achievement_report_${cycleId}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response("Failed to generate report", { status: 500 });
  }
}
