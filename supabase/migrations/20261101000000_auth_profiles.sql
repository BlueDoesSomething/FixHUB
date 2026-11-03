begin;

-- This migration owns only these new FIXHUB objects. Existing names cause an error,
-- rather than silently replacing another application's tables or policies.
create schema if not exists fixhub_private;
revoke all on schema fixhub_private from public, anon, authenticated;

create type public.app_role as enum ('client', 'technician', 'admin');
revoke all on type public.app_role from public;
grant usage on type public.app_role to authenticated, service_role;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (full_name = btrim(full_name) and char_length(full_name) between 2 and 120),
  phone text not null default '' check (char_length(phone) <= 32),
  city text not null default '' check (char_length(city) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles are deliberately separate from user-editable profile columns and metadata.
create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'client',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Revoke Supabase's possible default grants, including TRUNCATE/REFERENCES/TRIGGER.
revoke all on table public.profiles, public.user_roles from public, anon, authenticated;
grant usage on schema public to authenticated, service_role;
grant select on table public.profiles, public.user_roles to authenticated;
grant update (full_name, phone, city) on public.profiles to authenticated;
grant all on table public.profiles, public.user_roles to service_role;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy user_roles_select_own on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()));

create function fixhub_private.initial_profile_name(metadata jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(metadata -> 'full_name') = 'string'
      and char_length(btrim(metadata ->> 'full_name')) between 2 and 120
    then btrim(metadata ->> 'full_name')
    else 'New customer'
  end;
$$;
revoke all on function fixhub_private.initial_profile_name(jsonb) from public, anon, authenticated;

create function fixhub_private.create_account_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, fixhub_private.initial_profile_name(new.raw_user_meta_data));
  -- Never read a role from an email address or client-editable Auth metadata.
  insert into public.user_roles (user_id, role) values (new.id, 'client');
  return new;
end;
$$;
revoke all on function fixhub_private.create_account_profile() from public, anon, authenticated;

create trigger fixhub_on_auth_user_created
  after insert on auth.users
  for each row execute function fixhub_private.create_account_profile();

create function fixhub_private.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function fixhub_private.touch_profile_updated_at() from public, anon, authenticated;

create trigger fixhub_on_profile_updated
  before update on public.profiles
  for each row execute function fixhub_private.touch_profile_updated_at();

-- Also cover development users created in Auth before the first migration.
insert into public.profiles (user_id, full_name)
select id, fixhub_private.initial_profile_name(raw_user_meta_data) from auth.users;
insert into public.user_roles (user_id, role)
select id, 'client'::public.app_role from auth.users;

create function public.get_my_account()
returns table (
  user_id uuid,
  full_name text,
  phone text,
  city text,
  role public.app_role,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.user_id, p.full_name, p.phone, p.city, r.role, p.created_at, p.updated_at
  from public.profiles p
  join public.user_roles r on r.user_id = p.user_id
  where p.user_id = (select auth.uid());
$$;
revoke all on function public.get_my_account() from public, anon, authenticated;
grant execute on function public.get_my_account() to authenticated;

comment on table public.profiles is 'Private account profile. Public technician listings will use a separate safe projection.';
comment on table public.user_roles is 'Authoritative FIXHUB role. Client users cannot insert, update, or delete roles.';
comment on function public.get_my_account() is 'RLS-protected own-account read; no user ID or role supplied by the browser.';

commit;
