import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { AssignRoleForm } from "@/components/assign-role-form";
import { revokeRole } from "./actions";
import type { ContentType, Role, Store, UserRoleAssignment } from "@/lib/types";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default async function UsersPage() {
  const { supabase, permissions } = await requireSession();

  if (!can(permissions, "users:manage")) {
    redirect("/dashboard");
  }

  const [{ data: profiles }, { data: assignments }, { data: roles }, { data: stores }, { data: contentTypes }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, email").order("email").returns<Profile[]>(),
      supabase
        .from("user_roles")
        .select("*, roles(*), stores(*)")
        .order("created_at", { ascending: false })
        .returns<UserRoleAssignment[]>(),
      supabase.from("roles").select("*").order("name").returns<Role[]>(),
      supabase.from("stores").select("*").order("name").returns<Store[]>(),
      supabase.from("content_types").select("*").order("name").returns<ContentType[]>(),
    ]);

  const assignmentsByUser = new Map<string, UserRoleAssignment[]>();
  for (const a of assignments ?? []) {
    const list = assignmentsByUser.get(a.user_id) ?? [];
    list.push(a);
    assignmentsByUser.set(a.user_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Users &amp; Roles</h1>
        <p className="mt-1 text-sm text-neutral-500">Grant roles, optionally scoped to a store or content type.</p>
      </div>

      <AssignRoleForm roles={roles ?? []} stores={stores ?? []} contentTypes={contentTypes ?? []} />

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Roles</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((profile) => (
              <tr key={profile.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-neutral-900">{profile.full_name || "—"}</div>
                  <div className="text-xs text-neutral-400">{profile.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    {(assignmentsByUser.get(profile.id) ?? []).map((a) => (
                      <div key={a.id} className="flex items-center gap-2 text-neutral-700">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium">
                          {a.roles?.name}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {a.stores?.name ?? "all stores"}
                          {a.content_types ? ` · ${a.content_types.join(", ")}` : ""}
                        </span>
                        <form action={revokeRole}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="user_id" value={a.user_id} />
                          <button className="text-xs font-medium text-red-600 underline hover:text-red-800">
                            Revoke
                          </button>
                        </form>
                      </div>
                    ))}
                    {(assignmentsByUser.get(profile.id) ?? []).length === 0 && (
                      <span className="text-xs text-neutral-400">No roles assigned</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(profiles ?? []).length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-neutral-400">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
