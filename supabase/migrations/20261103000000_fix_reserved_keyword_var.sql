-- Fix: rename PL/pgSQL variable 'current_role' to 'v_role' in security-definer RPCs.
-- 'current_role' is a PostgreSQL reserved keyword (system function returning the
-- current user name). Using it as a variable name caused the role lookup to return
-- 'postgres' (the SECURITY DEFINER owner) instead of the actual user's app_role,
-- making submit_my_application and create_my_repair_request reject valid clients.

create or replace function public.submit_my_application(
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

create or replace function public.create_my_repair_request(
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
