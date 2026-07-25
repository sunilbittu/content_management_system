import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/permissions";
import { ContentForm } from "@/components/content-form";
import { PageHeader } from "@/components/page-header";
import { SchemaNotice } from "@/components/schema-notice";
import { createContent } from "../actions";
import type { ContentType, Store } from "@/lib/types";

export default async function NewContentPage() {
  const { supabase, permissions } = await requireSession();

  if (!can(permissions, "content:create")) {
    redirect("/content");
  }

  const [contentTypesResult, storesResult] = await Promise.all([
    supabase.from("content_types").select("*").order("name").returns<ContentType[]>(),
    supabase.from("stores").select("*").order("name").returns<Store[]>(),
  ]);

  const schemaUnavailable = contentTypesResult.error?.code === "PGRST205";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="New content"
        description="Create the working record first. Nothing goes live until a publisher approves it."
        action={<Link href="/content" className="button-quiet">Back to content</Link>}
      />

      {schemaUnavailable ? (
        <SchemaNotice area="The content editor" />
      ) : (
        <section className="surface max-w-3xl p-5 sm:p-8">
          <ContentForm
            action={createContent}
            contentTypes={contentTypesResult.data ?? []}
            stores={storesResult.data ?? []}
          />
        </section>
      )}
    </div>
  );
}
