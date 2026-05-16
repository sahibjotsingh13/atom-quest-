// src/app/api/admin/reports/route.ts
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
    const format = searchParams.get("format") || "xlsx"; // xlsx or csv

    if (!cycleId) {
      return new Response(
        JSON.stringify({ error: "Cycle ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Using raw SQL for efficient reporting across large datasets
    // Note: Database uses PascalCase for tables and camelCase for columns
    const data = await prisma.$queryRawUnsafe(`
      SELECT 
        u."employeeId" as "Employee ID",
        u."firstName" || ' ' || u."lastName" as "Employee Name",
        d.name as "Department",
        m."firstName" || ' ' || m."lastName" as "Manager",
        g.title as "Goal Title",
        ta.name as "Thrust Area",
        ut.name as "UoM Type",
        ut.code as "UoM Code",
        g."targetValue" as "Planned Target",
        g."actualValue" as "Actual Achievement",
        g."progressScore" as "Progress Score",
        g."achievementPercentage" as "Achievement %",
        g.weightage as "Weightage %",
        g.status as "Goal Status",
        g."q1Actual" as "Q1 Actual",
        g."q1Status" as "Q1 Status",
        g."q2Actual" as "Q2 Actual",
        g."q2Status" as "Q2 Status",
        g."q3Actual" as "Q3 Actual",
        g."q3Status" as "Q3 Status",
        g."q4Actual" as "Q4 Actual",
        g."q4Status" as "Q4 Status",
        gs.status as "Sheet Status",
        gs."submittedAt" as "Submitted At",
        gs."approvedAt" as "Approved At"
      FROM "GoalSheet" gs
      JOIN "User" u ON gs."employeeId" = u.id
      LEFT JOIN "Department" d ON u."departmentId" = d.id
      LEFT JOIN "User" m ON u."managerId" = m.id
      JOIN "Goal" g ON g."goalSheetId" = gs.id
      JOIN "ThrustArea" ta ON g."thrustAreaId" = ta.id
      JOIN "UomType" ut ON g."uomTypeId" = ut.id
      WHERE gs."cycleId" = '${cycleId}'::uuid
      ORDER BY d.name, u."lastName", g.title
    `);

    const rows = data as any[];
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    if (format === "csv") {
      const csvRows = [
        headers.join(","),
        ...rows.map(row =>
          headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const str = String(val);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          }).join(",")
        ),
      ];
      const csv = csvRows.join("\n");
      
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="achievement_report_${cycleId}.csv"`,
        },
      });
    }

    // Excel format
    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    // Auto-size columns (simplified)
    const colWidths = headers.map(h => ({ wch: Math.max(h.length, 15) }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Achievement Report");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="achievement_report_${cycleId}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
