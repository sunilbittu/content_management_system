import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import type { AuditLog } from "@/lib/types";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default async function AuditLogPage() {
  const { supabase, permissions } = await requireSession();

  if (!can(permissions, "audit:read")) {
    redirect("/dashboard");
  }

  const [{ data: logs }, { data: profiles }] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<AuditLog[]>(),
    supabase.from("profiles").select("id, full_name, email").returns<Profile[]>(),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Audit Log</h1>
        <p className="mt-1 text-sm text-neutral-500">Who changed what, and when. Most recent 200 events.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Resource</th>
              <th className="px-4 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log) => {
              const profile = log.user_id ? profileById.get(log.user_id) : undefined;
              return (
                <tr key={log.id} className="border-b border-neutral-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2 text-neutral-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-neutral-700">{profile?.email ?? profile?.full_name ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-500">
                    {log.resource_type}
                    {log.resource_id ? ` · ${log.resource_id.slice(0, 8)}` : ""}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2 text-xs text-neutral-400">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              );
            })}
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
