import { signOut } from "@/app/login/actions";

export function Topbar({ email }: { email: string | undefined }) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600">{email}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
