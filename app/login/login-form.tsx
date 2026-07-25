"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="field-label">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          className="field"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="error-note" role="alert" aria-live="polite">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="button-primary mt-1 w-full"
      >
        {pending ? "Signing in…" : "Enter publishing desk"}
      </button>
    </form>
  );
}
