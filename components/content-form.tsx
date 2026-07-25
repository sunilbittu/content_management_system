"use client";

import { useActionState } from "react";
import type { ContentEntry, ContentType, Store } from "@/lib/types";

type FormAction = (prevState: { error: string | null }, formData: FormData) => Promise<{ error: string | null }>;

export function ContentForm({
  action,
  contentTypes,
  stores,
  entry,
  canEditType = true,
}: {
  action: FormAction;
  contentTypes: ContentType[];
  stores: Store[];
  entry?: ContentEntry;
  canEditType?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {entry && <input type="hidden" name="id" value={entry.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-neutral-700">Content type</label>
          <select
            name="content_type"
            defaultValue={entry?.content_type ?? contentTypes[0]?.key}
            disabled={!canEditType}
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
          >
            {contentTypes.map((ct) => (
              <option key={ct.key} value={ct.key}>
                {ct.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-neutral-700">Store</label>
          <select
            name="store_id"
            disabled={!canEditType}
            defaultValue={entry?.store_id ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
          >
            <option value="">All stores (global)</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-neutral-700">Title</label>
        <input
          name="title"
          required
          defaultValue={entry?.title}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-neutral-700">Slug</label>
        <input
          name="slug"
          required
          pattern="[a-z0-9-]+"
          title="lowercase letters, numbers and hyphens only"
          defaultValue={entry?.slug}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-neutral-700">
          Content blocks / fields <span className="font-normal text-neutral-400">(JSON)</span>
        </label>
        <textarea
          name="fields_json"
          rows={8}
          defaultValue={JSON.stringify(entry?.fields ?? {}, null, 2)}
          spellCheck={false}
          className="rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs"
        />
      </div>

      <fieldset className="rounded-md border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-medium text-neutral-700">SEO</legend>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">Meta title</label>
            <input
              name="seo_title"
              defaultValue={(entry?.seo?.title as string) ?? ""}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">Meta description</label>
            <textarea
              name="seo_description"
              rows={2}
              defaultValue={(entry?.seo?.description as string) ?? ""}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </fieldset>

      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : entry ? "Save changes" : "Create draft"}
      </button>
    </form>
  );
}
