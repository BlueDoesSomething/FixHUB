-- PayMongo subscription state is written only by trusted Edge Functions.
-- Never let the browser mark a subscription active or choose its own price.
create table public.technician_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  paymongo_customer_id text unique,
  paymongo_subscription_id text unique,
  status text not null default 'none' check (status in
    ('none', 'incomplete', 'incomplete_cancelled', 'active', 'past_due', 'unpaid', 'cancelled')),
  next_billing_at date,
  start_attempt_id uuid not null default gen_random_uuid(),
  starting_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.technician_subscriptions enable row level security;
revoke all on public.technician_subscriptions from public, anon, authenticated;
grant select on public.technician_subscriptions to authenticated;
grant all on public.technician_subscriptions to service_role;
create policy technician_subscriptions_own on public.technician_subscriptions
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- Explicit rollout switch. Keep false until sandbox secrets, plan, webhook,
-- and an end-to-end test payment are all configured and verified.
create table fixhub_private.technician_billing_settings (
  singleton boolean primary key default true check (singleton),
  enforced boolean not null default false
);
insert into fixhub_private.technician_billing_settings (singleton, enforced) values (true, false);
revoke all on fixhub_private.technician_billing_settings from public, anon, authenticated;
grant select on fixhub_private.technician_billing_settings to service_role;

-- The service role obtains a short lease before contacting PayMongo so
-- concurrent clicks cannot create two payable subscriptions for one account.
create function public.claim_technician_subscription_start(p_user_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_attempt uuid;
begin
  insert into public.technician_subscriptions (user_id, starting_at)
  values (p_user_id, now())
  on conflict (user_id) do update set
    starting_at = now(),
    start_attempt_id = case when public.technician_subscriptions.status in ('cancelled', 'incomplete_cancelled')
      then gen_random_uuid() else public.technician_subscriptions.start_attempt_id end
    where (public.technician_subscriptions.starting_at is null
      or public.technician_subscriptions.starting_at < now() - interval '3 minutes')
      and public.technician_subscriptions.status not in ('active', 'incomplete', 'past_due', 'unpaid')
  returning start_attempt_id into v_attempt;
  return v_attempt;
end;
$$;
revoke all on function public.claim_technician_subscription_start(uuid) from public, anon, authenticated;
grant execute on function public.claim_technician_subscription_start(uuid) to service_role;

create function public.my_technician_subscription()
returns table (status text, next_billing_at date, enforced boolean)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_technician() then raise exception 'Technician access required.'; end if;
  return query
    select coalesce(s.status, 'none'), s.next_billing_at, b.enforced
    from fixhub_private.technician_billing_settings b
    left join public.technician_subscriptions s on s.user_id = (select auth.uid())
    where b.singleton;
end;
$$;
revoke all on function public.my_technician_subscription() from public, anon;
grant execute on function public.my_technician_subscription() to authenticated;

-- Only accepting NEW jobs is gated. Previously accepted repairs can still be
-- completed and customers can still see their existing repair history.
create or replace function public.accept_repair_request(p_repair_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_tech_profile_id uuid;
begin
  if not public.is_technician() then raise exception 'Only technicians can accept repairs.'; end if;
  select id into v_tech_profile_id from public.technician_profiles
    where user_id = (select auth.uid()) and is_active = true;
  if v_tech_profile_id is null then raise exception 'Technician profile not found.'; end if;
  if (select enforced from fixhub_private.technician_billing_settings where singleton)
    and not exists (select 1 from public.technician_subscriptions
      where user_id = (select auth.uid()) and status = 'active') then
    raise exception 'An active technician subscription is required to accept new repairs.';
  end if;
  update public.repair_requests
    set technician_id = v_tech_profile_id, status = 'accepted'
    where id = p_repair_id and status = 'pending' and technician_id is null;
  if not found then raise exception 'This repair request is no longer available.'; end if;
end;
$$;
revoke all on function public.accept_repair_request(uuid) from public, anon;
grant execute on function public.accept_repair_request(uuid) to authenticated;
