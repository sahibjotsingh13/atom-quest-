import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cycleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  fiscalYear: z.string().min(4, "Fiscal year is required"),
  goalSettingStart: z.coerce.date(),
  goalSettingEnd: z.coerce.date(),
  q1Start: z.coerce.date(),
  q1End: z.coerce.date(),
  q2Start: z.coerce.date(),
  q2End: z.coerce.date(),
  q3Start: z.coerce.date(),
  q3End: z.coerce.date(),
  q4Start: z.coerce.date(),
  q4End: z.coerce.date(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const cycles = await prisma.cycle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { goalSheets: true },
        },
      },
    });

    return Response.json(cycles);
  } catch (error) {
    console.error("Error fetching cycles:", error);
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
    const validated = cycleSchema.parse(body);
    const {
      name,
      fiscalYear,
      goalSettingStart,
      goalSettingEnd,
      q1Start,
      q1End,
      q2Start,
      q2End,
      q3Start,
      q3End,
      q4Start,
      q4End,
    } = validated;

    // Validate dates
    const periods = [
      { name: "Goal Setting", start: goalSettingStart, end: goalSettingEnd },
      { name: "Q1", start: q1Start, end: q1End },
      { name: "Q2", start: q2Start, end: q2End },
      { name: "Q3", start: q3Start, end: q3End },
      { name: "Q4", start: q4Start, end: q4End },
    ];

    for (const period of periods) {
      if (period.start >= period.end) {
        return new Response(
          JSON.stringify({ error: `${period.name} start date must be before end date` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Check for overlapping cycles
    const overlapping = await prisma.cycle.findFirst({
      where: {
        OR: [
          {
            goalSettingStart: { lte: new Date(goalSettingEnd) },
            goalSettingEnd: { gte: new Date(goalSettingStart) },
          },
        ],
      },
    });

    if (overlapping) {
      return new Response(
        JSON.stringify({ error: "Cycle dates overlap with existing cycle" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Deactivate existing active cycles
    await prisma.cycle.updateMany({
      where: { status: "active" },
      data: { status: "closed" },
    });

    const cycle = await prisma.cycle.create({
      data: {
        name,
        fiscalYear,
        goalSettingStart: new Date(goalSettingStart),
        goalSettingEnd: new Date(goalSettingEnd),
        q1Start: new Date(q1Start),
        q1End: new Date(q1End),
        q2Start: new Date(q2Start),
        q2End: new Date(q2End),
        q3Start: new Date(q3Start),
        q3End: new Date(q3End),
        q4Start: new Date(q4Start),
        q4End: new Date(q4End),
        status: "active",
      },
    });

    return Response.json(cycle, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Error creating cycle:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
