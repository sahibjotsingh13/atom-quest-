import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "manager") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { reason } = await req.json();

    if (!reason || reason.trim() === "") {
      return new Response(JSON.stringify({ error: "Unlock reason is required" }), { status: 400 });
    }

    const sheet = await prisma.goalSheet.findFirst({
      where: {
        id: params.id,
        employee: {
          managerId: session.user.id,
        },
      },
    });

    if (!sheet) {
      return new Response(JSON.stringify({ error: "Goal sheet not found" }), { status: 404 });
    }

    if (sheet.status !== "approved" && sheet.status !== "locked") {
      return new Response(JSON.stringify({ error: "Can only unlock approved or locked sheets" }), { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.goalSheet.update({
        where: { id: sheet.id },
        data: {
          status: "draft", // Unlocking returns it to draft for the employee to edit
          rejectionReason: reason, // We can store the unlock reason here or in audit logs
        },
      });

      await tx.auditLog.create({
        data: {
          tableName: "GoalSheet",
          recordId: sheet.id,
          action: "UNLOCK",
          changedById: session.user.id,
          changeReason: reason,
          oldValues: { status: sheet.status },
          newValues: { status: "draft" },
        },
      });
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error unlocking sheet:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500 });
  }
}
