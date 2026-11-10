-- The pending technician queue includes the requesting account's display name.
drop function public.list_available_repairs();
create function public.list_available_repairs()
returns table (
  id uuid, reference text, device text, brand text, model text, problem text,
  service_type public.service_type, location text, latitude double precision,
  longitude double precision, created_at timestamptz, customer_name text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_technician() or not exists (
    select 1 from public.technician_profiles tp
    where tp.user_id = (select auth.uid()) and tp.is_active
  ) then
    raise exception 'An active, verified technician profile is required to view new requests.';
  end if;

  return query
    select r.id, r.reference, r.device, r.brand, r.model, r.problem,
      r.service_type, r.location, r.latitude, r.longitude, r.created_at,
      coalesce(nullif(btrim(p.full_name), ''), 'A FIXHUB customer')
    from public.repair_requests r
    left join public.profiles p on p.user_id = r.customer_id
    where r.status = 'pending' and r.technician_id is null
    order by r.created_at desc;
end;
$$;
revoke all on function public.list_available_repairs() from public, anon;
grant execute on function public.list_available_repairs() to authenticated;

-- The accepted repair itself is the conversation: no second creation step can
-- fail after acceptance. Existing accepted jobs automatically get a thread.
create table public.repair_messages (
  id uuid primary key default gen_random_uuid(),
  repair_id uuid not null references public.repair_requests(id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index repair_messages_thread on public.repair_messages (repair_id, created_at, id);
alter table public.repair_messages enable row level security;
revoke all on table public.repair_messages from public, anon, authenticated;
grant select on public.repair_messages to authenticated;
grant insert (id, repair_id, body) on public.repair_messages to authenticated;
grant all on public.repair_messages to service_role;

create policy repair_messages_read_participants on public.repair_messages
  for select to authenticated using (
    exists (select 1 from public.repair_requests r
      left join public.technician_profiles tp on tp.id = r.technician_id
      where r.id = repair_messages.repair_id and r.technician_id is not null
        and (r.customer_id = (select auth.uid()) or tp.user_id = (select auth.uid())))
  );
create policy repair_messages_send_participants on public.repair_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid()) and exists (
      select 1 from public.repair_requests r
      left join public.technician_profiles tp on tp.id = r.technician_id
      where r.id = repair_messages.repair_id and r.technician_id is not null
        and r.status not in ('pending', 'cancelled')
        and (r.customer_id = (select auth.uid()) or tp.user_id = (select auth.uid())))
  );

-- Only the two account holders see the repair and the other person's name.
create function public.list_my_repair_conversations()
returns table (
  repair_id uuid, reference text, device text, model text,
  customer_id uuid, technician_user_id uuid, customer_name text,
  technician_name text, status public.repair_status, last_message_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select r.id, r.reference, r.device, r.model, r.customer_id, tp.user_id,
    coalesce(nullif(btrim(cp.full_name), ''), 'A FIXHUB customer'),
    coalesce(nullif(btrim(tprof.full_name), ''), nullif(btrim(ta.full_name), ''), 'A FIXHUB technician'),
    r.status, (select max(m.created_at) from public.repair_messages m where m.repair_id = r.id)
  from public.repair_requests r
  join public.technician_profiles tp on tp.id = r.technician_id
  left join public.profiles cp on cp.user_id = r.customer_id
  left join public.technician_applications ta on ta.id = tp.application_id
  left join public.profiles tprof on tprof.user_id = tp.user_id
  where r.customer_id = (select auth.uid()) or tp.user_id = (select auth.uid())
  order by coalesce((select max(m.created_at) from public.repair_messages m where m.repair_id = r.id), r.updated_at) desc;
$$;
revoke all on function public.list_my_repair_conversations() from public, anon;
grant execute on function public.list_my_repair_conversations() to authenticated;
