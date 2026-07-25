import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main id="main-content" className="login-canvas grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative flex min-h-[46svh] flex-col justify-between overflow-hidden px-6 py-7 text-[var(--rail-ink)] sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true" fill="none">
            <path
              d="M7 7h18v6H13v6h12v6H7V7Z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path d="M13 13 7 19" stroke="#aebd8d" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span className="text-[15px] font-semibold">
            Commerce <span className="font-normal text-[var(--rail-muted)]">CMS</span>
          </span>
        </div>

        <div className="my-12 max-w-2xl lg:my-20">
          <p className="display-type text-[clamp(3rem,6.5vw,6.6rem)] leading-[0.94] tracking-[-0.035em]">
            Publish with
            <br />
            a clear record.
          </p>
          <p className="mt-7 max-w-md text-sm leading-6 text-[var(--rail-muted)]">
            One desk for drafts, reviews, storefront media, and every decision that moves content live.
          </p>
        </div>

        <div className="grid max-w-xl grid-cols-3 gap-5 pb-2 text-xs text-[var(--rail-muted)]">
          <p>
            <span className="data-type mb-1 block text-[10px] text-[#858e7e]">01</span>
            Draft
          </p>
          <p>
            <span className="data-type mb-1 block text-[10px] text-[#858e7e]">02</span>
            Review
          </p>
          <p>
            <span className="data-type mb-1 block text-[10px] text-[#858e7e]">03</span>
            Publish
          </p>
        </div>
      </section>

      <section className="login-panel flex items-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="display-type text-4xl text-[var(--ink)] sm:text-5xl">Sign in</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
            Use your Commerce CMS account to continue to the publishing desk.
          </p>

          <div className="mt-9">
            <LoginForm next={next ?? "/dashboard"} />
          </div>
        </div>
      </section>
    </main>
  );
}
