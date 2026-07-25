import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { ContentForm } from "@/components/content-form";
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

  const [{ data: entry }, { data: contentTypes }, { data: stores }, { data: versions }] = await Promise.all([
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

  if (!entry) notFound();

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{entry.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {entry.content_type} · status: <span className="font-medium">{entry.status}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-lg border border-neutral-200 bg-white p-6">
          {canUpdate ? (
            <ContentForm action={updateContent} contentTypes={contentTypes ?? []} stores={stores ?? []} entry={entry} canEditType={false} />
          ) : (
            <p className="text-sm text-neutral-500">You have read-only access to this content.</p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-sm font-medium text-neutral-900">Publishing</h2>
            <div className="mt-3 flex flex-col gap-2">
              {entry.status === "draft" && canUpdate && (
                <form action={submitForReviewWithId}>
                  <button className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                    Submit for review
                  </button>
                </form>
              )}

              {canPublish && entry.status !== "published" && (
                <form action={publishContentWithId}>
                  <button className="w-full rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                    Publish now
                  </button>
                </form>
              )}

              {canUnpublish && entry.status === "published" && (
                <form action={unpublishContentWithId}>
                  <button className="w-full rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
                    Unpublish
                  </button>
                </form>
              )}

              {canSchedule && entry.status !== "published" && (
                <form action={scheduleContentWithId} className="flex flex-col gap-2 border-t border-neutral-100 pt-2">
                  <label className="text-xs font-medium text-neutral-600">Schedule publish</label>
                  <input
                    type="datetime-local"
                    name="publish_at"
                    required
                    className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  />
                  <button className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                    Schedule
                  </button>
                </form>
              )}

              {entry.publish_at && entry.status === "scheduled" && (
                <p className="text-xs text-neutral-500">
                  Scheduled for {new Date(entry.publish_at).toLocaleString()}
                </p>
              )}
              {entry.published_at && (
                <p className="text-xs text-neutral-500">
                  Published {new Date(entry.published_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-sm font-medium text-neutral-900">Version history</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {(versions ?? []).map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">
                    v{v.version_number} · {new Date(v.created_at).toLocaleDateString()}
                  </span>
                  {canRollback && v.version_number !== versions![0].version_number && (
                    <form action={rollbackContent}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="version_id" value={v.id} />
                      <button className="text-xs font-medium text-neutral-500 underline hover:text-neutral-900">
                        Restore
                      </button>
                    </form>
                  )}
                </li>
              ))}
              {(versions ?? []).length === 0 && <li className="text-sm text-neutral-400">No versions yet.</li>}
            </ul>
          </div>

          {canDelete && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h2 className="text-sm font-medium text-red-800">Danger zone</h2>
              <form action={deleteContent} className="mt-3">
                <input type="hidden" name="id" value={entry.id} />
                <button className="w-full rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100">
                  Delete permanently
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
