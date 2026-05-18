import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cycleId = searchParams.get("cycleId");
  const departmentId = searchParams.get("departmentId");

  const sheetWhere: any = {};
  if (cycleId) sheetWhere.cycleId = cycleId;

  if (session.user.role === "employee") {
    sheetWhere.employeeId = session.user.id;
  } else if (session.user.role === "manager") {
    const reports = await prisma.user.findMany({
      where: { managerId: session.user.id },
      select: { id: true },
    });
    sheetWhere.employeeId = { in: reports.map((r) => r.id) };
  }

  if (departmentId) {
    const deptUsers = await prisma.user.findMany({
      where: { departmentId },
      select: { id: true },
    });
    const userIds = deptUsers.map((u) => u.id);
    if (sheetWhere.employeeId?.in) {
      sheetWhere.employeeId = { in: sheetWhere.employeeId.in.filter((id: string) => userIds.includes(id)) };
    } else {
      sheetWhere.employeeId = { in: userIds };
    }
  }

  const sheets = await prisma.goalSheet.findMany({
    where: sheetWhere,
    include: {
      employee: { select: { firstName: true, lastName: true, department: true } },
      goals: { include: { uomType: true, checkIns: true } },
      cycle: true,
    },
  });

  const totalSheets = sheets.length;
  const approvedSheets = sheets.filter((s) => s.status === "approved" || s.status === "locked").length;
  const submittedSheets = sheets.filter((s) => s.status === "submitted" || s.status === "under_review").length;
  const draftSheets = sheets.filter((s) => s.status === "draft" || s.status === "rejected").length;

  const allGoals = sheets.flatMap((s) => s.goals);
  const totalGoals = allGoals.length;
  const completedGoals = allGoals.filter((g) => g.status === "completed").length;
  const onTrackGoals = allGoals.filter((g) => g.status === "on_track").length;
  const atRiskGoals = allGoals.filter((g) => g.status === "at_risk").length;
  const delayedGoals = allGoals.filter((g) => g.status === "delayed").length;

  const avgProgress =
    totalGoals > 0
      ? allGoals.reduce((sum, g) => sum + (Number(g.progressScore) || 0), 0) / totalGoals
      : 0;

  const deptBreakdown: Record<string, { count: number; avgProgress: number }> = {};
  sheets.forEach((sheet) => {
    const deptName = sheet.employee.department?.name || "Unassigned";
    if (!deptBreakdown[deptName]) deptBreakdown[deptName] = { count: 0, avgProgress: 0 };
    deptBreakdown[deptName].count += 1;
    const sheetProgress =
      sheet.goals.length > 0
        ? sheet.goals.reduce((sum, g) => sum + (Number(g.progressScore) || 0), 0) / sheet.goals.length
        : 0;
    deptBreakdown[deptName].avgProgress += sheetProgress;
  });

  Object.keys(deptBreakdown).forEach((dept) => {
    deptBreakdown[dept].avgProgress =
      Math.round((deptBreakdown[dept].avgProgress / deptBreakdown[dept].count) * 100) / 100;
  });

  const uomBreakdown: Record<string, { count: number; avgScore: number }> = {};
  allGoals.forEach((goal) => {
    const uomName = goal.uomType.name;
    if (!uomBreakdown[uomName]) uomBreakdown[uomName] = { count: 0, avgScore: 0 };
    uomBreakdown[uomName].count += 1;
    uomBreakdown[uomName].avgScore += Number(goal.progressScore) || 0;
  });
  Object.keys(uomBreakdown).forEach((uom) => {
    uomBreakdown[uom].avgScore =
      Math.round((uomBreakdown[uom].avgScore / uomBreakdown[uom].count) * 100) / 100;
  });

  return NextResponse.json({
    summary: {
      totalSheets,
      approvedSheets,
      submittedSheets,
      draftSheets,
      totalGoals,
      completedGoals,
      onTrackGoals,
      atRiskGoals,
      delayedGoals,
      averageProgress: Math.round(avgProgress * 100) / 100,
    },
    departmentBreakdown: deptBreakdown,
    uomBreakdown,
    sheets,
  });
}
