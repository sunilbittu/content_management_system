import { requireSession } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, permissions } = await requireSession();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar permissions={permissions} />
      <div className="flex flex-1 flex-col">
        <Topbar email={user.email} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
