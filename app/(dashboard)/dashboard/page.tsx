import Link from "next/link";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { SchemaNotice } from "@/components/schema-notice";

const PIPELINE = [
  { status: "draft", label: "Drafts", cue: "Being written" },
  { status: "in_review", label: "In review", cue: "Needs a decision" },
  { status: "scheduled", label: "Scheduled", cue: "Queued to publish" },
  { status: "published", label: "Published", cue: "Live now" },
] as const;

export default async function DashboardPage() {
  const { supabase, permissions } = await requireSession();
  const canReadContent = can(permissions, "content:read");
  const canCreateContent = can(permissions, "content:create");

  const [contentTypeHealth, statResults] = canReadContent
    ? await Promise.all([
        supabase.from("content_types").select("key").limit(1),
        Promise.all(
          PIPELINE.map(async ({ status }) =>
            supabase
              .from("content_entries")
              .select("id", { count: "exact", head: true })
              .eq("status", status),
          ),
        ),
      ])
    : [{ error: null }, []];
  const schemaUnavailable =
    contentTypeHealth.error?.code === "PGRST205" ||
    statResults.some((result) => result.error?.code === "PGRST205");
  const stats = PIPELINE.map((item, index) => ({
    ...item,
    count: statResults[index]?.count ?? 0,
  }));

  const resources = Array.from(
    new Set(permissions.map((permission) => permission.split(":")[0])),
  ).sort();

  return (
    <div className="flex flex-col gap-9">
      <PageHeader
        title="Publishing desk"
        description="The live shape of your content operation, from first draft to storefront."
        action={
          canCreateContent && !schemaUnavailable ? (
            <Link href="/content/new" className="button-primary">
              Create content
            </Link>
          ) : undefined
        }
      />

      {schemaUnavailable ? (
        <SchemaNotice
          area="The publishing dashboard"
          detail="The connected project currently has RBAC only, so content counts cannot be loaded."
        />
      ) : canReadContent ? (
        <section className="surface overflow-hidden" aria-labelledby="pipeline-heading">
          <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <h2 id="pipeline-heading" className="text-sm font-bold text-[var(--ink)]">
              Publishing pipeline
            </h2>
            <p className="text-xs text-[var(--ink-faint)]">Current visible content</p>
          </div>
          <div className="grid grid-cols-2 bg-[#e4e9d9] lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.status}
                className={`min-h-44 bg-[var(--paper)] p-5 sm:p-7 ${
                  index % 2 !== 0 ? "border-l border-[#d8ddcf]" : ""
                } ${index > 1 ? "border-t border-[#d8ddcf] lg:border-t-0" : ""} ${
                  index > 0 ? "lg:border-l lg:border-[#d8ddcf]" : ""
                }`}
              >
                <p className="data-type text-5xl tracking-[-0.025em] text-[var(--ink)]">
                  {String(stat.count).padStart(2, "0")}
                </p>
                <p className="mt-5 text-sm font-bold text-[var(--ink)]">{stat.label}</p>
                <p className="mt-1 text-xs text-[var(--ink-faint)]">{stat.cue}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <section className="surface p-6 sm:p-8" aria-labelledby="next-move-heading">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
            <div>
              <h2 id="next-move-heading" className="display-type text-3xl text-[var(--ink)]">
                Keep the record clean.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
                Draft carefully, send work through review, and use the audit trail when a publishing
                decision needs context.
              </p>
            </div>
            {canReadContent && !schemaUnavailable ? (
              <Link href="/content" className="button-secondary w-full">
                Open content desk
              </Link>
            ) : (
              <p className="text-sm leading-6 text-[var(--ink-faint)]">
                Content tools will appear when database setup is complete.
              </p>
            )}
          </div>
        </section>

        <section className="bg-[var(--rail)] p-6 text-[var(--rail-ink)] sm:p-8" aria-labelledby="access-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="access-heading" className="text-sm font-bold">Your access</h2>
            <span className="data-type text-3xl tracking-[-0.02em]">{permissions.length}</span>
          </div>
          {permissions.length === 0 ? (
            <p className="mt-6 text-sm leading-6 text-[var(--rail-muted)]">
              No roles assigned yet. Ask an administrator to grant you access.
            </p>
          ) : (
            <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-3">
              {resources.map((resource) => (
                <p key={resource} className="text-xs capitalize text-[var(--rail-muted)]">
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-[1px] bg-[#9ead83]" aria-hidden="true" />
                  {resource.replaceAll("_", " ")}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
