const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
  } catch (error) {
    console.error("Error in debug script:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
