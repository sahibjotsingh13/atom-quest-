import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupMasterSheet() {
  const MASTER_UUID = "00000000-0000-0000-0000-000000000000";

  try {
    // 1. Create a System User if not exists
    let systemUser = await prisma.user.findUnique({
      where: { email: "system@atomberg.com" },
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          id: "system-user-id", // Custom ID or random
          email: "system@atomberg.com",
          employeeId: "SYSTEM",
          firstName: "System",
          lastName: "Administrator",
          role: "admin",
          isActive: false, // Not a real login user
        },
      });
      console.log("Created System User");
    }

    // 2. Create a dummy cycle if no cycle exists
    let activeCycle = await prisma.cycle.findFirst({
      where: { status: "active" },
    });

    if (!activeCycle) {
      activeCycle = await prisma.cycle.create({
        data: {
          id: "master-cycle-id",
          name: "System Master Cycle",
          fiscalYear: "2024-25",
          goalSettingStart: new Date(),
          goalSettingEnd: new Date(),
          q1Start: new Date(),
          q1End: new Date(),
          q2Start: new Date(),
          q2End: new Date(),
          q3Start: new Date(),
          q3End: new Date(),
          q4Start: new Date(),
          q4End: new Date(),
          status: "active",
        },
      });
      console.log("Created Master Cycle");
    }

    // 3. Create the Master Goal Sheet
    const masterSheet = await prisma.goalSheet.findUnique({
      where: { id: MASTER_UUID },
    });

    if (!masterSheet) {
      await prisma.goalSheet.create({
        data: {
          id: MASTER_UUID,
          employeeId: systemUser.id,
          cycleId: activeCycle.id,
          status: "locked", // Prevent accidental edits
        },
      });
      console.log("Created Master Goal Sheet with UUID:", MASTER_UUID);
    } else {
      console.log("Master Goal Sheet already exists.");
    }
  } catch (error) {
    console.error("Error setting up master sheet:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupMasterSheet();
