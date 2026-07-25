import Link from "next/link";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { SchemaNotice } from "@/components/schema-notice";
import { StatusLabel } from "@/components/status-label";
import type { ContentEntry, ContentStatus, ContentType, Store } from "@/lib/types";

const STATUSES: ContentStatus[] = [
  "draft",
  "in_review",
  "changes_requested",
  "approved",
  "scheduled",
  "published",
  "archived",
];

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

  const [entriesResult, contentTypesResult, storesResult] = await Promise.all([
    query.returns<ContentEntry[]>(),
    supabase.from("content_types").select("*").order("name").returns<ContentType[]>(),
    supabase.from("stores").select("*").order("name").returns<Store[]>(),
  ]);

  const entries = entriesResult.data ?? [];
  const contentTypes = contentTypesResult.data ?? [];
  const stores = storesResult.data ?? [];
  const schemaUnavailable =
    entriesResult.error?.code === "PGRST205" || contentTypesResult.error?.code === "PGRST205";
  const storeById = new Map(stores.map((item) => [item.id, item]));
  const filtersActive = Boolean(type || status || store);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Content"
        description="Plan, review, and publish every storefront story from one record."
        action={
          can(permissions, "content:create") && !schemaUnavailable ? (
            <Link href="/content/new" className="button-primary">
              New content
            </Link>
          ) : undefined
        }
      />

      {schemaUnavailable ? (
        <SchemaNotice
          area="The content desk"
          detail="Content entries and content types are missing from the connected project."
        />
      ) : (
        <>
          <form className="surface grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]" action="/content">
            <div>
              <label htmlFor="content-type-filter" className="field-label">Content type</label>
              <select
                id="content-type-filter"
                name="type"
                defaultValue={type ?? ""}
                className="field"
              >
                <option value="">All types</option>
                {contentTypes.map((contentType) => (
                  <option key={contentType.key} value={contentType.key}>
                    {contentType.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status-filter" className="field-label">Workflow status</label>
              <select
                id="status-filter"
                name="status"
                defaultValue={status ?? ""}
                className="field"
              >
                <option value="">All statuses</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="store-filter" className="field-label">Storefront</label>
              <select
                id="store-filter"
                name="store"
                defaultValue={store ?? ""}
                className="field"
              >
                <option value="">All storefronts</option>
                {stores.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button type="submit" className="button-secondary">Apply</button>
              {filtersActive ? (
                <Link href="/content" className="button-quiet">
                  Clear
                </Link>
              ) : null}
            </div>
          </form>

          <div className="table-shell">
            <table className="data-table min-w-[820px]">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Storefront</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <Link href={`/content/${entry.id}`} className="text-link">
                        {entry.title}
                      </Link>
                      <div className="data-type mt-1 text-[11px] text-[var(--ink-faint)]">
                        /{entry.slug}
                      </div>
                    </td>
                    <td className="capitalize text-[var(--ink-soft)]">
                      {entry.content_type.replaceAll("_", " ")}
                    </td>
                    <td className="text-[var(--ink-soft)]">
                      {entry.store_id ? (storeById.get(entry.store_id)?.name ?? "Unknown") : "All storefronts"}
                    </td>
                    <td><StatusLabel status={entry.status} /></td>
                    <td className="data-type whitespace-nowrap text-xs text-[var(--ink-faint)]">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(entry.updated_at))}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <p className="font-semibold text-[var(--ink)]">
                        {filtersActive ? "Nothing matches these filters." : "No content yet."}
                      </p>
                      <p className="mt-2 text-sm text-[var(--ink-faint)]">
                        {filtersActive ? "Clear the filters to see the full desk." : "Create the first draft when you are ready."}
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
