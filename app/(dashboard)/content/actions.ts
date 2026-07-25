"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

function fieldsFromForm(formData: FormData) {
  const raw = String(formData.get("fields_json") ?? "{}");
  try {
    const value: unknown = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { value: null, error: "Content fields must be a JSON object." };
    }
    return { value: value as Record<string, unknown>, error: null };
  } catch {
    return { value: null, error: "Content fields contain invalid JSON. Check commas, quotes, and brackets." };
  }
}

function seoFromForm(formData: FormData) {
  return {
    title: String(formData.get("seo_title") ?? ""),
    description: String(formData.get("seo_description") ?? ""),
  };
}

export async function createContent(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const content_type = String(formData.get("content_type"));
  const store_id = String(formData.get("store_id") || "") || null;
  const title = String(formData.get("title"));
  const slug = String(formData.get("slug"));
  const fields = fieldsFromForm(formData);

  if (fields.error) {
    return { error: fields.error };
  }

  const { data, error } = await supabase
    .from("content_entries")
    .insert({
      content_type,
      store_id,
      title,
      slug,
      fields: fields.value,
      seo: seoFromForm(formData),
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAudit(supabase, user.id, "content:create", "content_entry", data.id, { title, content_type });

  revalidatePath("/content");
  redirect(`/content/${data.id}`);
}

export async function updateContent(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const title = String(formData.get("title"));
  const slug = String(formData.get("slug"));
  const fields = fieldsFromForm(formData);

  if (fields.error) {
    return { error: fields.error };
  }

  const { error } = await supabase
    .from("content_entries")
    .update({
      title,
      slug,
      fields: fields.value,
      seo: seoFromForm(formData),
      updated_by: user.id,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await logAudit(supabase, user.id, "content:update", "content_entry", id, { title });

  revalidatePath(`/content/${id}`);
  revalidatePath("/content");
  return { error: null };
}

async function transitionStatus(
  id: string,
  status: string,
  extra: Record<string, unknown> = {},
  action = `content:${status}`,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("content_entries")
    .update({ status, updated_by: user.id, ...extra })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, action, "content_entry", id, { status });

  revalidatePath(`/content/${id}`);
  revalidatePath("/content");
}

export async function publishContent(id: string) {
  await transitionStatus(id, "published", { published_at: new Date().toISOString(), publish_at: null });
}

export async function unpublishContent(id: string) {
  await transitionStatus(id, "archived", { unpublish_at: null });
}

export async function scheduleContent(id: string, formData: FormData) {
  const publishAt = String(formData.get("publish_at"));
  await transitionStatus(id, "scheduled", { publish_at: publishAt }, "content:schedule");
}

export async function submitForReview(id: string) {
  await transitionStatus(id, "in_review");
}

export async function deleteContent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const { error } = await supabase.from("content_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "content:delete", "content_entry", id);

  revalidatePath("/content");
  redirect("/content");
}

export async function rollbackContent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const versionId = String(formData.get("version_id"));

  const { data: version, error: versionError } = await supabase
    .from("content_versions")
    .select("payload")
    .eq("id", versionId)
    .single();

  if (versionError || !version) throw new Error(versionError?.message ?? "Version not found");

  const payload = version.payload as { title: string; slug: string; fields: object; seo: object };

  const { error } = await supabase
    .from("content_entries")
    .update({
      title: payload.title,
      slug: payload.slug,
      fields: payload.fields,
      seo: payload.seo,
      updated_by: user.id,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "content:rollback", "content_entry", id, { version_id: versionId });

  revalidatePath(`/content/${id}`);
}
