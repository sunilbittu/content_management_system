import { requireSession } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, permissions } = await requireSession();

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar permissions={permissions} />
      <div className="min-w-0 flex flex-1 flex-col">
        <Topbar email={user.email} permissions={permissions} />
        <main id="main-content" className="flex-1 px-4 py-7 sm:px-6 lg:px-9 lg:py-10">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
