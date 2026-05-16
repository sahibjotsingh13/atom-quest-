// src/scripts/debug-escalations.ts
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

async function main() {
  try {
    const escalations = await prisma.escalation.findMany({
      include: {
        rule: true,
        triggeredFor: {
          select: { firstName: true, lastName: true, email: true, employeeId: true },
        },
      },
    });
    console.log("Found escalations:", escalations.length);
    if (escalations.length > 0) {
      console.log("First escalation triggered for:", escalations[0].triggeredFor.firstName);
    }
  } catch (error) {
    console.error("Error in debug script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
