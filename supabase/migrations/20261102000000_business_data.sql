begin;

-- ---------------------------------------------------------------------------
-- FIXHUB business-data migration
-- Depends on 20261101000000_auth_profiles.sql (profiles, user_roles, app_role).
-- Creates: technician_applications, application_events, technician_profiles,
--          repair_requests, repair_photos, reviews, review_replies.
-- No client can insert/update/delete roles. Admin business access is explicit.
-- ---------------------------------------------------------------------------

-- ===== Enums ===============================================================
create type public.application_status as enum (
  'pending', 'under_review', 'needs_information', 'approved', 'rejected'
);
revoke all on type public.application_status from public;
grant usage on type public.application_status to authenticated, service_role;

create type public.service_type as enum ('home', 'dropoff', 'both');
revoke all on type public.service_type from public;
grant usage on type public.service_type to authenticated, service_role;

create type public.repair_status as enum (
  'pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'
);
revoke all on type public.repair_status from public;
grant usage on type public.repair_status to authenticated, service_role;

-- ===== Helper: is the current user an admin? ===============================
-- SECURITY INVOKER so it respects the caller's RLS context.
create function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ===== Helper: is the current user a technician? ===========================
create function public.is_technician()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'technician'
  );
$$;
revoke all on function public.is_technician() from public, anon;
grant execute on function public.is_technician() to authenticated, service_role;

-- ===== Technician applications =============================================
-- One active application per user. Rejected applications can be edited and
-- resubmitted (a new row is inserted after rejection if the applicant reapplies;
-- the unique partial index below enforces one non-rejected application per user).
create table public.technician_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null,
  contact_number text not null check (char_length(contact_number) between 7 and 40),
  city text not null check (char_length(city) between 2 and 120),
  years_experience int not null check (years_experience >= 0 and years_experience <= 100),
  brands text[] not null check (array_length(brands, 1) > 0 and array_length(brands, 1) <= 20),
  specializations text[] not null check (array_length(specializations, 1) > 0 and array_length(specializations, 1) <= 20),
  experience_description text not null check (char_length(experience_description) between 20 and 5000),
  service_type public.service_type not null,
  coverage_area text not null check (char_length(coverage_area) between 2 and 500),
  working_days text[] not null check (
    array_length(working_days, 1) > 0
    and array_length(working_days, 1) <= 7
    and working_days <@ array['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  ),
  working_hours text not null check (char_length(working_hours) between 3 and 120),
  status public.application_status not null default 'pending',
  feedback text,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one non-rejected application per applicant.
create unique index one_active_application_per_applicant
  on public.technician_applications (applicant_id)
  where status in ('pending', 'under_review', 'needs_information', 'approved');

create index on public.technician_applications (status);
create index on public.technician_applications (created_at desc);

alter table public.technician_applications enable row level security;

revoke all on table public.technician_applications from public, anon, authenticated;
grant select on table public.technician_applications to authenticated;
grant insert (full_name, email, contact_number, city, years_experience, brands,
  specializations, experience_description, service_type, coverage_area,
  working_days, working_hours) on table public.technician_applications to authenticated;
grant update (full_name, contact_number, city, years_experience, brands,
  specializations, experience_description, service_type, coverage_area,
  working_days, working_hours) on table public.technician_applications to authenticated;
grant all on table public.technician_applications to service_role;

-- Applicants read their own; admins read all.
create policy applications_select_own_or_admin on public.technician_applications
  for select to authenticated
  using (applicant_id = (select auth.uid()) or public.is_admin());

-- Applicants can insert only for themselves, and only if they are a client
-- (not already a technician or admin).
create policy applications_insert_own_client on public.technician_applications
  for insert to authenticated
  with check (
    applicant_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid()) and role = 'client'
    )
  );

-- Applicants can update their own pending/needs_information/rejected rows.
create policy applications_update_own on public.technician_applications
  for update to authenticated
  using (
    applicant_id = (select auth.uid())
    and status in ('pending', 'needs_information', 'rejected')
  )
  with check (
    applicant_id = (select auth.uid())
    and status in ('pending', 'needs_information', 'rejected')
  );

-- ===== Application events (audit trail) ====================================
create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.technician_applications(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  status public.application_status not null,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create index on public.application_events (application_id, created_at);

alter table public.application_events enable row level security;

revoke all on table public.application_events from public, anon, authenticated;
grant select on table public.application_events to authenticated;
grant all on table public.application_events to service_role;

-- Events are visible to the applicant or an admin.
create policy events_select_own_or_admin on public.application_events
  for select to authenticated
  using (
    exists (
      select 1 from public.technician_applications a
      where a.id = application_id
      and (a.applicant_id = (select auth.uid()) or public.is_admin())
    )
  );

-- Events are inserted only by service_role (via security-definer RPCs).

-- ===== Technician profiles (created on approval) ===========================
create table public.technician_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.technician_applications(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index one_profile_per_technician on public.technician_profiles (user_id);
create unique index one_application_per_profile on public.technician_profiles (application_id);

alter table public.technician_profiles enable row level security;

revoke all on table public.technician_profiles from public, anon, authenticated;
grant select on table public.technician_profiles to authenticated;
grant all on table public.technician_profiles to service_role;

-- Everyone authenticated can see active technician profiles (for matching/listing).
create policy technician_profiles_select_active on public.technician_profiles
  for select to authenticated
  using (is_active = true or user_id = (select auth.uid()) or public.is_admin());

-- ===== Repair requests =====================================================
create table public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  reference text generated always as ('FH-' || upper(substr(replace(id::text, '-', ''), 1, 12))) stored,
  customer_id uuid not null references auth.users(id) on delete cascade,
  technician_id uuid references public.technician_profiles(id) on delete set null,
  device text not null check (char_length(device) between 2 and 100),
  brand text not null check (char_length(brand) between 1 and 100),
  model text not null check (char_length(model) between 1 and 120),
  problem text not null check (char_length(problem) between 5 and 5000),
  service_type public.service_type not null check (service_type in ('home', 'dropoff')),
  location text not null check (char_length(location) between 5 and 500),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  status public.repair_status not null default 'pending',
  cancellation_reason text check (cancellation_reason is null or char_length(cancellation_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.repair_requests (customer_id, created_at desc);
create index on public.repair_requests (technician_id, created_at desc) where technician_id is not null;
create index on public.repair_requests (status) where status in ('pending', 'accepted', 'en_route', 'arrived', 'in_progress');

alter table public.repair_requests enable row level security;

revoke all on table public.repair_requests from public, anon, authenticated;
grant select on table public.repair_requests to authenticated;
grant insert (device, brand, model, problem, service_type, location, latitude, longitude)
  on table public.repair_requests to authenticated;
grant update (status, cancellation_reason) on table public.repair_requests to authenticated;
grant all on table public.repair_requests to service_role;

-- Customers read their own; technicians read assigned; admins read all.
create policy repairs_select_own_or_assigned_or_admin on public.repair_requests
  for select to authenticated
  using (
    customer_id = (select auth.uid())
    or exists (
      select 1 from public.technician_profiles tp
      where tp.id = repair_requests.technician_id
      and tp.user_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- Only clients can create repair requests, for themselves.
create policy repairs_insert_own_client on public.repair_requests
  for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid()) and role = 'client'
    )
    and status = 'pending'
  );

-- Customers can cancel their own pending requests; assigned technicians can
-- advance status through the workflow.
create policy repairs_update_own_or_assigned on public.repair_requests
  for update to authenticated
  using (
    customer_id = (select auth.uid())
    or exists (
      select 1 from public.technician_profiles tp
      where tp.id = repair_requests.technician_id
      and tp.user_id = (select auth.uid())
    )
    or public.is_admin()
  )
  with check (
    customer_id = (select auth.uid())
    or exists (
      select 1 from public.technician_profiles tp
      where tp.id = repair_requests.technician_id
      and tp.user_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- ===== Repair photos =======================================================
-- Stores object paths in Supabase Storage, not base64 blobs.
create table public.repair_photos (
  id uuid primary key default gen_random_uuid(),
  repair_id uuid not null references public.repair_requests(id) on delete cascade,
  storage_path text not null check (char_length(storage_path) between 1 and 500),
  file_name text not null check (char_length(file_name) between 1 and 255),
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size bigint not null check (file_size > 0 and file_size <= 5242880),
  created_at timestamptz not null default now(),
  position int not null default 0 check (position >= 0 and position < 3)
);

create unique index one_photo_per_position on public.repair_photos (repair_id, position);
create index on public.repair_photos (repair_id);

alter table public.repair_photos enable row level security;

revoke all on table public.repair_photos from public, anon, authenticated;
grant select on table public.repair_photos to authenticated;
grant insert (repair_id, storage_path, file_name, content_type, file_size, position)
  on table public.repair_photos to authenticated;
grant all on table public.repair_photos to service_role;

-- Photos visible to the repair's customer, assigned technician, or admin.
create policy photos_select_own_or_assigned_or_admin on public.repair_photos
  for select to authenticated
  using (
    exists (
      select 1 from public.repair_requests r
      where r.id = repair_id
      and (
        r.customer_id = (select auth.uid())
        or exists (
          select 1 from public.technician_profiles tp
          where tp.id = r.technician_id and tp.user_id = (select auth.uid())
        )
        or public.is_admin()
      )
    )
  );

-- Only the repair's customer can add photos.
create policy photos_insert_own_repair on public.repair_photos
  for insert to authenticated
  with check (
    exists (
      select 1 from public.repair_requests r
      where r.id = repair_id
      and r.customer_id = (select auth.uid())
    )
    and (select count(*) from public.repair_photos where repair_id = repair_photos.repair_id) < 3
  );

-- ===== Reviews =============================================================
-- One review per completed repair, by the customer.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  repair_id uuid not null references public.repair_requests(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  technician_id uuid not null references public.technician_profiles(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text not null check (char_length(comment) between 1 and 1000),
  created_at timestamptz not null default now()
);

create unique index one_review_per_repair on public.reviews (repair_id);
create index on public.reviews (technician_id, created_at desc);
create index on public.reviews (customer_id, created_at desc);

alter table public.reviews enable row level security;

revoke all on table public.reviews from public, anon, authenticated;
grant select on table public.reviews to authenticated;
grant insert (repair_id, customer_id, technician_id, rating, comment)
  on table public.reviews to authenticated;
grant delete on table public.reviews to authenticated;
grant all on table public.reviews to service_role;

-- Reviews are public (visible to all authenticated users) for technician listings.
create policy reviews_select_all on public.reviews
  for select to authenticated
  using (true);

-- Only the customer of a completed repair can create a review.
create policy reviews_insert_own_completed on public.reviews
  for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and exists (
      select 1 from public.repair_requests r
      where r.id = repair_id
      and r.customer_id = (select auth.uid())
      and r.status = 'completed'
    )
    and not exists (select 1 from public.reviews where repair_id = reviews.repair_id)
  );

-- ===== Review replies ======================================================
-- One reply per review, by the reviewed technician.
create table public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  technician_id uuid not null references auth.users(id) on delete cascade,
  comment text not null check (char_length(comment) between 1 and 1000),
  created_at timestamptz not null default now()
);

create unique index one_reply_per_review on public.review_replies (review_id);

alter table public.review_replies enable row level security;

revoke all on table public.review_replies from public, anon, authenticated;
grant select on table public.review_replies to authenticated;
grant insert (review_id, technician_id, comment) on table public.review_replies to authenticated;
grant all on table public.review_replies to service_role;

create policy replies_select_all on public.review_replies
  for select to authenticated
  using (true);

-- Only the reviewed technician can reply.
create policy replies_insert_own_review on public.review_replies
  for insert to authenticated
  with check (
    technician_id = (select auth.uid())
    and exists (
      select 1 from public.reviews rv
      where rv.id = review_id
      and rv.technician_id in (
        select tp.id from public.technician_profiles tp where tp.user_id = (select auth.uid())
      )
    )
    and not exists (select 1 from public.review_replies where review_id = review_replies.review_id)
  );

-- Reviews delete policy (after review_replies exists, since it references it).
-- Customers can delete their own review only before a reply is posted.
create policy reviews_delete_own_unreplied on public.reviews
  for delete to authenticated
  using (
    customer_id = (select auth.uid())
    and not exists (select 1 from public.review_replies where review_id = reviews.id)
  );

-- ===== Timestamp triggers ==================================================
create function fixhub_private.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function fixhub_private.touch_updated_at() from public, anon, authenticated;

create trigger fixhub_on_application_updated
  before update on public.technician_applications
  for each row execute function fixhub_private.touch_updated_at();

create trigger fixhub_on_repair_updated
  before update on public.repair_requests
  for each row execute function fixhub_private.touch_updated_at();

-- ===== RPCs ================================================================

-- Submit a technician application (client only, one active per user).
create function public.submit_my_application(
  p_full_name text,
  p_contact_number text,
  p_city text,
  p_years_experience int,
  p_brands text[],
  p_specializations text[],
  p_experience_description text,
  p_service_type public.service_type,
  p_coverage_area text,
  p_working_days text[],
  p_working_hours text
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
  if v_role != 'client' then raise exception 'Only customers can apply.'; end if;

  insert into public.technician_applications (
    applicant_id, full_name, email, contact_number, city, years_experience,
    brands, specializations, experience_description, service_type,
    coverage_area, working_days, working_hours, status
  ) values (
    (select auth.uid()), p_full_name,
    (select email from auth.users where id = (select auth.uid())),
    p_contact_number, p_city, p_years_experience, p_brands, p_specializations,
    p_experience_description, p_service_type, p_coverage_area,
    p_working_days, p_working_hours, 'pending'
  ) returning id into new_id;

  insert into public.application_events (application_id, actor_id, status, note)
  values (new_id, (select auth.uid()), 'pending', 'Application submitted');

  return new_id;
end;
$$;
revoke all on function public.submit_my_application(text, text, text, int, text[], text[], text, public.service_type, text, text[], text) from public, anon;
grant execute on function public.submit_my_application(text, text, text, int, text[], text[], text, public.service_type, text, text[], text) to authenticated;

-- Admin: start reviewing an application.
create function public.admin_start_review(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required.'; end if;

  update public.technician_applications
  set status = 'under_review', reviewer_id = (select auth.uid()), reviewed_at = now()
  where id = p_application_id and status in ('pending', 'needs_information');

  if not found then raise exception 'Application cannot enter review from its current status.'; end if;

  insert into public.application_events (application_id, actor_id, status, note)
  values (p_application_id, (select auth.uid()), 'under_review', 'Review started');
end;
$$;
revoke all on function public.admin_start_review(uuid) from public, anon;
grant execute on function public.admin_start_review(uuid) to authenticated;

-- Admin: request more information.
create function public.admin_request_info(p_application_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required.'; end if;

  update public.technician_applications
  set status = 'needs_information', feedback = p_note,
      reviewer_id = (select auth.uid()), reviewed_at = now()
  where id = p_application_id and status in ('pending', 'under_review');

  if not found then raise exception 'Cannot request information for this application.'; end if;

  insert into public.application_events (application_id, actor_id, status, note)
  values (p_application_id, (select auth.uid()), 'needs_information', p_note);
end;
$$;
revoke all on function public.admin_request_info(uuid, text) from public, anon;
grant execute on function public.admin_request_info(uuid, text) to authenticated;

-- Admin: reject an application.
create function public.admin_reject_application(p_application_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required.'; end if;

  update public.technician_applications
  set status = 'rejected', feedback = p_note,
      reviewer_id = (select auth.uid()), reviewed_at = now()
  where id = p_application_id and status in ('pending', 'under_review', 'needs_information');

  if not found then raise exception 'Cannot reject this application.'; end if;

  insert into public.application_events (application_id, actor_id, status, note)
  values (p_application_id, (select auth.uid()), 'rejected', p_note);
end;
$$;
revoke all on function public.admin_reject_application(uuid, text) from public, anon;
grant execute on function public.admin_reject_application(uuid, text) to authenticated;

-- Admin: approve an application — creates technician profile and promotes role.
create function public.admin_approve_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_applicant_id uuid;
  v_current_role public.app_role;
begin
  if not public.is_admin() then raise exception 'Administrator access required.'; end if;

  select applicant_id into v_applicant_id
  from public.technician_applications
  where id = p_application_id and status in ('pending', 'under_review', 'needs_information');

  if v_applicant_id is null then raise exception 'Cannot approve this application.'; end if;

  select role into v_current_role from public.user_roles where user_id = v_applicant_id;
  if v_current_role != 'client' then raise exception 'The applicant must still be a customer.'; end if;

  update public.technician_applications
  set status = 'approved', feedback = null,
      reviewer_id = (select auth.uid()), reviewed_at = now()
  where id = p_application_id;

  insert into public.technician_profiles (user_id, application_id)
  values (v_applicant_id, p_application_id);

  update public.user_roles set role = 'technician' where user_id = v_applicant_id;

  insert into public.application_events (application_id, actor_id, status, note)
  values (p_application_id, (select auth.uid()), 'approved', 'Application approved');
end;
$$;
revoke all on function public.admin_approve_application(uuid) from public, anon;
grant execute on function public.admin_approve_application(uuid) to authenticated;

-- Create a repair request (client only).
create function public.create_my_repair_request(
  p_device text,
  p_brand text,
  p_model text,
  p_problem text,
  p_service_type public.service_type,
  p_location text,
  p_latitude double precision default null,
  p_longitude double precision default null
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

  insert into public.repair_requests (
    customer_id, device, brand, model, problem, service_type, location,
    latitude, longitude, status
  ) values (
    (select auth.uid()), p_device, p_brand, p_model, p_problem,
    p_service_type, p_location, p_latitude, p_longitude, 'pending'
  ) returning id into new_id;

  return new_id;
end;
$$;
revoke all on function public.create_my_repair_request(text, text, text, text, public.service_type, text, double precision, double precision) from public, anon;
grant execute on function public.create_my_repair_request(text, text, text, text, public.service_type, text, double precision, double precision) to authenticated;

-- Cancel my pending repair request (client only).
create function public.cancel_my_repair_request(p_repair_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.repair_requests
  set status = 'cancelled', cancellation_reason = p_reason
  where id = p_repair_id
    and customer_id = (select auth.uid())
    and status = 'pending';

  if not found then raise exception 'Only your own pending request can be cancelled.'; end if;
end;
$$;
revoke all on function public.cancel_my_repair_request(uuid, text) from public, anon;
grant execute on function public.cancel_my_repair_request(uuid, text) to authenticated;

-- Technician: accept a pending repair request.
create function public.accept_repair_request(p_repair_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tech_profile_id uuid;
begin
  if not public.is_technician() then raise exception 'Only technicians can accept repairs.'; end if;

  select id into v_tech_profile_id from public.technician_profiles
  where user_id = (select auth.uid()) and is_active = true;

  if v_tech_profile_id is null then raise exception 'Technician profile not found.'; end if;

  update public.repair_requests
  set technician_id = v_tech_profile_id, status = 'accepted'
  where id = p_repair_id and status = 'pending' and technician_id is null;

  if not found then raise exception 'This repair request is no longer available.'; end if;
end;
$$;
revoke all on function public.accept_repair_request(uuid) from public, anon;
grant execute on function public.accept_repair_request(uuid) to authenticated;

-- Technician: advance repair status through the workflow.
create function public.advance_repair_status(p_repair_id uuid, p_new_status public.repair_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_technician() and not public.is_admin() then
    raise exception 'Only the assigned technician or an admin can change status.';
  end if;

  update public.repair_requests
  set status = p_new_status
  where id = p_repair_id
    and technician_id in (select id from public.technician_profiles where user_id = (select auth.uid()))
    and (
      (status = 'accepted' and p_new_status = 'en_route')
      or (status = 'en_route' and p_new_status = 'arrived')
      or (status = 'arrived' and p_new_status = 'in_progress')
      or (status = 'in_progress' and p_new_status = 'completed')
    );

  if not found then raise exception 'Cannot advance this repair to the requested status.'; end if;
end;
$$;
revoke all on function public.advance_repair_status(uuid, public.repair_status) from public, anon;
grant execute on function public.advance_repair_status(uuid, public.repair_status) to authenticated;

-- List my repair requests (customer view).
create function public.list_my_repair_requests()
returns table (
  id uuid,
  reference text,
  device text,
  brand text,
  model text,
  problem text,
  service_type public.service_type,
  location text,
  status public.repair_status,
  technician_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select id, reference, device, brand, model, problem, service_type, location, status,
    technician_id, created_at, updated_at
  from public.repair_requests
  where customer_id = (select auth.uid())
  order by created_at desc;
$$;
revoke all on function public.list_my_repair_requests() from public, anon, authenticated;
grant execute on function public.list_my_repair_requests() to authenticated;

-- List available repair requests for technicians (pending, unassigned).
create function public.list_available_repairs()
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
language sql
stable
security invoker
set search_path = ''
as $$
  select id, reference, device, brand, model, problem, service_type, location,
    latitude, longitude, created_at
  from public.repair_requests
  where status = 'pending' and technician_id is null
  order by created_at desc;
$$;
revoke all on function public.list_available_repairs() from public, anon, authenticated;
grant execute on function public.list_available_repairs() to authenticated;

-- Technician summary: rating average and counts.
create function public.technician_review_summary(p_technician_profile_id uuid)
returns table (
  total_reviews bigint,
  average_rating numeric(3,2)
)
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::bigint as total_reviews,
    round(avg(rating), 2)::numeric(3,2) as average_rating
  from public.reviews
  where technician_id = p_technician_profile_id;
$$;
revoke all on function public.technician_review_summary(uuid) from public, anon, authenticated;
grant execute on function public.technician_review_summary(uuid) to authenticated;

-- ===== Comments ============================================================
comment on table public.technician_applications is 'Technician applications. One active application per client. Admin-only status transitions via RPCs.';
comment on table public.application_events is 'Audit trail of application status changes. Inserted only by security-definer RPCs.';
comment on table public.technician_profiles is 'Created on application approval. Promotes user role to technician.';
comment on table public.repair_requests is 'Customer repair requests. Status workflow enforced via RPCs.';
comment on table public.repair_photos is 'Repair photo metadata (Storage object paths). Max 3 per repair, each <= 5MB.';
comment on table public.reviews is 'One review per completed repair, by the customer. Visible to all authenticated users.';
comment on table public.review_replies is 'One reply per review, by the reviewed technician.';

commit;
