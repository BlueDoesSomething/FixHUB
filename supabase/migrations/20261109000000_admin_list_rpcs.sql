-- Admin-only RPCs to bypass RLS for user/application listing.
-- These run as security definer (service_role owner) so admins can see all rows.
-- They require a verified admin identity: direct PostgREST calls by any
-- authenticated non-admin user are rejected with an exception.

create or replace function public.admin_list_profiles()
returns table (
  user_id uuid,
  full_name text,
  city text,
  phone text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  return query
  select p.user_id, p.full_name, p.city, p.phone,
         coalesce(r.role, 'client')::text,
         p.created_at
  from public.profiles p
  left join public.user_roles r on r.user_id = p.user_id;
end;
$$;

revoke all on function public.admin_list_profiles() from public, anon;
grant execute on function public.admin_list_profiles() to authenticated;

create or replace function public.admin_list_applications()
returns table (
  id uuid,
  applicant_id uuid,
  full_name text,
  email text,
  contact_number text,
  city text,
  years_experience int,
  brands text[],
  specializations text[],
  experience_description text,
  service_type public.service_type,
  coverage_area text,
  working_days text[],
  working_hours text,
  status public.application_status,
  created_at timestamptz,
  updated_at timestamptz,
  reviewer_id uuid,
  reviewed_at timestamptz,
  feedback text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required.'; end if;
  return query
  select id, applicant_id, full_name, email, contact_number, city,
         years_experience, brands, specializations, experience_description,
         service_type, coverage_area, working_days, working_hours,
         status, created_at, updated_at, reviewer_id, reviewed_at, feedback
  from public.technician_applications;
end;
$$;

revoke all on function public.admin_list_applications() from public, anon;
grant execute on function public.admin_list_applications() to authenticated;
