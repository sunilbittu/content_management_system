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
    <form action={formAction} className="surface p-5 sm:p-7">
      <div>
        <div>
          <h2 className="text-base font-bold text-[var(--ink)]">Assign access</h2>
          <p className="mt-1 text-sm text-[var(--ink-faint)]">The user must already have an account.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="role-email" className="field-label">User email</label>
          <input
            id="role-email"
            name="email"
            type="email"
            required
            placeholder="person@company.com"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="role-id" className="field-label">Role</label>
          <select id="role-id" name="role_id" required className="field">
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="role-store" className="field-label">Storefront scope</label>
          <select id="role-store" name="store_id" className="field">
            <option value="">All storefronts</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="role-content-types" className="field-label">Content type scope</label>
          <select
            id="role-content-types"
            name="content_types"
            multiple
            className="field min-h-28 py-2"
            aria-describedby="content-type-scope-hint"
          >
            {contentTypes.map((ct) => (
              <option key={ct.key} value={ct.key}>
                {ct.name}
              </option>
            ))}
          </select>
          <p id="content-type-scope-hint" className="field-hint">
            Leave empty for all types. Hold Command or Control to select more than one.
          </p>
        </div>
      </div>

      {state.error && <p className="error-note mt-5" role="alert" aria-live="polite">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="button-primary mt-6"
      >
        {pending ? "Assigning…" : "Assign role"}
      </button>
    </form>
  );
}
