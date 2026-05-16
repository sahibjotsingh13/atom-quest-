// src/app/api/master/employees/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Restrict to manager or admin to prevent general employee list exposure
  if (session.user.role !== "admin" && session.user.role !== "manager") {
    return new Response("Forbidden", { status: 403 });
  }

  const employees = await prisma.user.findMany({
    where: {
      role: "employee",
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeId: true,
      email: true,
      departmentId: true,
      department: {
        select: { name: true },
      },
    },
    orderBy: { firstName: "asc" },
  });
  
  return Response.json(employees);
}
