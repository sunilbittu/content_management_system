export function SchemaNotice({
  area,
  detail,
}: {
  area: string;
  detail?: string;
}) {
  return (
    <section className="surface overflow-hidden" aria-labelledby="schema-notice-title">
      <div className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)]">
        <div className="p-6 md:p-8">
          <h2 id="schema-notice-title" className="display-type text-2xl text-[var(--ink)]">
            Finish the database setup
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
            {area} is ready in the app, but its database objects are not available yet.
            {detail ? ` ${detail}` : ""}
          </p>
        </div>
        <div className="bg-[var(--rail)] p-6 text-[var(--rail-ink)] md:p-8">
          <p className="text-sm font-semibold">Run in Supabase SQL Editor</p>
          <ol className="data-type mt-4 space-y-3 text-xs text-[var(--rail-muted)]">
            <li>
              <span className="mr-3 text-[var(--rail-ink)]">01</span>
              supabase/migrations/0002_content.sql
            </li>
            <li>
              <span className="mr-3 text-[var(--rail-ink)]">02</span>
              supabase/migrations/0003_profiles.sql
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
