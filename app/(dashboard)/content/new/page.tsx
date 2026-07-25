import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { ContentForm } from "@/components/content-form";
import { createContent } from "../actions";
import type { ContentType, Store } from "@/lib/types";

export default async function NewContentPage() {
  const { supabase, permissions } = await requireSession();

  if (!can(permissions, "content:create")) {
    redirect("/content");
  }

  const [{ data: contentTypes }, { data: stores }] = await Promise.all([
    supabase.from("content_types").select("*").order("name").returns<ContentType[]>(),
    supabase.from("stores").select("*").order("name").returns<Store[]>(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">New content</h1>
        <p className="mt-1 text-sm text-neutral-500">Starts as a draft — nothing goes live until published.</p>
      </div>

      <div className="max-w-2xl rounded-lg border border-neutral-200 bg-white p-6">
        <ContentForm action={createContent} contentTypes={contentTypes ?? []} stores={stores ?? []} />
      </div>
    </div>
  );
}
