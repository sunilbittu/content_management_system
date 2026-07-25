"use client";

import { useActionState } from "react";
import { assignRole } from "@/app/(dashboard)/users/actions";
import type { ContentType, Role, Store } from "@/lib/types";

export function AssignRoleForm({
  roles,
  stores,
  contentTypes,
}: {
  roles: Role[];
  stores: Store[];
  contentTypes: ContentType[];
}) {
  const [state, formAction, pending] = useActionState(assignRole, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-medium text-neutral-900">Assign a role</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">User email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="person@company.com"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <p className="text-xs text-neutral-400">They must have already signed up.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">Role</label>
          <select name="role_id" required className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">Store scope</label>
          <select name="store_id" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
            <option value="">All stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600">Content type scope</label>
          <select
            name="content_types"
            multiple
            className="h-20 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            {contentTypes.map((ct) => (
              <option key={ct.key} value={ct.key}>
                {ct.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-400">Leave empty for all types.</p>
        </div>
      </div>

      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Assigning…" : "Assign role"}
      </button>
    </form>
  );
}
