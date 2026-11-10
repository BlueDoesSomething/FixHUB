begin;

-- ---------------------------------------------------------------------------
-- FIXHUB repair-request sync + shared reviews
-- Depends on 20261102000000_business_data.sql (repair_requests, repair_photos,
--           reviews, review_replies, technician_profiles).
-- Adds:     repair photo Storage bucket + policies, client-supplied request id,
--           review listing RPCs, reviewable/assigned repair RPCs.
-- ---------------------------------------------------------------------------

-- ===== Repair photo storage ===============================================
-- Private bucket. Object path: {auth.uid()}/{repair_id}/{position}-{filename}
insert into storage.buckets (id, name, public)
values ('repair-photos', 'repair-photos', false)
on conflict (id) do nothing;

drop policy if exists repair_photos_insert_own on storage.objects;
create policy repair_photos_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'repair-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- The repair's customer, the assigned technician, and admins can read photos.
drop policy if exists repair_photos_select_visible on storage.objects;
create policy repair_photos_select_visible on storage.objects
  for select to authenticated
  using (
    bucket_id = 'repair-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
      or exists (
        select 1
        from public.repair_requests r
        join public.technician_profiles tp on tp.id = r.technician_id
        where r.id::text = (storage.foldername(name))[2]
          and tp.user_id = (select auth.uid())
      )
    )
  );

-- ===== create_my_repair_request: accept the client's request id ============
-- The browser generates the request id so the local record, its reference
-- number, and the database row stay identical across devices.
drop function if exists public.create_my_repair_request(text, text, text, text, public.service_type, text, double precision, double precision);

create function public.create_my_repair_request(
  p_device text,
  p_brand text,
  p_model text,
  p_problem text,
  p_service_type public.service_type,
  p_location text,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  v_role public.app_role;
begin
  select role into v_role from public.user_roles where user_id = (select auth.uid());
  if v_role is null then raise exception 'Profile not found.'; end if;
  if v_role != 'client' then raise exception 'Only customers can create repair requests.'; end if;
  if p_service_type = 'both' then raise exception 'Choose home service or drop-off.'; end if;
  if p_location is null or char_length(btrim(p_location)) < 5 or char_length(p_location) > 500 then
    raise exception 'Confirm a map location and an address before submitting.';
  end if;

  insert into public.repair_requests (
    id, customer_id, device, brand, model, problem, service_type, location,
    latitude, longitude, status
  ) values (
    coalesce(p_request_id, gen_random_uuid()),
    (select auth.uid()), btrim(p_device), btrim(p_brand), btrim(p_model), p_problem,
    p_service_type, p_location, p_latitude, p_longitude, 'pending'
  ) returning id into new_id;

  return new_id;
end;
$$;
revoke all on function public.create_my_repair_request(text, text, text, text, public.service_type, text, double precision, double precision, uuid) from public, anon;
grant execute on function public.create_my_repair_request(text, text, text, text, public.service_type, text, double precision, double precision, uuid) to authenticated;

-- ===== Reviews with display names =========================================
-- Names live in private tables (profiles / technician_applications), so the
-- projection is built here once instead of exposing those tables.
create function public.list_reviews()
returns table (
  id uuid,
  repair_id uuid,
  customer_id uuid,
  customer_name text,
  technician_id uuid,
  technician_name text,
  device text,
  rating int,
  comment text,
  created_at timestamptz,
  reply_comment text,
  reply_created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.repair_id, r.customer_id,
    coalesce(p.full_name, 'A FIXHUB customer'),
    r.technician_id,
    coalesce(a.full_name, 'A FIXHUB technician'),
    btrim(concat_ws(' ', req.device, req.brand, req.model)),
    r.rating, r.comment, r.created_at,
    replies.comment, replies.created_at
  from public.reviews r
  join public.repair_requests req on req.id = r.repair_id
  left join public.profiles p on p.user_id = r.customer_id
  left join public.technician_profiles tp on tp.id = r.technician_id
  left join public.technician_applications a on a.id = tp.application_id
  left join public.review_replies replies on replies.review_id = r.id
  order by r.created_at desc;
$$;
revoke all on function public.list_reviews() from public, anon;
grant execute on function public.list_reviews() to authenticated;

-- ===== Completed repairs waiting for a customer review =====================
create function public.list_my_reviewable_repairs()
returns table (
  repair_id uuid,
  reference text,
  device text,
  brand text,
  model text,
  problem text,
  completed_at timestamptz,
  technician_id uuid,
  technician_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.reference, r.device, r.brand, r.model,
    r.problem, r.updated_at, r.technician_id,
    coalesce(a.full_name, 'A FIXHUB technician')
  from public.repair_requests r
  join public.technician_profiles tp on tp.id = r.technician_id
  left join public.technician_applications a on a.id = tp.application_id
  where r.customer_id = (select auth.uid())
    and r.status = 'completed'
    and not exists (select 1 from public.reviews v where v.repair_id = r.id)
  order by r.updated_at desc;
$$;
revoke all on function public.list_my_reviewable_repairs() from public, anon;
grant execute on function public.list_my_reviewable_repairs() to authenticated;

-- ===== Repairs assigned to the signed-in technician ========================
create function public.list_my_assigned_repairs()
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
  status public.repair_status,
  cancellation_reason text,
  customer_name text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.reference, r.device, r.brand, r.model, r.problem, r.service_type,
    r.location, r.latitude, r.longitude, r.status, r.cancellation_reason,
    coalesce(p.full_name, 'A FIXHUB customer'), r.created_at, r.updated_at
  from public.repair_requests r
  left join public.profiles p on p.user_id = r.customer_id
  where r.technician_id in (
    select tp.id from public.technician_profiles tp where tp.user_id = (select auth.uid())
  )
  order by case when r.status = 'accepted' then 0 else 1 end, r.updated_at desc;
$$;
revoke all on function public.list_my_assigned_repairs() from public, anon;
grant execute on function public.list_my_assigned_repairs() to authenticated;

-- ===== The signed-in technician's profile id ===============================
-- Used to filter the shared review feed down to "my reviews".
create function public.my_technician_profile_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select tp.id
  from public.technician_profiles tp
  where tp.user_id = (select auth.uid())
  limit 1;
$$;
revoke all on function public.my_technician_profile_id() from public, anon;
grant execute on function public.my_technician_profile_id() to authenticated;

-- ===== Stars-only reviews ==================================================
-- A customer may rate without written feedback, so an empty comment is valid.
alter table public.reviews drop constraint if exists reviews_comment_check;
alter table public.reviews add constraint reviews_comment_check check (char_length(comment) between 0 and 1000);

comment on function public.list_reviews() is 'All reviews with customer and technician display names plus the technician reply.';
comment on function public.list_my_reviewable_repairs() is 'Completed, unreviewed repairs owned by the caller.';
comment on function public.list_my_assigned_repairs() is 'Repairs assigned to the caller technician profile, with the customer display name.';
comment on function public.create_my_repair_request(text, text, text, text, public.service_type, text, double precision, double precision, uuid) is 'Creates a client repair request; p_request_id keeps the browser record and database row identical.';

commit;
