import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireSession() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: permissions } = await supabase.rpc("my_permissions");

  return {
    supabase,
    user,
    permissions: (permissions ?? []).map((row: { my_permissions: string } | string) =>
      typeof row === "string" ? row : row.my_permissions,
    ) as string[],
  };
}
