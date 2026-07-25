import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { ContentForm } from "@/components/content-form";
import { PageHeader } from "@/components/page-header";
import { SchemaNotice } from "@/components/schema-notice";
import { StatusLabel } from "@/components/status-label";
import { ActionButton } from "@/components/action-button";
import {
  updateContent,
  publishContent,
  unpublishContent,
  scheduleContent,
  submitForReview,
  deleteContent,
  rollbackContent,
} from "../actions";
import type { ContentEntry, ContentType, ContentVersion, Store } from "@/lib/types";

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, permissions } = await requireSession();

  const [entryResult, contentTypesResult, storesResult, versionsResult] = await Promise.all([
    supabase.from("content_entries").select("*").eq("id", id).maybeSingle<ContentEntry>(),
    supabase.from("content_types").select("*").order("name").returns<ContentType[]>(),
    supabase.from("stores").select("*").order("name").returns<Store[]>(),
    supabase
      .from("content_versions")
      .select("*")
      .eq("content_entry_id", id)
      .order("version_number", { ascending: false })
      .returns<ContentVersion[]>(),
  ]);

  const schemaUnavailable =
    entryResult.error?.code === "PGRST205" || contentTypesResult.error?.code === "PGRST205";

  if (schemaUnavailable) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Content editor"
          description="Edit the working record and move it through the publishing workflow."
          action={<Link href="/content" className="button-quiet">Back to content</Link>}
        />
        <SchemaNotice area="The content editor" />
      </div>
    );
  }

  const entry = entryResult.data;
  if (!entry) notFound();

  const versions = versionsResult.data ?? [];
  const canUpdate = can(permissions, "content:update");
  const canPublish = can(permissions, "content:publish");
  const canSchedule = can(permissions, "content:schedule");
  const canUnpublish = can(permissions, "content:unpublish");
  const canDelete = can(permissions, "content:delete");
  const canRollback = can(permissions, "content:rollback");

  const publishContentWithId = publishContent.bind(null, entry.id);
  const unpublishContentWithId = unpublishContent.bind(null, entry.id);
  const scheduleContentWithId = scheduleContent.bind(null, entry.id);
  const submitForReviewWithId = submitForReview.bind(null, entry.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={entry.title}
        description={`${entry.content_type.replaceAll("_", " ")} · /${entry.slug}`}
        action={<Link href="/content" className="button-quiet">Back to content</Link>}
      />

      <div className="flex items-center gap-3">
        <StatusLabel status={entry.status} />
        {entry.store_id ? (
          <span className="text-xs text-[var(--ink-faint)]">Scoped storefront content</span>
        ) : (
          <span className="text-xs text-[var(--ink-faint)]">Global content</span>
        )}
      </div>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="surface p-5 sm:p-8">
          {canUpdate ? (
            <ContentForm
              action={updateContent}
              contentTypes={contentTypesResult.data ?? []}
              stores={storesResult.data ?? []}
              entry={entry}
              canEditType={false}
            />
          ) : (
            <div className="py-12 text-center">
              <p className="font-semibold text-[var(--ink)]">Read-only access</p>
              <p className="mt-2 text-sm text-[var(--ink-faint)]">
                Your role can view this record but cannot change it.
              </p>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <section className="surface p-5" aria-labelledby="publishing-heading">
            <h2 id="publishing-heading" className="text-sm font-bold text-[var(--ink)]">Publishing</h2>
            <div className="mt-5 flex flex-col gap-3">
              {entry.status === "draft" && canUpdate ? (
                <form action={submitForReviewWithId}>
                  <ActionButton pendingLabel="Submitting" className="button-secondary w-full">
                    Submit for review
                  </ActionButton>
                </form>
              ) : null}

              {canPublish && entry.status !== "published" ? (
                <form action={publishContentWithId}>
                  <ActionButton
                    pendingLabel="Publishing"
                    className="button-primary w-full"
                    confirmMessage="Publish this content to the storefront now?"
                  >
                    Publish now
                  </ActionButton>
                </form>
              ) : null}

              {canUnpublish && entry.status === "published" ? (
                <form action={unpublishContentWithId}>
                  <ActionButton
                    pendingLabel="Unpublishing"
                    className="button-danger w-full"
                    confirmMessage="Remove this content from the storefront?"
                  >
                    Unpublish
                  </ActionButton>
                </form>
              ) : null}

              {canSchedule && entry.status !== "published" ? (
                <form action={scheduleContentWithId} className="mt-2 rounded-[7px] bg-[#edf0e5] p-4">
                  <label htmlFor="publish-at" className="field-label">Schedule publish</label>
                  <input
                    id="publish-at"
                    type="datetime-local"
                    name="publish_at"
                    required
                    className="field text-sm"
                  />
                  <ActionButton pendingLabel="Scheduling" className="button-secondary mt-3 w-full">
                    Set schedule
                  </ActionButton>
                </form>
              ) : null}

              {entry.publish_at && entry.status === "scheduled" ? (
                <p className="text-xs leading-5 text-[var(--ink-faint)]">
                  Scheduled for {new Date(entry.publish_at).toLocaleString()}
                </p>
              ) : null}
              {entry.published_at ? (
                <p className="text-xs leading-5 text-[var(--ink-faint)]">
                  Published {new Date(entry.published_at).toLocaleString()}
                </p>
              ) : null}
            </div>
          </section>

          <section className="surface p-5" aria-labelledby="history-heading">
            <h2 id="history-heading" className="text-sm font-bold text-[var(--ink)]">Version history</h2>
            <ul className="mt-5 space-y-4">
              {versions.map((version, index) => (
                <li key={version.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="data-type text-xs text-[var(--ink)]">Version {version.version_number}</p>
                    <p className="mt-1 text-xs text-[var(--ink-faint)]">
                      {new Date(version.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {canRollback && index !== 0 ? (
                    <form action={rollbackContent}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="version_id" value={version.id} />
                      <ActionButton
                        pendingLabel="Restoring"
                        className="button-quiet"
                        confirmMessage={`Restore version ${version.version_number}?`}
                      >
                        Restore
                      </ActionButton>
                    </form>
                  ) : null}
                </li>
              ))}
              {versions.length === 0 ? (
                <li className="text-sm text-[var(--ink-faint)]">No saved versions yet.</li>
              ) : null}
            </ul>
          </section>

          {canDelete ? (
            <section className="rounded-[8px] bg-[var(--rust-soft)] p-5" aria-labelledby="danger-heading">
              <h2 id="danger-heading" className="text-sm font-bold text-[#72372e]">Delete record</h2>
              <p className="mt-2 text-xs leading-5 text-[#7b4b43]">
                This permanently removes the content and its history.
              </p>
              <form action={deleteContent} className="mt-4">
                <input type="hidden" name="id" value={entry.id} />
                <ActionButton
                  pendingLabel="Deleting"
                  className="button-danger w-full"
                  confirmMessage="Permanently delete this content and its history?"
                >
                  Delete permanently
                </ActionButton>
              </form>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
