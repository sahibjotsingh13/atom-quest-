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


  // Create UoM Types
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

  // Create Departments
  const salesDept = await prisma.department.create({
    data: { name: "Sales", code: "SALES" },
  });
  const engDept = await prisma.department.create({
    data: { name: "Engineering", code: "ENG" },
  });
  const hrDept = await prisma.department.create({
    data: { name: "Human Resources", code: "HR" },
  });

  // Create Thrust Areas
  await prisma.thrustArea.createMany({
    data: [
      { name: "Revenue Growth", departmentId: salesDept.id },
      { name: "Customer Satisfaction", departmentId: salesDept.id },
      { name: "Product Innovation", departmentId: engDept.id },
      { name: "Team Development", departmentId: hrDept.id },
      { name: "Operational Excellence" },
    ],
  });

  // Create Cycle (FY 2025-26)
  const cycle = await prisma.cycle.create({
    data: {
      name: "FY 2025-26",
      fiscalYear: "2025-26",
      goalSettingStart: new Date("2025-05-01"),
      goalSettingEnd: new Date("2025-05-31"),
      q1Start: new Date("2025-07-01"),
      q1End: new Date("2025-07-31"),
      q2Start: new Date("2025-10-01"),
      q2End: new Date("2025-10-31"),
      q3Start: new Date("2026-01-01"),
      q3End: new Date("2026-01-31"),
      q4Start: new Date("2026-03-01"),
      q4End: new Date("2026-04-30"),
      status: CycleStatus.active,
    },
  });

  // Create Demo Users
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

  // Create Escalation Rules
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
  console.log("Demo accounts:");
  console.log("  Admin:    admin@demo.com");
  console.log("  Manager:  manager@demo.com");
  console.log("  Employee: employee@demo.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });