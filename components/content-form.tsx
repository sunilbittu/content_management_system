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
    <form action={formAction} className="flex flex-col gap-7">
      {entry && <input type="hidden" name="id" value={entry.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="content-type" className="field-label">Content type</label>
          <select
            id="content-type"
            name="content_type"
            defaultValue={entry?.content_type ?? contentTypes[0]?.key}
            disabled={!canEditType}
            required
            className="field"
          >
            {contentTypes.map((ct) => (
              <option key={ct.key} value={ct.key}>
                {ct.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="store-id" className="field-label">Storefront</label>
          <select
            id="store-id"
            name="store_id"
            disabled={!canEditType}
            defaultValue={entry?.store_id ?? ""}
            className="field"
          >
            <option value="">All storefronts (global)</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="field-label">Title</label>
        <input
          id="title"
          name="title"
          required
          defaultValue={entry?.title}
          className="field"
          placeholder="Homepage spring campaign"
        />
      </div>

      <div>
        <label htmlFor="slug" className="field-label">URL slug</label>
        <input
          id="slug"
          name="slug"
          required
          pattern="[a-z0-9-]+"
          title="lowercase letters, numbers and hyphens only"
          defaultValue={entry?.slug}
          className="field data-type text-sm"
          placeholder="homepage-spring-campaign"
        />
        <p className="field-hint">Lowercase letters, numbers, and hyphens only.</p>
      </div>

      <div>
        <label htmlFor="fields-json" className="field-label">
          Content fields <span className="font-normal text-[var(--ink-faint)]">(JSON)</span>
        </label>
        <textarea
          id="fields-json"
          name="fields_json"
          rows={10}
          defaultValue={JSON.stringify(entry?.fields ?? {}, null, 2)}
          spellCheck={false}
          className="field data-type resize-y text-xs leading-5"
        />
        <p className="field-hint">Valid JSON is required. Invalid fields are never discarded silently.</p>
      </div>

      <fieldset className="rounded-[7px] bg-[#edf0e5] p-5">
        <legend className="px-1 text-sm font-bold text-[var(--ink)]">Search preview</legend>
        <div className="mt-1 flex flex-col gap-5">
          <div>
            <label htmlFor="seo-title" className="field-label">Meta title</label>
            <input
              id="seo-title"
              name="seo_title"
              defaultValue={(entry?.seo?.title as string) ?? ""}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="seo-description" className="field-label">Meta description</label>
            <textarea
              id="seo-description"
              name="seo_description"
              rows={2}
              defaultValue={(entry?.seo?.description as string) ?? ""}
              className="field resize-y"
            />
          </div>
        </div>
      </fieldset>

      {state.error && <p className="error-note" role="alert" aria-live="polite">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="button-primary w-fit"
      >
        {pending ? "Saving…" : entry ? "Save changes" : "Create draft"}
      </button>
    </form>
  );
}
