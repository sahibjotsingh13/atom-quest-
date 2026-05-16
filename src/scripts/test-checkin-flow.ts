// src/scripts/test-checkin-flow.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting check-in flow test setup...");

  // 1. Find or create test users
  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: { role: "manager" },
    create: {
      email: "manager@demo.com",
      firstName: "Manoj",
      lastName: "Manager",
      role: "manager",
      employeeId: "MGR001",
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@demo.com" },
    update: { managerId: manager.id, role: "employee" },
    create: {
      email: "employee@demo.com",
      firstName: "Eshwar",
      lastName: "Employee",
      role: "employee",
      employeeId: "EMP001",
      managerId: manager.id,
    },
  });

  // 2. Create Active Cycle
  const now = new Date();
  // Use the existing active cycle and open Q1 window for testing
  const cycle = await prisma.cycle.update({
    where: { id: "0db2b231-ae62-45de-813d-12392b2f68cf" },
    data: {
      q1Start: new Date(now.getTime() - 1000 * 60 * 60 * 24), // Yesterday
      q1End: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30), // Next month
      status: "active",
    },
  });

  // 3. Find Thrust Area and UoM Types
  const thrustArea = await prisma.thrustArea.findFirst();
  const uomStandard = await prisma.uomType.findFirst({ where: { code: "percentage_min" } });
  const uomTimeline = await prisma.uomType.findFirst({ where: { code: "timeline" } });
  const uomZero = await prisma.uomType.findFirst({ where: { code: "zero" } });

  if (!thrustArea || !uomStandard || !uomTimeline || !uomZero) {
    console.error("❌ Missing master data (thrust areas or UoM types). Please run seed first.");
    return;
  }

  // 4. Create Locked Goal Sheet
  const sheet = await prisma.goalSheet.upsert({
    where: { 
      employeeId_cycleId: { 
        employeeId: employee.id, 
        cycleId: cycle.id 
      } 
    },
    update: { status: "locked" },
    create: {
      employeeId: employee.id,
      cycleId: cycle.id,
      status: "locked",
      totalWeightage: "100",
    },
  });

  // 5. Create goals of different types
  await prisma.goal.deleteMany({ where: { goalSheetId: sheet.id } });

  await prisma.goal.createMany({
    data: [
      {
        goalSheetId: sheet.id,
        thrustAreaId: thrustArea.id,
        uomTypeId: uomStandard.id,
        title: "Standard Sales Target",
        targetValue: 100,
        weightage: 40,
        status: "on_track",
      },
      {
        goalSheetId: sheet.id,
        thrustAreaId: thrustArea.id,
        uomTypeId: uomTimeline.id,
        title: "Project Alpha Launch",
        targetDate: new Date("2024-12-31"),
        weightage: 30,
        status: "not_started",
      },
      {
        goalSheetId: sheet.id,
        thrustAreaId: thrustArea.id,
        uomTypeId: uomZero.id,
        title: "Defect Rate Reduction",
        targetValue: 0,
        weightage: 30,
        status: "on_track",
      },
    ],
  });

  console.log("✅ Test setup complete!");
  console.log(`Employee: ${employee.email}`);
  console.log(`Manager: ${manager.email}`);
  console.log(`Cycle: ${cycle.name} (Q1 Open)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
