import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { AssignRoleForm } from "@/components/assign-role-form";
import { PageHeader } from "@/components/page-header";
import { SchemaNotice } from "@/components/schema-notice";
import { ActionButton } from "@/components/action-button";
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

  const [profilesResult, assignmentsResult, rolesResult, storesResult, contentTypesResult] =
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

  const schemaUnavailable =
    profilesResult.error?.code === "42703" || contentTypesResult.error?.code === "PGRST205";
  const profiles = profilesResult.data ?? [];
  const assignmentsByUser = new Map<string, UserRoleAssignment[]>();

  for (const assignment of assignmentsResult.data ?? []) {
    const list = assignmentsByUser.get(assignment.user_id) ?? [];
    list.push(assignment);
    assignmentsByUser.set(assignment.user_id, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="People and access"
        description="Grant only the role, storefront, and content scope each person needs."
      />

      {schemaUnavailable ? (
        <SchemaNotice
          area="People and access"
          detail="The user directory needs the profile email migration, and scoped roles need content types."
        />
      ) : (
        <>
          <AssignRoleForm
            roles={rolesResult.data ?? []}
            stores={storesResult.data ?? []}
            contentTypes={contentTypesResult.data ?? []}
          />

          <div className="table-shell">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th className="w-[34%]">User</th>
                  <th>Assigned access</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => {
                  const assignments = assignmentsByUser.get(profile.id) ?? [];
                  return (
                    <tr key={profile.id}>
                      <td>
                        <p className="font-bold text-[var(--ink)]">
                          {profile.full_name || profile.email?.split("@")[0] || "Unnamed user"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--ink-faint)]">{profile.email}</p>
                      </td>
                      <td>
                        {assignments.length > 0 ? (
                          <div className="space-y-4">
                            {assignments.map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="text-sm font-bold text-[var(--ink)]">
                                    {assignment.roles?.name ?? "Unknown role"}
                                  </p>
                                  <p className="mt-1 text-xs text-[var(--ink-faint)]">
                                    {assignment.stores?.name ?? "All storefronts"}
                                    {assignment.content_types
                                      ? ` · ${assignment.content_types.join(", ").replaceAll("_", " ")}`
                                      : " · All content types"}
                                  </p>
                                </div>
                                <form action={revokeRole}>
                                  <input type="hidden" name="id" value={assignment.id} />
                                  <input type="hidden" name="user_id" value={assignment.user_id} />
                                  <ActionButton
                                    pendingLabel="Revoking"
                                    className="button-quiet text-[#843d33]"
                                    confirmMessage={`Revoke ${assignment.roles?.name ?? "this role"} from ${profile.email}?`}
                                  >
                                    Revoke
                                  </ActionButton>
                                </form>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--ink-faint)]">No access assigned.</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-16 text-center">
                      <p className="font-semibold text-[var(--ink)]">No user profiles yet.</p>
                      <p className="mt-2 text-sm text-[var(--ink-faint)]">
                        Profiles appear after a user creates an account.
                      </p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
