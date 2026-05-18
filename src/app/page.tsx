import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { EmployeeDashboardHome } from "@/components/dashboard/EmployeeDashboardHome";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user?.role;

  if (role === "admin") {
    return <AdminDashboard />;
  } else if (role === "manager") {
    return <ManagerDashboard />;
  } else {
    // Default to Employee view
    return <EmployeeDashboardHome />;
  }
}
