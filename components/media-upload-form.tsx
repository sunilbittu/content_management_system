"use client";

import { useActionState } from "react";
import { uploadMedia } from "@/app/(dashboard)/media/actions";
import type { Store } from "@/lib/types";

export function MediaUploadForm({ stores }: { stores: Store[] }) {
  const [state, formAction, pending] = useActionState(uploadMedia, { error: null });

  return (
    <form
      action={formAction}
      className="surface grid gap-5 p-5 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end"
    >
      <div>
        <label htmlFor="media-file" className="field-label">File</label>
        <input
          id="media-file"
          type="file"
          name="file"
          required
          className="block min-h-10 w-full text-sm text-[var(--ink-soft)] file:mr-3 file:cursor-pointer file:rounded-[4px] file:border file:border-[var(--line-strong)] file:bg-[var(--paper-strong)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--ink)] hover:file:bg-[#edf0e5]"
        />
      </div>

      <div>
        <label htmlFor="media-alt" className="field-label">Alt text</label>
        <input id="media-alt" name="alt_text" className="field" placeholder="Describe the image" />
      </div>

      <div>
        <label htmlFor="media-store" className="field-label">Storefront</label>
        <select id="media-store" name="store_id" className="field">
          <option value="">All storefronts</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="button-primary"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>

      {state.error && (
        <p className="error-note md:col-span-full" role="alert" aria-live="polite">{state.error}</p>
      )}
    </form>
  );
}
