import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SheetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: params.id },
    include: {
      employee: { select: { firstName: true, lastName: true, email: true, employeeId: true, managerId: true } },
      cycle: true,
      approvedBy: { select: { firstName: true, lastName: true } },
      lockedBy: { select: { firstName: true, lastName: true } },
      goals: {
        include: { thrustArea: true, uomType: true, checkIns: true, childGoals: true, parentGoal: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = sheet.employeeId === session.user.id;
  const isManager = sheet.employee.managerId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isManager && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(sheet);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, rejectionReason } = body;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: params.id },
    include: { employee: { include: { manager: true } } },
  });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = sheet.employeeId === session.user.id;
  const isManager = sheet.employee.managerId === session.user.id;
  const isAdmin = session.user.role === "admin";

  const updateData: any = {};

  // ── Employee submits (from draft OR after rejection) ─────────────────────
  if (status === "submitted" && isOwner && (sheet.status === "draft" || sheet.status === "rejected")) {
    const goals = await prisma.goal.findMany({ where: { goalSheetId: params.id } });
    const totalWeight = goals.reduce((sum, g) => sum + Number(g.weightage), 0);

    if (goals.length === 0) {
      return NextResponse.json({ error: "You must add at least one goal before submitting." }, { status: 400 });
    }
    if (goals.length > 8) {
      return NextResponse.json({ error: "Maximum 8 goals allowed per goal sheet." }, { status: 400 });
    }
    const underWeighted = goals.find((g) => Number(g.weightage) < 10);
    if (underWeighted) {
      return NextResponse.json({
        error: `Goal "${underWeighted.title}" has ${Number(underWeighted.weightage)}% weightage. Minimum is 10% per goal.`,
      }, { status: 400 });
    }
    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json({ error: `Total weightage must be exactly 100%. Current: ${totalWeight.toFixed(1)}%` }, { status: 400 });
    }

    updateData.status = SheetStatus.submitted;
    updateData.submittedAt = new Date();
    updateData.totalWeightage = totalWeight;
    updateData.rejectionReason = null;

    // Notify manager
    if (sheet.employee.managerId) {
      await prisma.notification.create({
        data: {
          userId: sheet.employee.managerId,
          type: "goal_submitted",
          title: "New Goal Sheet Pending Review",
          message: `${sheet.employee.firstName} ${sheet.employee.lastName} (${sheet.employee.employeeId}) has submitted their goal sheet for approval.`,
          deepLink: `/dashboard`,
          metadata: { sheetId: params.id, employeeId: sheet.employeeId },
        },
      });
    }

  // ── Manager / Admin approves ─────────────────────────────────────────────
  } else if (status === "approved" && (isManager || isAdmin) && sheet.status === "submitted") {
    updateData.status = SheetStatus.approved;
    updateData.approvedAt = new Date();
    updateData.approvedById = session.user.id;

    await prisma.notification.create({
      data: {
        userId: sheet.employeeId,
        type: "goal_approved",
        title: "Goal Sheet Approved! 🎉",
        message: `Your goal sheet has been reviewed and approved. Your goals are now active.`,
        deepLink: `/dashboard`,
        metadata: { sheetId: params.id },
      },
    });

  // ── Manager / Admin rejects ──────────────────────────────────────────────
  } else if (status === "rejected" && (isManager || isAdmin) && sheet.status === "submitted") {
    updateData.status = SheetStatus.rejected;
    updateData.rejectionReason = rejectionReason || "Returned for rework — please review and resubmit.";

    await prisma.notification.create({
      data: {
        userId: sheet.employeeId,
        type: "goal_rejected",
        title: "Goal Sheet Returned for Rework",
        message: rejectionReason
          ? `Your manager returned your goal sheet. Reason: ${rejectionReason}`
          : "Your manager has returned your goal sheet. Please review and resubmit.",
        deepLink: `/dashboard`,
        metadata: { sheetId: params.id },
      },
    });

  // ── Admin locks after approval ───────────────────────────────────────────
  } else if (status === "locked" && isAdmin && sheet.status === "approved") {
    updateData.status = SheetStatus.locked;
    updateData.lockedAt = new Date();
    updateData.lockedById = session.user.id;

    await prisma.notification.create({
      data: {
        userId: sheet.employeeId,
        type: "goal_locked",
        title: "Goal Sheet Locked",
        message: `Your goal sheet has been locked. Quarterly achievement tracking is now active.`,
        deepLink: `/dashboard`,
        metadata: { sheetId: params.id },
      },
    });

  // ── Employee resets to draft after rejection (to edit goals) ────────────
  } else if (status === "draft" && isOwner && sheet.status === "rejected") {
    updateData.status = SheetStatus.draft;
    updateData.submittedAt = null;
    updateData.rejectionReason = null;

  } else {
    return NextResponse.json({ error: "Invalid status transition or insufficient permissions." }, { status: 400 });
  }

  const updated = await prisma.goalSheet.update({
    where: { id: params.id },
    data: updateData,
    include: { employee: true, cycle: true, goals: { include: { thrustArea: true, uomType: true } } },
  });

  return NextResponse.json(updated);
}
