// src/app/api/admin/analytics/route.ts
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

    if (!cycleId) {
      return new Response(
        JSON.stringify({ error: "Cycle ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Run all analytics queries in parallel for high performance
    // Note: Database uses PascalCase for tables and camelCase for columns
    const [
      qoqTrends,
      departmentBreakdown,
      thrustAreaDistribution,
      managerEffectiveness,
      completionStats,
    ] = await Promise.all([
      // QoQ Trends
      prisma.$queryRaw`
        SELECT 
          quarter,
          AVG("actualAchievement") as avg_achievement,
          COUNT(*) as total_checkins,
          AVG("progressScore") as avg_progress
        FROM "CheckIn"
        WHERE "goalId" IN (
          SELECT id FROM "Goal" 
          WHERE "goalSheetId" IN (
            SELECT id FROM "GoalSheet" WHERE "cycleId" = ${cycleId}::uuid
          )
        )
        GROUP BY quarter
        ORDER BY quarter
      `,

      // Department Breakdown
      prisma.$queryRaw`
        SELECT 
          COALESCE(d.name, 'No Department') as department,
          COUNT(DISTINCT gs.id) as total_sheets,
          AVG(g."progressScore") as avg_progress,
          COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as completed_goals
        FROM "GoalSheet" gs
        JOIN "User" u ON gs."employeeId" = u.id
        LEFT JOIN "Department" d ON u."departmentId" = d.id
        JOIN "Goal" g ON g."goalSheetId" = gs.id
        WHERE gs."cycleId" = ${cycleId}::uuid
        GROUP BY d.name
      `,

      // Thrust Area Distribution
      prisma.$queryRaw`
        SELECT 
          ta.name as thrust_area,
          COUNT(*) as goal_count,
          AVG(g.weightage) as avg_weightage
        FROM "Goal" g
        JOIN "ThrustArea" ta ON g."thrustAreaId" = ta.id
        WHERE g."goalSheetId" IN (
          SELECT id FROM "GoalSheet" WHERE "cycleId" = ${cycleId}::uuid
        )
        GROUP BY ta.name
      `,

      // Manager Effectiveness
      prisma.$queryRaw`
        SELECT 
          m."firstName" || ' ' || m."lastName" as manager,
          COUNT(DISTINCT e.id) as team_size,
          COUNT(DISTINCT CASE WHEN gs.status = 'locked' THEN gs.id END) as approved_sheets,
          COUNT(DISTINCT ci.id) as checkins_completed
        FROM "User" m
        LEFT JOIN "User" e ON e."managerId" = m.id AND e.role = 'employee'
        LEFT JOIN "GoalSheet" gs ON gs."employeeId" = e.id AND gs."cycleId" = ${cycleId}::uuid
        LEFT JOIN "Goal" g ON g."goalSheetId" = gs.id
        LEFT JOIN "CheckIn" ci ON ci."goalId" = g.id
        WHERE m.role = 'manager'
        GROUP BY m.id, m."firstName", m."lastName"
      `,

      // Completion Stats
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT gs.id) as total_sheets,
          COUNT(DISTINCT CASE WHEN gs.status = 'locked' THEN gs.id END) as completed_sheets,
          COUNT(DISTINCT CASE WHEN gs.status = 'submitted' THEN gs.id END) as pending_approval,
          COUNT(DISTINCT CASE WHEN gs.status = 'draft' THEN gs.id END) as draft_sheets
        FROM "GoalSheet" gs
        WHERE gs."cycleId" = ${cycleId}::uuid
      `,
    ]);

    return Response.json({
      qoqTrends,
      departmentBreakdown,
      thrustAreaDistribution,
      managerEffectiveness,
      completionStats: (completionStats as any[])[0],
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
