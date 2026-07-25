-- ============================================================
--  ECOMMERCE CMS — PROFILES (user directory for the admin UI)
--  Builds on 0001_rbac.sql. Idempotent: safe to re-run.
-- ============================================================
begin;

alter table profiles add column if not exists email text;

update profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is distinct from u.email;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

-- ------------------------------------------------------------
-- RLS — everyone can read the directory (needed to show names on
-- content/audit screens); only users:manage can edit others.
-- ------------------------------------------------------------
alter table profiles enable row level security;

drop policy if exists "read profiles" on profiles;
create policy "read profiles" on profiles
  for select to authenticated using (true);

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update to authenticated
  using (id = auth.uid() or has_permission(auth.uid(), 'users:manage'))
  with check (id = auth.uid() or has_permission(auth.uid(), 'users:manage'));

commit;
