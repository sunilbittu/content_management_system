import Link from "next/link";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";

export default async function DashboardPage() {
  const { supabase, permissions } = await requireSession();

  const canReadContent = can(permissions, "content:read");

  const stats = canReadContent
    ? await Promise.all(
        (["draft", "in_review", "scheduled", "published"] as const).map(async (status) => {
          const { count } = await supabase
            .from("content_entries")
            .select("id", { count: "exact", head: true })
            .eq("status", status);
          return { status, count: count ?? 0 };
        }),
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Overview of your storefront content and your access.
        </p>
      </div>

      {canReadContent && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.status} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="text-2xl font-semibold text-neutral-900">{s.count}</div>
              <div className="mt-1 text-sm capitalize text-neutral-500">{s.status.replace("_", " ")}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-medium text-neutral-900">Your permissions</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {permissions.length === 0 && (
            <p className="text-sm text-neutral-500">
              No roles assigned yet. Ask an administrator to grant you access.
            </p>
          )}
          {permissions.map((p) => (
            <span
              key={p}
              className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {canReadContent && (
        <Link
          href="/content"
          className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Go to content
        </Link>
      )}
    </div>
  );
}
