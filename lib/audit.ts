import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAudit(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
}
