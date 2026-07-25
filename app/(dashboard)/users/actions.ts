"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function assignRole(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleId = String(formData.get("role_id") ?? "");
  const storeId = String(formData.get("store_id") || "") || null;
  const contentTypesRaw = formData.getAll("content_types") as string[];
  const contentTypes = contentTypesRaw.length > 0 ? contentTypesRaw : null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profileError) return { error: profileError.message };
  if (!profile) {
    return { error: `No user found with email "${email}". They need to sign up first.` };
  }

  const { error } = await supabase.from("user_roles").insert({
    user_id: profile.id,
    role_id: roleId,
    store_id: storeId,
    content_types: contentTypes,
    granted_by: user.id,
  });

  if (error) return { error: error.message };

  await logAudit(supabase, user.id, "users:manage", "user_role", profile.id, {
    role_id: roleId,
    store_id: storeId,
    granted_to: email,
  });

  revalidatePath("/users");
  return { error: null };
}

export async function revokeRole(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const targetUserId = String(formData.get("user_id"));

  const { error } = await supabase.from("user_roles").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, user.id, "users:manage", "user_role", targetUserId, { revoked: id });

  revalidatePath("/users");
}
