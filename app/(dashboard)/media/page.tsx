import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { MediaUploadForm } from "@/components/media-upload-form";
import { PageHeader } from "@/components/page-header";
import { SchemaNotice } from "@/components/schema-notice";
import { ActionButton } from "@/components/action-button";
import { updateAltText, deleteMedia } from "./actions";
import type { MediaAsset, Store } from "@/lib/types";

export default async function MediaPage() {
  const { supabase, permissions } = await requireSession();

  const [assetsResult, storesResult] = await Promise.all([
    supabase
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<MediaAsset[]>(),
    supabase.from("stores").select("*").order("name").returns<Store[]>(),
  ]);

  const canUpload = can(permissions, "media:upload");
  const canUpdate = can(permissions, "media:update");
  const canDelete = can(permissions, "media:delete");
  const schemaUnavailable = assetsResult.error?.code === "PGRST205";
  const assets = assetsResult.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Media library"
        description="The source files behind storefront content, with accessible descriptions kept alongside them."
      />

      {schemaUnavailable ? (
        <SchemaNotice
          area="The media library"
          detail="Media metadata and the storage policies have not been created in the connected project."
        />
      ) : (
        <>
          {canUpload ? <MediaUploadForm stores={storesResult.data ?? []} /> : null}

          <section aria-label="Media assets">
            {assets.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {assets.map((asset) => {
                  const fileName = asset.file_path.split("/").at(-1) ?? "File";
                  const isImage = asset.mime_type?.startsWith("image/");

                  return (
                    <article key={asset.id} className="surface overflow-hidden">
                      <div className="aspect-[4/3] bg-[#e5e9dd]">
                        {isImage && asset.file_url ? (
                          // Supabase Storage URLs are dynamic and not covered by a fixed Next image host.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={asset.file_url}
                            alt={asset.alt_text ?? ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-6 text-center">
                            <p className="data-type break-all text-xs text-[var(--ink-soft)]">
                              {asset.mime_type ?? "Unknown file type"}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <p className="truncate text-sm font-bold text-[var(--ink)]" title={fileName}>
                          {fileName}
                        </p>
                        <p className="data-type mt-1 text-[10px] text-[var(--ink-faint)]">
                          {asset.size_bytes ? `${Math.ceil(asset.size_bytes / 1024)} KB` : "Size unknown"}
                        </p>

                        {canUpdate ? (
                          <form action={updateAltText} className="mt-5">
                            <input type="hidden" name="id" value={asset.id} />
                            <label htmlFor={`alt-${asset.id}`} className="field-label">Alt text</label>
                            <input
                              id={`alt-${asset.id}`}
                              name="alt_text"
                              defaultValue={asset.alt_text ?? ""}
                              placeholder="Describe this asset"
                              className="field text-sm"
                            />
                            <ActionButton pendingLabel="Saving" className="button-quiet mt-2">
                              Save description
                            </ActionButton>
                          </form>
                        ) : (
                          <p className="mt-4 text-xs leading-5 text-[var(--ink-soft)]">
                            {asset.alt_text || "No alt text provided"}
                          </p>
                        )}

                        {canDelete ? (
                          <form action={deleteMedia} className="mt-2">
                            <input type="hidden" name="id" value={asset.id} />
                            <input type="hidden" name="file_path" value={asset.file_path} />
                            <ActionButton
                              pendingLabel="Deleting"
                              className="button-quiet text-[#843d33]"
                              confirmMessage={`Permanently delete ${fileName}?`}
                            >
                              Delete asset
                            </ActionButton>
                          </form>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="surface py-16 text-center">
                <p className="font-semibold text-[var(--ink)]">No media uploaded yet.</p>
                <p className="mt-2 text-sm text-[var(--ink-faint)]">
                  Add the first storefront asset when it is ready.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
