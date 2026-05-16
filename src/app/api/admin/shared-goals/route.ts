// src/app/api/admin/shared-goals/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sharedGoalSchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().optional(),
  thrustAreaId: z.string().uuid(),
  uomTypeId: z.string().uuid(),
  targetValue: z.number().positive().optional(),
  targetDate: z.string().optional(),
  employeeIds: z.array(z.string().uuid()).optional(),
  departmentId: z.string().uuid().optional(),
  weightage: z.number().min(10).max(100),
}).refine(data => data.employeeIds || data.departmentId, {
  message: "Either employeeIds or departmentId must be provided",
  path: ["employeeIds"],
});

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const sharedGoals = await prisma.goal.findMany({
      where: { isShared: true, goalSheetId: "00000000-0000-0000-0000-000000000000" },
      include: {
        thrustArea: true,
        uomType: true,
        childGoals: {
          include: {
            goalSheet: {
              include: {
                employee: {
                  select: { firstName: true, lastName: true, employeeId: true },
                },
              },
            },
          },
        },
      },
    });

    return Response.json(sharedGoals.map(g => ({
      id: g.id,
      title: g.title,
      description: g.description,
      thrustArea: g.thrustArea.name,
      uomType: g.uomType.name,
      targetValue: g.targetValue ? Number(g.targetValue) : undefined,
      targetDate: g.targetDate?.toISOString(),
      weightage: Number(g.weightage),
      recipientCount: g.childGoals.length,
      recipients: g.childGoals.map(cg => ({
        name: `${cg.goalSheet.employee.firstName} ${cg.goalSheet.employee.lastName}`,
        employeeId: cg.goalSheet.employee.employeeId,
      })),
    })));
  } catch (error) {
    console.error("Error fetching shared goals:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = sharedGoalSchema.parse(body);

    // Resolve employee IDs
    let finalEmployeeIds = validated.employeeIds || [];
    if (validated.departmentId) {
      const deptEmployees = await prisma.user.findMany({
        where: { departmentId: validated.departmentId, isActive: true },
        select: { id: true },
      });
      const deptEmpIds = deptEmployees.map(e => e.id);
      // Combine and unique
      finalEmployeeIds = Array.from(new Set([...finalEmployeeIds, ...deptEmpIds]));
    }

    if (finalEmployeeIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active employees found in the target audience" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get active cycle
    const activeCycle = await prisma.cycle.findFirst({
      where: { status: "active" },
    });

    if (!activeCycle) {
      return new Response(
        JSON.stringify({ error: "No active cycle found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create parent goal (Master)
    const parentGoal = await prisma.goal.create({
      data: {
        goalSheetId: "00000000-0000-0000-0000-000000000000",
        thrustAreaId: validated.thrustAreaId,
        title: validated.title,
        description: validated.description,
        uomTypeId: validated.uomTypeId,
        targetValue: validated.targetValue,
        targetDate: validated.targetDate ? new Date(validated.targetDate) : undefined,
        weightage: validated.weightage,
        isShared: true,
      },
    });

    // Push to each employee
    const results = await Promise.all(
      finalEmployeeIds.map(async (empId) => {
        let sheet = await prisma.goalSheet.findFirst({
          where: { employeeId: empId, cycleId: activeCycle.id },
        });

        if (!sheet) {
          sheet = await prisma.goalSheet.create({
            data: {
              employeeId: empId,
              cycleId: activeCycle.id,
              status: "draft",
            },
          });
        }

        if (sheet.status !== "draft" && sheet.status !== "rejected") {
          return { employeeId: empId, status: "skipped", reason: "Sheet is locked/approved" };
        }

        // Check max goals
        const goalCount = await prisma.goal.count({
          where: { goalSheetId: sheet.id },
        });

        if (goalCount >= 8) {
          return { employeeId: empId, status: "skipped", reason: "Max 8 goals reached" };
        }

        // Check weightage
        const currentTotal = await prisma.goal.aggregate({
          where: { goalSheetId: sheet.id },
          _sum: { weightage: true },
        });

        const newTotal = Number(currentTotal._sum.weightage || 0) + validated.weightage;
        if (newTotal > 100) {
          return { employeeId: empId, status: "skipped", reason: "Cumulative weightage would exceed 100%" };
        }

        await prisma.goal.create({
          data: {
            goalSheetId: sheet.id,
            thrustAreaId: validated.thrustAreaId,
            title: validated.title,
            description: validated.description,
            uomTypeId: validated.uomTypeId,
            targetValue: validated.targetValue,
            targetDate: validated.targetDate ? new Date(validated.targetDate) : undefined,
            weightage: validated.weightage,
            isShared: true,
            parentGoalId: parentGoal.id,
            sharedById: session.user.id,
          },
        });

        await prisma.goalSheet.update({
          where: { id: sheet.id },
          data: { totalWeightage: newTotal },
        });

        return { employeeId: empId, status: "success" };
      })
    );

    const successCount = results.filter(r => r.status === "success").length;
    const skipCount = results.filter(r => r.status === "skipped").length;

    return Response.json({
      parentGoalId: parentGoal.id,
      totalRecipients: finalEmployeeIds.length,
      successCount,
      skipCount,
      details: results,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Error creating shared goal:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
