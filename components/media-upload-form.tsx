"use client";

import { useActionState, useRef } from "react";
import { uploadMedia } from "@/app/(dashboard)/media/actions";
import type { Store } from "@/lib/types";

export function MediaUploadForm({ stores }: { stores: Store[] }) {
  const [state, formAction, pending] = useActionState(uploadMedia, { error: null });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-600">File</label>
        <input type="file" name="file" required className="text-sm" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-600">Alt text</label>
        <input name="alt_text" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-600">Store</label>
        <select name="store_id" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
          <option value="">All stores</option>
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
        className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>

      {state.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
