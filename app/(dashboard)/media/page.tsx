import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { MediaUploadForm } from "@/components/media-upload-form";
import { updateAltText, deleteMedia } from "./actions";
import type { MediaAsset, Store } from "@/lib/types";

export default async function MediaPage() {
  const { supabase, permissions } = await requireSession();

  const [{ data: assets }, { data: stores }] = await Promise.all([
    supabase.from("media_assets").select("*").order("created_at", { ascending: false }).returns<MediaAsset[]>(),
    supabase.from("stores").select("*").order("name").returns<Store[]>(),
  ]);

  const canUpload = can(permissions, "media:upload");
  const canUpdate = can(permissions, "media:update");
  const canDelete = can(permissions, "media:delete");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Media Library</h1>
        <p className="mt-1 text-sm text-neutral-500">Images and files used across your content.</p>
      </div>

      {canUpload && <MediaUploadForm stores={stores ?? []} />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(assets ?? []).map((asset) => (
          <div key={asset.id} className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {asset.mime_type?.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.file_url ?? ""} alt={asset.alt_text ?? ""} className="h-32 w-full object-cover" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-neutral-100 text-xs text-neutral-500">
                {asset.mime_type ?? "file"}
              </div>
            )}

            <div className="flex flex-1 flex-col gap-2 p-3">
              {canUpdate ? (
                <form action={updateAltText} className="flex flex-col gap-1">
                  <input type="hidden" name="id" value={asset.id} />
                  <input
                    name="alt_text"
                    defaultValue={asset.alt_text ?? ""}
                    placeholder="Alt text"
                    className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                  />
                  <button className="w-fit text-xs font-medium text-neutral-500 underline hover:text-neutral-900">
                    Save
                  </button>
                </form>
              ) : (
                <p className="text-xs text-neutral-500">{asset.alt_text || "No alt text"}</p>
              )}

              {canDelete && (
                <form action={deleteMedia}>
                  <input type="hidden" name="id" value={asset.id} />
                  <input type="hidden" name="file_path" value={asset.file_path} />
                  <button className="text-xs font-medium text-red-600 underline hover:text-red-800">Delete</button>
                </form>
              )}
            </div>
          </div>
        ))}

        {(assets ?? []).length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-neutral-400">No media uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
