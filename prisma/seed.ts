import { PrismaClient, UserRole, SheetStatus, CycleStatus, Quarter } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config(); // also load .env

const prisma = new PrismaClient();

async function main() {
  // Clean existing data in correct dependency order to prevent foreign key violations
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.escalation.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.checkIn.deleteMany(),
    prisma.goal.deleteMany(),
    prisma.goalSheet.deleteMany(),
    prisma.escalationRule.deleteMany(),
    prisma.cycle.deleteMany(),
    prisma.user.deleteMany(),
    prisma.thrustArea.deleteMany(),
    prisma.department.deleteMany(),
    prisma.uomType.deleteMany(),
  ]);


  // ── UoM Types ────────────────────────────────────────────────────────────
  const uomTypes = await prisma.$transaction([
    prisma.uomType.create({
      data: {
        code: "numeric_min",
        name: "Numeric - Higher is Better",
        description: "Achievement ÷ Target (e.g., Sales Revenue)",
        formulaType: "min",
        displayFormat: "number",
      },
    }),
    prisma.uomType.create({
      data: {
        code: "numeric_max",
        name: "Numeric - Lower is Better",
        description: "Target ÷ Achievement (e.g., TAT, Cost)",
        formulaType: "max",
        displayFormat: "number",
      },
    }),
    prisma.uomType.create({
      data: {
        code: "percentage_min",
        name: "Percentage - Higher is Better",
        description: "Achievement ÷ Target × 100",
        formulaType: "min",
        displayFormat: "percentage",
      },
    }),
    prisma.uomType.create({
      data: {
        code: "percentage_max",
        name: "Percentage - Lower is Better",
        description: "Target ÷ Achievement × 100",
        formulaType: "max",
        displayFormat: "percentage",
      },
    }),
    prisma.uomType.create({
      data: {
        code: "timeline",
        name: "Timeline",
        description: "Completion date vs. Deadline date",
        formulaType: "timeline",
        displayFormat: "date",
      },
    }),
    prisma.uomType.create({
      data: {
        code: "zero",
        name: "Zero-Based",
        description: "Zero = Success (e.g., Safety Incidents)",
        formulaType: "zero",
        displayFormat: "number",
      },
    }),
  ]);

  // ── Departments ──────────────────────────────────────────────────────────
  const salesDept = await prisma.department.create({
    data: { name: "Sales", code: "SALES" },
  });
  const engDept = await prisma.department.create({
    data: { name: "Engineering", code: "ENG" },
  });
  const hrDept = await prisma.department.create({
    data: { name: "Human Resources", code: "HR" },
  });

  // ── Thrust Areas ─────────────────────────────────────────────────────────
  const thrustAreas = await prisma.$transaction([
    prisma.thrustArea.create({ data: { name: "Revenue Growth", departmentId: salesDept.id } }),
    prisma.thrustArea.create({ data: { name: "Customer Satisfaction", departmentId: salesDept.id } }),
    prisma.thrustArea.create({ data: { name: "Product Innovation", departmentId: engDept.id } }),
    prisma.thrustArea.create({ data: { name: "Team Development", departmentId: hrDept.id } }),
    prisma.thrustArea.create({ data: { name: "Operational Excellence" } }),
  ]);

  // ── Cycle (FY 2026-27) — dates span current year so demo is always active ─
  const cycle = await prisma.cycle.create({
    data: {
      name: "FY 2026-27",
      fiscalYear: "2026-27",
      goalSettingStart: new Date("2026-04-01"),
      goalSettingEnd:   new Date("2026-06-30"),
      q1Start: new Date("2026-04-01"),
      q1End:   new Date("2026-06-30"),
      q2Start: new Date("2026-07-01"),
      q2End:   new Date("2026-09-30"),
      q3Start: new Date("2026-10-01"),
      q3End:   new Date("2026-12-31"),
      q4Start: new Date("2027-01-01"),
      q4End:   new Date("2027-03-31"),
      status: CycleStatus.active,
    },
  });

  // ── Demo Users ───────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.com",
      employeeId: "ADM001",
      firstName: "Mike",
      lastName: "Admin",
      role: UserRole.admin,
      departmentId: hrDept.id,
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@demo.com",
      employeeId: "MGR001",
      firstName: "Sarah",
      lastName: "Manager",
      role: UserRole.manager,
      departmentId: salesDept.id,
      isActive: true,
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: "employee@demo.com",
      employeeId: "EMP001",
      firstName: "John",
      lastName: "Employee",
      role: UserRole.employee,
      departmentId: salesDept.id,
      managerId: manager.id,
      isActive: true,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: "jane@demo.com",
      employeeId: "EMP002",
      firstName: "Jane",
      lastName: "Smith",
      role: UserRole.employee,
      departmentId: salesDept.id,
      managerId: manager.id,
      isActive: true,
    },
  });

  // ── Pre-built Demo Goal Sheet for Employee (submitted → manager can test) ─
  const demoSheet = await prisma.goalSheet.create({
    data: {
      employeeId: employee.id,
      cycleId: cycle.id,
      status: SheetStatus.submitted,
      submittedAt: new Date(),
      totalWeightage: 100,
    },
  });

  // Create 4 goals totaling 100% weightage (min 10% each per BRD)
  await prisma.goal.createMany({
    data: [
      {
        goalSheetId: demoSheet.id,
        thrustAreaId: thrustAreas[0].id,   // Revenue Growth
        title: "Achieve ₹5Cr quarterly revenue target",
        description: "Drive sales pipeline to hit quarterly revenue milestone across all product categories.",
        uomTypeId: uomTypes[0].id,         // Numeric - Higher is Better
        targetValue: "5000000",
        weightage: "30",
      },
      {
        goalSheetId: demoSheet.id,
        thrustAreaId: thrustAreas[1].id,   // Customer Satisfaction
        title: "Maintain NPS score ≥ 75",
        description: "Ensure Net Promoter Score stays above 75 through excellent service delivery.",
        uomTypeId: uomTypes[2].id,         // Percentage - Higher is Better
        targetValue: "75",
        weightage: "25",
      },
      {
        goalSheetId: demoSheet.id,
        thrustAreaId: thrustAreas[4].id,   // Operational Excellence
        title: "Reduce order processing TAT to 24hrs",
        description: "Streamline order processing workflow to ensure all orders are fulfilled within 24 hours.",
        uomTypeId: uomTypes[1].id,         // Numeric - Lower is Better
        targetValue: "24",
        weightage: "25",
      },
      {
        goalSheetId: demoSheet.id,
        thrustAreaId: thrustAreas[3].id,   // Team Development
        title: "Complete 4 professional certifications",
        description: "Enroll in and complete at least 4 industry-relevant certifications this fiscal year.",
        uomTypeId: uomTypes[0].id,         // Numeric - Higher is Better
        targetValue: "4",
        weightage: "20",
      },
    ],
  });

  // Notify manager about submitted sheet
  await prisma.notification.create({
    data: {
      userId: manager.id,
      type: "goal_submitted",
      title: "New Goal Sheet Pending Review",
      message: `John Employee (EMP001) has submitted their goal sheet for approval.`,
      deepLink: `/dashboard`,
      metadata: { sheetId: demoSheet.id, employeeId: employee.id },
    },
  });

  // ── Draft Goal Sheet for Employee 2 (Jane) — empty, ready for goal entry ─
  await prisma.goalSheet.create({
    data: {
      employeeId: employee2.id,
      cycleId: cycle.id,
      status: SheetStatus.draft,
      totalWeightage: 0,
    },
  });

  // ── Escalation Rules ────────────────────────────────────────────────────
  await prisma.escalationRule.createMany({
    data: [
      {
        name: "Goal Submission Reminder",
        triggerCondition: "goal_not_submitted",
        daysThreshold: 7,
        escalationLevel: 1,
        notifyRole: "employee",
        templateSubject: "Reminder: Submit your goals",
        templateBody: "Please submit your goals for this cycle.",
      },
      {
        name: "Manager Approval Reminder",
        triggerCondition: "manager_not_approved",
        daysThreshold: 5,
        escalationLevel: 2,
        notifyRole: "manager",
        templateSubject: "Action Required: Approve pending goals",
        templateBody: "You have pending goal sheets to review.",
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("");
  console.log("Demo accounts (password: any value):");
  console.log("  Admin:      admin@demo.com");
  console.log("  Manager:    manager@demo.com");
  console.log("  Employee:   employee@demo.com  → has SUBMITTED goal sheet (manager can approve/reject)");
  console.log("  Employee 2: jane@demo.com      → has DRAFT goal sheet (ready to add goals)");
  console.log("");
  console.log(`Active Cycle: ${cycle.name} (${cycle.fiscalYear})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });