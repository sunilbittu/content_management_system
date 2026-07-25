import Link from "next/link";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import type { ContentEntry, ContentType, Store } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  in_review: "bg-amber-100 text-amber-800",
  changes_requested: "bg-orange-100 text-orange-800",
  approved: "bg-blue-100 text-blue-800",
  scheduled: "bg-purple-100 text-purple-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-neutral-200 text-neutral-600",
};

export default async function ContentListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; store?: string }>;
}) {
  const { type, status, store } = await searchParams;
  const { supabase, permissions } = await requireSession();

  let query = supabase
    .from("content_entries")
    .select("*")
    .order("updated_at", { ascending: false });

  if (type) query = query.eq("content_type", type);
  if (status) query = query.eq("status", status);
  if (store) query = query.eq("store_id", store);

  const [{ data: entries }, { data: contentTypes }, { data: stores }] = await Promise.all([
    query.returns<ContentEntry[]>(),
    supabase.from("content_types").select("*").order("name").returns<ContentType[]>(),
    supabase.from("stores").select("*").order("name").returns<Store[]>(),
  ]);

  const storeById = new Map((stores ?? []).map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Content</h1>
          <p className="mt-1 text-sm text-neutral-500">Pages, banners, landing pages and more.</p>
        </div>
        {can(permissions, "content:create") && (
          <Link
            href="/content/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            New content
          </Link>
        )}
      </div>

      <form className="flex flex-wrap gap-3" action="/content">
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="">All types</option>
          {(contentTypes ?? []).map((ct) => (
            <option key={ct.key} value={ct.key}>
              {ct.name}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_STYLES).map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        <select
          name="store"
          defaultValue={store ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        >
          <option value="">All stores</option>
          {(stores ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Store</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).map((entry) => (
              <tr key={entry.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/content/${entry.id}`} className="font-medium text-neutral-900 hover:underline">
                    {entry.title}
                  </Link>
                  <div className="text-xs text-neutral-400">/{entry.slug}</div>
                </td>
                <td className="px-4 py-3 text-neutral-600">{entry.content_type}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {entry.store_id ? (storeById.get(entry.store_id)?.name ?? "—") : "All stores"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[entry.status]}`}
                  >
                    {entry.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(entry.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {(entries ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  No content found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
