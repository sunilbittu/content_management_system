-- ============================================================
--  ECOMMERCE CMS — SELF-CONTAINED RBAC (SCHEMA + ENGINE + SEED)
--  Idempotent: safe to re-run. Supabase SQL Editor.
-- ============================================================
begin;

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  is_system boolean default false,
  created_at timestamptz default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  resource text not null,
  action text not null,
  description text
);

create table if not exists role_permissions (
  role_id uuid references roles on delete cascade,
  permission_id uuid references permissions on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  role_id uuid references roles on delete cascade,
  store_id uuid references stores,        -- null = all stores
  content_types text[],                   -- null = all types
  granted_by uuid references auth.users,
  created_at timestamptz default now(),
  unique (user_id, role_id, store_id)
);

-- ------------------------------------------------------------
-- 2. PERMISSION ENGINE
-- ------------------------------------------------------------
-- security definer: reads user_roles without triggering RLS recursion
create or replace function public.has_permission(
  p_user uuid,
  p_permission text,
  p_store uuid default null,
  p_type text default null
)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    where ur.user_id = p_user
      and p.key = p_permission
      and (ur.store_id is null or ur.store_id = p_store)
      and (ur.content_types is null or p_type = any(ur.content_types))
  );
$$;

revoke execute on function public.has_permission(uuid, text, uuid, text) from anon;
grant  execute on function public.has_permission(uuid, text, uuid, text) to authenticated;

-- what the dashboard UI drives its menus/buttons from
create or replace function public.my_permissions()
returns setof text
language sql stable security definer
set search_path = public
as $$
  select distinct p.key
  from user_roles ur
  join role_permissions rp on rp.role_id = ur.role_id
  join permissions p on p.id = rp.permission_id
  where ur.user_id = auth.uid();
$$;

revoke execute on function public.my_permissions() from anon;
grant  execute on function public.my_permissions() to authenticated;

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. RLS — PROTECTING THE RBAC TABLES THEMSELVES
-- ------------------------------------------------------------
alter table stores           enable row level security;
alter table roles            enable row level security;
alter table permissions      enable row level security;
alter table role_permissions enable row level security;
alter table user_roles       enable row level security;

-- reference data: readable by any authenticated user
drop policy if exists "read stores" on stores;
create policy "read stores" on stores
  for select to authenticated using (true);

drop policy if exists "read roles" on roles;
create policy "read roles" on roles
  for select to authenticated using (true);

drop policy if exists "read permissions" on permissions;
create policy "read permissions" on permissions
  for select to authenticated using (true);

drop policy if exists "read role_permissions" on role_permissions;
create policy "read role_permissions" on role_permissions
  for select to authenticated using (true);

-- users see their own assignments; user-managers see their scope
drop policy if exists "read user_roles" on user_roles;
create policy "read user_roles" on user_roles
  for select to authenticated
  using (user_id = auth.uid()
         or has_permission(auth.uid(), 'users:manage', store_id));

drop policy if exists "insert user_roles" on user_roles;
create policy "insert user_roles" on user_roles
  for insert to authenticated
  with check (has_permission(auth.uid(), 'users:manage', store_id));

drop policy if exists "update user_roles" on user_roles;
create policy "update user_roles" on user_roles
  for update to authenticated
  using (has_permission(auth.uid(), 'users:manage', store_id))
  with check (has_permission(auth.uid(), 'users:manage', store_id));

drop policy if exists "delete user_roles" on user_roles;
create policy "delete user_roles" on user_roles
  for delete to authenticated
  using (has_permission(auth.uid(), 'users:manage', store_id));

-- mutations to the permission model itself: platform admins only
drop policy if exists "manage roles" on roles;
create policy "manage roles" on roles
  for all to authenticated
  using (has_permission(auth.uid(), 'roles:manage'))
  with check (has_permission(auth.uid(), 'roles:manage'));

drop policy if exists "manage permissions" on permissions;
create policy "manage permissions" on permissions
  for all to authenticated
  using (has_permission(auth.uid(), 'roles:manage'))
  with check (has_permission(auth.uid(), 'roles:manage'));

drop policy if exists "manage role_permissions" on role_permissions;
create policy "manage role_permissions" on role_permissions
  for all to authenticated
  using (has_permission(auth.uid(), 'roles:manage'))
  with check (has_permission(auth.uid(), 'roles:manage'));

drop policy if exists "manage stores" on stores;
create policy "manage stores" on stores
  for all to authenticated
  using (has_permission(auth.uid(), 'stores:manage'))
  with check (has_permission(auth.uid(), 'stores:manage'));

-- ------------------------------------------------------------
-- 4. SEED — PERMISSIONS (18)
-- ------------------------------------------------------------
insert into permissions (key, resource, action, description) values
  ('content:read',      'content',  'read',      'View content entries and drafts'),
  ('content:create',    'content',  'create',    'Create new content drafts'),
  ('content:update',    'content',  'update',    'Edit content fields and blocks'),
  ('content:delete',    'content',  'delete',    'Permanently delete content'),
  ('content:publish',   'content',  'publish',   'Publish content immediately'),
  ('content:schedule',  'content',  'schedule',  'Schedule publish and unpublish times'),
  ('content:unpublish', 'content',  'unpublish', 'Take live content offline'),
  ('content:rollback',  'content',  'rollback',  'Restore previous content versions'),
  ('media:read',        'media',    'read',      'Browse the media library'),
  ('media:upload',      'media',    'upload',    'Upload new media assets'),
  ('media:update',      'media',    'update',    'Edit media metadata and alt text'),
  ('media:delete',      'media',    'delete',    'Delete media assets'),
  ('users:invite',      'users',    'invite',    'Invite new users to the CMS'),
  ('users:manage',      'users',    'manage',    'Edit users, assign roles and scopes'),
  ('roles:manage',      'roles',    'manage',    'Create and modify roles and permissions'),
  ('stores:manage',     'stores',   'manage',    'Create and modify stores and markets'),
  ('audit:read',        'audit',    'read',      'View the audit log'),
  ('settings:manage',   'settings', 'manage',    'Modify global CMS settings')
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- 5. SEED — ROLES (7)
-- ------------------------------------------------------------
insert into roles (key, name, description, is_system) values
  ('super_admin',    'Super Admin',    'Unrestricted access, including roles and stores',         true),
  ('content_admin',  'Content Admin',  'Runs the content operation: all content, media, users',   true),
  ('editor',         'Editor',         'Creates and edits content; cannot publish or delete',     false),
  ('merchandiser',   'Merchandiser',   'Self-serves banners, promos and landing pages per store', false),
  ('reviewer',       'Reviewer',       'Approves, publishes, unpublishes and rolls back',         false),
  ('seo_specialist', 'SEO Specialist', 'Edits SEO fields and metadata across content',            false),
  ('viewer',         'Viewer',         'Read-only access to content and media',                   false)
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- 6. SEED — ROLE × PERMISSION MATRIX
-- ------------------------------------------------------------

-- super_admin: everything (cross join → picks up future permissions on re-run)
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r cross join permissions p
where r.key = 'super_admin'
on conflict do nothing;

-- explicit matrix for every other role
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from (values
  -- content_admin: full content + media + team ops; NOT roles/stores
  ('content_admin', 'content:read'),
  ('content_admin', 'content:create'),
  ('content_admin', 'content:update'),
  ('content_admin', 'content:delete'),
  ('content_admin', 'content:publish'),
  ('content_admin', 'content:schedule'),
  ('content_admin', 'content:unpublish'),
  ('content_admin', 'content:rollback'),
  ('content_admin', 'media:read'),
  ('content_admin', 'media:upload'),
  ('content_admin', 'media:update'),
  ('content_admin', 'media:delete'),
  ('content_admin', 'users:invite'),
  ('content_admin', 'users:manage'),
  ('content_admin', 'audit:read'),
  ('content_admin', 'settings:manage'),

  -- editor: drafts and assets only
  ('editor', 'content:read'),
  ('editor', 'content:create'),
  ('editor', 'content:update'),
  ('editor', 'media:read'),
  ('editor', 'media:upload'),
  ('editor', 'media:update'),

  -- merchandiser: self-serve promo lifecycle (constrain via store + content_types at assignment)
  ('merchandiser', 'content:read'),
  ('merchandiser', 'content:create'),
  ('merchandiser', 'content:update'),
  ('merchandiser', 'content:publish'),
  ('merchandiser', 'content:schedule'),
  ('merchandiser', 'content:unpublish'),
  ('merchandiser', 'media:read'),
  ('merchandiser', 'media:upload'),
  ('merchandiser', 'media:update'),

  -- reviewer: approval authority + emergency controls
  ('reviewer', 'content:read'),
  ('reviewer', 'content:publish'),
  ('reviewer', 'content:schedule'),
  ('reviewer', 'content:unpublish'),
  ('reviewer', 'content:rollback'),
  ('reviewer', 'media:read'),

  -- seo_specialist: metadata access
  ('seo_specialist', 'content:read'),
  ('seo_specialist', 'content:update'),
  ('seo_specialist', 'media:read'),

  -- viewer: read-only
  ('viewer', 'content:read'),
  ('viewer', 'media:read')
) as m(role_key, permission_key)
join roles r       on r.key = m.role_key
join permissions p on p.key = m.permission_key
on conflict do nothing;

-- ------------------------------------------------------------
-- 7. DEMO STORES (delete if unwanted)
-- ------------------------------------------------------------
insert into stores (code, name) values
  ('us', 'United States'),
  ('sa', 'Saudi Arabia'),
  ('uk', 'United Kingdom')
on conflict (code) do nothing;

-- ------------------------------------------------------------
-- 8. BOOTSTRAP (uncomment, edit email — runs as superuser here,
--    so it bypasses RLS; this is your one-time way in)
-- ------------------------------------------------------------
-- insert into user_roles (user_id, role_id)
-- select u.id, r.id
-- from auth.users u, roles r
-- where u.email = 'you@company.com' and r.key = 'super_admin';

-- Example scoped assignment — Sara merchandises banners in SA only:
-- insert into user_roles (user_id, role_id, store_id, content_types)
-- select u.id, r.id, s.id, array['banner', 'landing_page', 'promo']
-- from auth.users u, roles r, stores s
-- where u.email = 'sara@company.com'
--   and r.key = 'merchandiser'
--   and s.code = 'sa';

commit;

-- ------------------------------------------------------------
-- 9. VERIFY — prints the full matrix as a readable table
-- ------------------------------------------------------------
select
  p.key as permission,
  bool_or(r.key = 'super_admin')    as super_admin,
  bool_or(r.key = 'content_admin')  as content_admin,
  bool_or(r.key = 'editor')         as editor,
  bool_or(r.key = 'merchandiser')   as merchandiser,
  bool_or(r.key = 'reviewer')       as reviewer,
  bool_or(r.key = 'seo_specialist') as seo_specialist,
  bool_or(r.key = 'viewer')         as viewer
from permissions p
left join role_permissions rp on rp.permission_id = p.id
left join roles r             on r.id = rp.role_id
group by p.key
order by p.key;
