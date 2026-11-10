-- Pending unassigned repairs are intentionally hidden by repair_requests RLS.
-- Expose only the queue projection to verified, active technicians, rather than
-- granting every authenticated customer read access to other customers' jobs.
create or replace function public.list_available_repairs()
returns table (
  id uuid,
  reference text,
  device text,
  brand text,
  model text,
  problem text,
  service_type public.service_type,
  location text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_technician() or not exists (
    select 1 from public.technician_profiles tp
    where tp.user_id = (select auth.uid()) and tp.is_active
  ) then
    raise exception 'An active, verified technician profile is required to view new requests.';
  end if;

  return query
    select r.id, r.reference, r.device, r.brand, r.model, r.problem,
      r.service_type, r.location, r.latitude, r.longitude, r.created_at
    from public.repair_requests r
    where r.status = 'pending' and r.technician_id is null
    order by r.created_at desc;
end;
$$;

revoke all on function public.list_available_repairs() from public, anon;
grant execute on function public.list_available_repairs() to authenticated;
