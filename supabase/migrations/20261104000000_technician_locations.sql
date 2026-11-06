begin;

-- Separate, opt-in service locations. No background GPS history is stored.
create table public.technician_locations (
  technician_id uuid primary key references public.technician_profiles(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text not null check (char_length(btrim(address)) between 1 and 500),
  is_shared boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.technician_locations enable row level security;
revoke all on table public.technician_locations from public, anon, authenticated;
grant select on table public.technician_locations to authenticated;
grant all on table public.technician_locations to service_role;

-- Customers receive only the explicitly shared directory fields through the RPC.
create policy technician_locations_select_own on public.technician_locations
  for select to authenticated using (
    exists (select 1 from public.technician_profiles tp
      where tp.id = technician_id and tp.user_id = (select auth.uid()))
  );

create function public.get_my_technician_location()
returns setof public.technician_locations
language sql stable security invoker set search_path = '' as $$
  select l.* from public.technician_locations l
  join public.technician_profiles tp on tp.id = l.technician_id
  where tp.user_id = (select auth.uid());
$$;
revoke all on function public.get_my_technician_location() from public, anon;
grant execute on function public.get_my_technician_location() to authenticated;

create function public.save_my_technician_location(
  p_latitude double precision, p_longitude double precision, p_address text
)
returns setof public.technician_locations
language plpgsql security definer set search_path = '' as $$
declare
  v_technician_id uuid;
begin
  if not public.is_technician() then raise exception 'Technician access required.'; end if;
  select id into v_technician_id from public.technician_profiles
    where user_id = (select auth.uid()) and is_active;
  if v_technician_id is null then raise exception 'An active technician profile is required.'; end if;

  return query
    insert into public.technician_locations (technician_id, latitude, longitude, address, is_shared)
    values (v_technician_id, p_latitude, p_longitude, btrim(p_address), true)
    on conflict (technician_id) do update set
      latitude = excluded.latitude, longitude = excluded.longitude,
      address = excluded.address, is_shared = true, updated_at = now()
    returning *;
end;
$$;
revoke all on function public.save_my_technician_location(double precision, double precision, text) from public, anon;
grant execute on function public.save_my_technician_location(double precision, double precision, text) to authenticated;

create function public.stop_sharing_my_technician_location()
returns void
language sql security definer set search_path = '' as $$
  update public.technician_locations set is_shared = false, updated_at = now()
  where technician_id in (
    select id from public.technician_profiles where user_id = (select auth.uid())
  );
$$;
revoke all on function public.stop_sharing_my_technician_location() from public, anon;
grant execute on function public.stop_sharing_my_technician_location() to authenticated;

-- This allow-list deliberately excludes applicant contact details and account IDs.
create function public.list_located_technicians()
returns table (
  id uuid, full_name text, specializations text[], service_type public.service_type,
  latitude double precision, longitude double precision, address text, updated_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select tp.id, a.full_name, a.specializations, a.service_type,
    l.latitude, l.longitude, l.address, l.updated_at
  from public.technician_locations l
  join public.technician_profiles tp on tp.id = l.technician_id
  join public.technician_applications a on a.id = tp.application_id
  join public.user_roles r on r.user_id = tp.user_id
  where (select auth.uid()) is not null and l.is_shared and tp.is_active
    and a.status = 'approved' and r.role = 'technician'
  order by l.updated_at desc, tp.id;
$$;
revoke all on function public.list_located_technicians() from public, anon;
grant execute on function public.list_located_technicians() to authenticated;

commit;
