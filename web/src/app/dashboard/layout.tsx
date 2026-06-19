import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar email={user.email} />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">{children}</div>
    </div>
  );
}
