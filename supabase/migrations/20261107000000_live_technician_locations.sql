begin;

alter table public.technician_locations
  add column location_mode text not null default 'manual' check (location_mode in ('manual', 'live')),
  add column live_expires_at timestamptz,
  add constraint technician_location_expiry check (
    (location_mode = 'manual' and live_expires_at is null)
    or (location_mode = 'live' and live_expires_at is not null)
  );

-- A manual save deliberately replaces live sharing, never a stale live timestamp.
create or replace function public.save_my_technician_location(
  p_latitude double precision, p_longitude double precision, p_address text
)
returns setof public.technician_locations
language plpgsql security definer set search_path = '' as $$
declare v_technician_id uuid;
begin
  if not public.is_technician() then raise exception 'Technician access required.'; end if;
  select tp.id into v_technician_id from public.technician_profiles tp
    join public.technician_applications a on a.id = tp.application_id
    where tp.user_id = (select auth.uid()) and tp.is_active and a.status = 'approved';
  if v_technician_id is null then raise exception 'An active technician profile is required.'; end if;
  return query
    insert into public.technician_locations (technician_id, latitude, longitude, address, is_shared)
    values (v_technician_id, p_latitude, p_longitude, btrim(p_address), true)
    on conflict (technician_id) do update set latitude = excluded.latitude,
      longitude = excluded.longitude, address = excluded.address, is_shared = true,
      location_mode = 'manual', live_expires_at = null, updated_at = now()
    returning *;
end;
$$;

-- Device permissions and an explicit foreground sharing action are required in the UI.
-- The server supplies the expiry so clients cannot publish an indefinitely "live" pin.
create function public.publish_my_live_location(p_latitude double precision, p_longitude double precision)
returns setof public.technician_locations
language plpgsql security definer set search_path = '' as $$
declare v_technician_id uuid;
begin
  if not public.is_technician() then raise exception 'Technician access required.'; end if;
  select tp.id into v_technician_id from public.technician_profiles tp
    join public.technician_applications a on a.id = tp.application_id
    where tp.user_id = (select auth.uid()) and tp.is_active and a.status = 'approved';
  if v_technician_id is null then raise exception 'An active technician profile is required.'; end if;
  return query
    insert into public.technician_locations
      (technician_id, latitude, longitude, address, is_shared, location_mode, live_expires_at)
    values (v_technician_id, p_latitude, p_longitude, 'Live GPS location', true, 'live', now() + interval '90 seconds')
    on conflict (technician_id) do update set latitude = excluded.latitude,
      longitude = excluded.longitude, address = excluded.address, is_shared = true,
      location_mode = 'live', live_expires_at = excluded.live_expires_at, updated_at = now()
    returning *;
end;
$$;
revoke all on function public.publish_my_live_location(double precision, double precision) from public, anon;
grant execute on function public.publish_my_live_location(double precision, double precision) to authenticated;

drop function public.list_located_technicians();
create function public.list_located_technicians()
returns table (
  id uuid, full_name text, specializations text[], service_type public.service_type,
  latitude double precision, longitude double precision, address text, updated_at timestamptz,
  location_mode text, live_expires_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select tp.id, a.full_name, a.specializations, a.service_type,
    l.latitude, l.longitude, l.address, l.updated_at, l.location_mode, l.live_expires_at
  from public.technician_locations l
  join public.technician_profiles tp on tp.id = l.technician_id
  join public.technician_applications a on a.id = tp.application_id
  join public.user_roles r on r.user_id = tp.user_id
  where (select auth.uid()) is not null and l.is_shared and tp.is_active
    and a.status = 'approved' and r.role = 'technician'
    and (l.location_mode = 'manual' or l.live_expires_at > now())
  order by l.updated_at desc, tp.id;
$$;
revoke all on function public.list_located_technicians() from public, anon;
grant execute on function public.list_located_technicians() to authenticated;

-- Broadcast only an invalidation. Never broadcast rows, coordinates, application
-- contact details, or account identifiers. Each receiver re-reads the safe RPC.
create function public.notify_technician_directory_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.send('{"refresh":true}'::jsonb, 'locations_changed', 'technician-directory', true);
  return null;
end;
$$;
revoke all on function public.notify_technician_directory_changed() from public, anon, authenticated;

create trigger technician_locations_directory_changed
after insert or update or delete on public.technician_locations
for each statement execute function public.notify_technician_directory_changed();
create trigger technician_profiles_directory_changed
after insert or update or delete on public.technician_profiles
for each statement execute function public.notify_technician_directory_changed();
create trigger technician_applications_directory_changed
after update or delete on public.technician_applications
for each statement execute function public.notify_technician_directory_changed();
create trigger technician_roles_directory_changed
after insert or update or delete on public.user_roles
for each statement execute function public.notify_technician_directory_changed();

create policy authenticated_technician_directory_events on realtime.messages
for select to authenticated using (
  (select auth.uid()) is not null and realtime.topic() = 'technician-directory'
);

commit;
