import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { SchemaNotice } from "@/components/schema-notice";
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

  const [logsResult, profilesResult] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<AuditLog[]>(),
    supabase.from("profiles").select("id, full_name, email").returns<Profile[]>(),
  ]);

  const schemaUnavailable =
    logsResult.error?.code === "PGRST205" || profilesResult.error?.code === "42703";
  const logs = logsResult.data ?? [];
  const profileById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Audit trail"
        description="A durable record of who changed what and when, newest events first."
      />

      {schemaUnavailable ? (
        <SchemaNotice
          area="The audit trail"
          detail="Audit events and user email attribution are not available until the remaining migrations run."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table min-w-[920px]">
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const profile = log.user_id ? profileById.get(log.user_id) : undefined;
                const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

                return (
                  <tr key={log.id}>
                    <td className="data-type whitespace-nowrap text-xs text-[var(--ink-faint)]">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(log.created_at))}
                    </td>
                    <td>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {profile?.full_name || profile?.email?.split("@")[0] || "System"}
                      </p>
                      {profile?.email ? (
                        <p className="mt-1 text-xs text-[var(--ink-faint)]">{profile.email}</p>
                      ) : null}
                    </td>
                    <td>
                      <code className="data-type text-xs font-semibold text-[var(--moss)]">
                        {log.action}
                      </code>
                    </td>
                    <td>
                      <p className="text-sm capitalize text-[var(--ink-soft)]">
                        {log.resource_type.replaceAll("_", " ")}
                      </p>
                      {log.resource_id ? (
                        <p className="data-type mt-1 text-[10px] text-[var(--ink-faint)]">
                          {log.resource_id.slice(0, 8)}
                        </p>
                      ) : null}
                    </td>
                    <td>
                      {hasMetadata ? (
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)]">
                            View details
                          </summary>
                          <pre className="data-type mt-3 max-w-md whitespace-pre-wrap break-words rounded-[5px] bg-[#e9eddf] p-3 text-[10px] leading-5 text-[var(--ink-soft)]">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-xs text-[var(--ink-faint)]">No extra context</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <p className="font-semibold text-[var(--ink)]">No activity recorded yet.</p>
                    <p className="mt-2 text-sm text-[var(--ink-faint)]">
                      Publishing and access changes will appear here.
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
