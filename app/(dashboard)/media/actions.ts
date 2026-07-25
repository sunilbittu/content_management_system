"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

const BUCKET = "media";

export async function uploadMedia(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const file = formData.get("file") as File | null;
  const altText = String(formData.get("alt_text") ?? "");
  const storeId = String(formData.get("store_id") || "") || null;

  if (!file || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      store_id: storeId,
      file_path: path,
      file_url: publicUrl.publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: altText,
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: error.message };
  }

  await logAudit(supabase, user.id, "media:upload", "media_asset", data.id, { file_path: path });

  revalidatePath("/media");
  return { error: null };
}

export async function updateAltText(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const altText = String(formData.get("alt_text") ?? "");

  const { error } = await supabase.from("media_assets").update({ alt_text: altText }).eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "media:update", "media_asset", id);

  revalidatePath("/media");
}

export async function deleteMedia(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const path = String(formData.get("file_path"));

  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.storage.from(BUCKET).remove([path]);

  await logAudit(supabase, user.id, "media:delete", "media_asset", id);

  revalidatePath("/media");
}
