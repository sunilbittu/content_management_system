# Commerce CMS

A content management system for an eCommerce platform, with scoped role-based
access control (RBAC). Built with Next.js (App Router) and Supabase
(Postgres + Auth + Storage), following the eCommerce CMS + RBAC blueprint.

## Stack

- **Next.js 16** (App Router, Server Actions, TypeScript, Tailwind CSS)
- **Supabase** — Postgres, Auth, Storage, and Row Level Security for
  permission enforcement at the database layer

## Features

- **Content**: draft → review → publish workflow for pages, banners, landing
  pages, blog posts and FAQs, with automatic version history and rollback
- **Media library**: uploads to Supabase Storage with alt text
- **Scoped RBAC**: roles (Super Admin, Content Admin, Editor, Merchandiser,
  Reviewer, SEO Specialist, Viewer) that can be assigned globally or scoped
  to a specific store and/or content type
- **Users & Roles**: assign/revoke roles per user, per store, per content type
- **Audit log**: every mutation is recorded with who/what/when
- Permissions are enforced in two layers: Postgres RLS policies (via the
  `has_permission()` SQL function) and the UI, which hides actions the
  signed-in user isn't allowed to take

## Database setup

1. Create a [Supabase](https://supabase.com) project.
2. Install the project dependencies with `npm install`.
3. Copy the Postgres connection string from **Supabase Dashboard → Connect**
   into `.env.local` as `SUPABASE_DB_URL`. Use the session or direct
   connection string and percent-encode special characters in its password.
4. Preview the pending migrations, then apply them:

   ```bash
   npm run db:migrate:dry-run
   npm run db:migrate
   ```

   The job applies files in `supabase/migrations/` in order:
   - `0001_rbac.sql` — roles, permissions, scoped user_roles, `has_permission()`
   - `0002_content.sql` — content types/entries/versions, media assets,
     audit log, storage bucket
   - `0003_profiles.sql` — adds `email` to `profiles` so the admin UI can
     look users up and list them
5. Bootstrap your own account as `super_admin`: sign up once through the app
   (or Supabase Auth), then run the commented block at the bottom of
   `0001_rbac.sql` with your email.

The Supabase CLI records applied versions in
`supabase_migrations.schema_migrations`, so subsequent runs skip migrations
that are already tracked. `npm run db:migrate:local` applies pending files to
an already-running local Supabase database.

## App setup

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# and SUPABASE_DB_URL from your Supabase project settings

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
`/login`; sign in with a Supabase Auth user that has a role assigned.

## Deploying to Vercel

This is a stock Next.js App Router project (Server Actions, no static
export), so it deploys to Vercel with zero extra config:

1. [Import the repo](https://vercel.com/new) — Vercel auto-detects Next.js
   and sets the build/output settings.
2. In the project's **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy. Run the database setup above against your Supabase project
   first (or beforehand) so the app has roles/permissions/content tables
   to talk to.

Since these are `NEXT_PUBLIC_*` variables (safe to expose to the browser —
access control is enforced by Postgres RLS, not by hiding the anon key),
you don't need separate values per environment unless you want preview
deployments to point at a different Supabase project.

## Project layout

```
app/
  login/                 sign in / sign out
  (dashboard)/
    dashboard/           overview + your permissions
    content/             list, create, edit, publish, schedule, rollback
    media/               upload, browse, edit alt text, delete
    users/                assign/revoke scoped roles
    audit/                audit log viewer
lib/
  supabase/              browser/server/middleware Supabase clients
  session.ts             requireSession() — current user + permissions
  permissions.ts         permission key list + can() helper
  types.ts                shared DB row types
supabase/migrations/      SQL schema, RLS policies, RBAC engine, seed data
```

## Extending

- New content types: insert a row into `content_types`, add a permission
  scope for it, and it shows up in the content type selector automatically.
- New roles/permissions: edit the seed section of `0001_rbac.sql` and re-run
  it (idempotent) or add rows directly via the `roles`/`permissions`/
  `role_permissions` tables (requires `roles:manage`).
- New scope dimensions (e.g. brand, channel): add a column to `user_roles`
  and extend `has_permission()` accordingly.
