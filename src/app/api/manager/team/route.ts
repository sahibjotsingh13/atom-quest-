// src/app/api/manager/team/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "manager") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    // Get all direct reports
    const reports = await prisma.user.findMany({
      where: {
        managerId: session.user.id,
        role: "employee",
        isActive: true,
      },
      include: {
        goalSheets: {
          where: {
            cycle: {
              status: "active",
            },
          },
          include: {
            goals: true,
            cycle: true,
          },
          take: 1,
        },
        _count: {
          select: {
            goalSheets: true,
          },
        },
      },
      orderBy: {
        firstName: "asc",
      },
    });

    // Calculate metrics for each report
    const teamData = reports.map((report) => {
      const sheet = report.goalSheets[0];
      const goals = sheet?.goals || [];
      
      const avgProgress = goals.length > 0
        ? goals.reduce((sum, g) => sum + (Number(g.progressScore) || 0), 0) / goals.length
        : 0;

      // Count completed check-ins
      const completedCheckins = goals.reduce((count, goal) => {
        const quarters = ["q1", "q2", "q3", "q4"];
        return count + quarters.filter((q) => goal[`${q.toLowerCase()}Actual` as keyof typeof goal] !== null && goal[`${q.toLowerCase()}Actual` as keyof typeof goal] !== undefined).length;
      }, 0);

      const totalPossibleCheckins = goals.length * 4;

      return {
        id: report.id,
        firstName: report.firstName,
        lastName: report.lastName,
        email: report.email,
        employeeId: report.employeeId,
        sheetId: sheet?.id,
        sheetStatus: (sheet?.status as string) || "no_sheet",
        goalCount: goals.length,
        totalWeightage: Number(sheet?.totalWeightage) || 0,
        avgProgress: Math.round(avgProgress * 100) / 100,
        checkinRate: totalPossibleCheckins > 0 
          ? Math.round((completedCheckins / totalPossibleCheckins) * 100) 
          : 0,
        submittedAt: sheet?.submittedAt,
      };
    });

    // Calculate team summary
    const summary = {
      totalMembers: reports.length,
      pendingApprovals: teamData.filter((t) => t.sheetStatus === "submitted").length,
      approvedSheets: teamData.filter((t) => t.sheetStatus === "locked" || t.sheetStatus === "approved").length,
      draftSheets: teamData.filter((t) => t.sheetStatus === "draft").length,
      noSheets: teamData.filter((t) => t.sheetStatus === "no_sheet").length,
      avgTeamProgress: teamData.length > 0
        ? Math.round((teamData.reduce((sum, t) => sum + t.avgProgress, 0) / teamData.length) * 100) / 100
        : 0,
    };

    return Response.json({ members: teamData, summary });
  } catch (error) {
    console.error("Error fetching team:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
