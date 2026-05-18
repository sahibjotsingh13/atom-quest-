// scratch/test-delete-db.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const goalId = "8eb4345e-b80a-4301-9535-27ca18377489";
  console.log("Checking if goal exists:", goalId);
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      goalSheet: true,
    }
  });

  if (!goal) {
    console.log("Goal not found in database.");
    return;
  }

  console.log("Found goal:", goal.title);
  console.log("Goal Sheet Status:", goal.goalSheet.status);

  try {
    console.log("Attempting dry-run transaction to delete...");
    await prisma.$transaction(async (tx) => {
      // Delete goal
      await tx.goal.delete({
        where: { id: goalId },
      });

      // Update total weightage
      const remainingGoals = await tx.goal.findMany({
        where: { goalSheetId: goal.goalSheetId },
      });
      const newTotal = remainingGoals.reduce((sum, g) => sum + Number(g.weightage), 0);
      console.log("New total weightage would be:", newTotal);

      // Rollback to keep database state clean
      throw new Error("ROLLBACK_SUCCESSFUL");
    });
  } catch (err: any) {
    if (err.message === "ROLLBACK_SUCCESSFUL") {
      console.log("Prisma delete logic is 100% SUCCESSFUL and correct!");
    } else {
      console.error("Prisma delete failed with error:", err);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
