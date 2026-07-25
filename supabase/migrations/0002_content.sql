-- ============================================================
--  ECOMMERCE CMS — CONTENT, MEDIA & AUDIT
--  Builds on 0001_rbac.sql. Idempotent: safe to re-run.
-- ============================================================
begin;

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

create table if not exists content_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,            -- 'page' | 'banner' | 'landing_page' | 'blog_post' | ...
  name text not null,
  description text,
  schema_definition jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists content_entries (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,          -- references content_types.key (loose FK: types can be extended by config)
  store_id uuid references stores,     -- null = global / all stores
  locale text default 'en',
  title text not null,
  slug text not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'changes_requested', 'approved', 'scheduled', 'published', 'archived')),
  fields jsonb not null default '{}'::jsonb,   -- current working payload (blocks, seo, etc.)
  seo jsonb not null default '{}'::jsonb,
  publish_at timestamptz,              -- scheduled publish time
  unpublish_at timestamptz,            -- scheduled unpublish time
  published_at timestamptz,
  created_by uuid references auth.users,
  updated_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (store_id, content_type, slug, locale)
);

create index if not exists content_entries_type_idx on content_entries (content_type);
create index if not exists content_entries_status_idx on content_entries (status);
create index if not exists content_entries_store_idx on content_entries (store_id);

create table if not exists content_versions (
  id uuid primary key default gen_random_uuid(),
  content_entry_id uuid references content_entries on delete cascade,
  version_number int not null,
  payload jsonb not null,
  status_at_save text,
  comment text,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  unique (content_entry_id, version_number)
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores,
  file_path text not null,             -- storage object path in the 'media' bucket
  file_url text,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  uploaded_by uuid references auth.users,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  action text not null,                -- e.g. 'content:publish'
  resource_type text not null,         -- e.g. 'content_entry'
  resource_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists audit_logs_created_idx on audit_logs (created_at desc);

-- ------------------------------------------------------------
-- 2. updated_at / versioning triggers
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists content_entries_set_updated_at on content_entries;
create trigger content_entries_set_updated_at
  before update on content_entries
  for each row execute function public.set_updated_at();

-- snapshot a version row every time fields/status changes
create or replace function public.snapshot_content_version()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  next_version int;
begin
  select coalesce(max(version_number), 0) + 1 into next_version
  from content_versions where content_entry_id = new.id;

  insert into content_versions (content_entry_id, version_number, payload, status_at_save, created_by)
  values (
    new.id,
    next_version,
    jsonb_build_object('title', new.title, 'slug', new.slug, 'fields', new.fields, 'seo', new.seo),
    new.status,
    coalesce(new.updated_by, new.created_by)
  );
  return new;
end $$;

drop trigger if exists content_entries_snapshot_insert on content_entries;
create trigger content_entries_snapshot_insert
  after insert on content_entries
  for each row execute function public.snapshot_content_version();

drop trigger if exists content_entries_snapshot_update on content_entries;
create trigger content_entries_snapshot_update
  after update of fields, seo, title, slug, status on content_entries
  for each row execute function public.snapshot_content_version();

-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------
alter table content_types    enable row level security;
alter table content_entries  enable row level security;
alter table content_versions enable row level security;
alter table media_assets     enable row level security;
alter table audit_logs       enable row level security;

-- content_types: reference data, readable by any authenticated user; managed by roles:manage
drop policy if exists "read content_types" on content_types;
create policy "read content_types" on content_types
  for select to authenticated using (true);

drop policy if exists "manage content_types" on content_types;
create policy "manage content_types" on content_types
  for all to authenticated
  using (has_permission(auth.uid(), 'roles:manage'))
  with check (has_permission(auth.uid(), 'roles:manage'));

-- content_entries
drop policy if exists "read content_entries" on content_entries;
create policy "read content_entries" on content_entries
  for select to authenticated
  using (has_permission(auth.uid(), 'content:read', store_id, content_type));

drop policy if exists "insert content_entries" on content_entries;
create policy "insert content_entries" on content_entries
  for insert to authenticated
  with check (has_permission(auth.uid(), 'content:create', store_id, content_type));

drop policy if exists "update content_entries" on content_entries;
create policy "update content_entries" on content_entries
  for update to authenticated
  using (
    has_permission(auth.uid(), 'content:update', store_id, content_type)
    or has_permission(auth.uid(), 'content:publish', store_id, content_type)
    or has_permission(auth.uid(), 'content:unpublish', store_id, content_type)
    or has_permission(auth.uid(), 'content:schedule', store_id, content_type)
  )
  with check (
    has_permission(auth.uid(), 'content:update', store_id, content_type)
    or has_permission(auth.uid(), 'content:publish', store_id, content_type)
    or has_permission(auth.uid(), 'content:unpublish', store_id, content_type)
    or has_permission(auth.uid(), 'content:schedule', store_id, content_type)
  );

drop policy if exists "delete content_entries" on content_entries;
create policy "delete content_entries" on content_entries
  for delete to authenticated
  using (has_permission(auth.uid(), 'content:delete', store_id, content_type));

-- content_versions: follow the parent entry's read/rollback permission
drop policy if exists "read content_versions" on content_versions;
create policy "read content_versions" on content_versions
  for select to authenticated
  using (
    exists (
      select 1 from content_entries ce
      where ce.id = content_entry_id
        and has_permission(auth.uid(), 'content:read', ce.store_id, ce.content_type)
    )
  );

drop policy if exists "insert content_versions" on content_versions;
create policy "insert content_versions" on content_versions
  for insert to authenticated
  with check (
    exists (
      select 1 from content_entries ce
      where ce.id = content_entry_id
        and has_permission(auth.uid(), 'content:update', ce.store_id, ce.content_type)
    )
  );

-- media_assets
drop policy if exists "read media_assets" on media_assets;
create policy "read media_assets" on media_assets
  for select to authenticated
  using (has_permission(auth.uid(), 'media:read', store_id));

drop policy if exists "insert media_assets" on media_assets;
create policy "insert media_assets" on media_assets
  for insert to authenticated
  with check (has_permission(auth.uid(), 'media:upload', store_id));

drop policy if exists "update media_assets" on media_assets;
create policy "update media_assets" on media_assets
  for update to authenticated
  using (has_permission(auth.uid(), 'media:update', store_id))
  with check (has_permission(auth.uid(), 'media:update', store_id));

drop policy if exists "delete media_assets" on media_assets;
create policy "delete media_assets" on media_assets
  for delete to authenticated
  using (has_permission(auth.uid(), 'media:delete', store_id));

-- audit_logs: append-only from the app, readable by audit:read
drop policy if exists "read audit_logs" on audit_logs;
create policy "read audit_logs" on audit_logs
  for select to authenticated
  using (has_permission(auth.uid(), 'audit:read'));

drop policy if exists "insert audit_logs" on audit_logs;
create policy "insert audit_logs" on audit_logs
  for insert to authenticated
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- 4. SEED — default content types
-- ------------------------------------------------------------
insert into content_types (key, name, description) values
  ('page',         'Page',         'General marketing or informational page'),
  ('banner',       'Banner',       'Homepage or category promo banner'),
  ('landing_page', 'Landing Page', 'Campaign landing page with product/category blocks'),
  ('blog_post',    'Blog Post',    'Editorial article'),
  ('faq',          'FAQ',          'Frequently asked question entry')
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- 5. STORAGE — media bucket + policies
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media bucket read" on storage.objects;
create policy "media bucket read" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and has_permission(auth.uid(), 'media:read'));

drop policy if exists "media bucket insert" on storage.objects;
create policy "media bucket insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and has_permission(auth.uid(), 'media:upload'));

drop policy if exists "media bucket update" on storage.objects;
create policy "media bucket update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and has_permission(auth.uid(), 'media:update'));

drop policy if exists "media bucket delete" on storage.objects;
create policy "media bucket delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and has_permission(auth.uid(), 'media:delete'));

commit;
