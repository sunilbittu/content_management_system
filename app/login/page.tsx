import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Commerce CMS</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to manage your storefront content.</p>

        <div className="mt-6">
          <LoginForm next={next ?? "/dashboard"} />
        </div>
      </div>
    </div>
  );
}
