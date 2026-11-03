-- Run manually as project owner in the intended DEVELOPMENT project's SQL Editor.
-- This is not a migration and is never a browser-callable function.
-- First create/confirm your test account in Supabase Auth, then replace the UUID.
begin;

do $$
declare
  target_user_id uuid := 'REPLACE_WITH_AUTH_USER_UUID';
begin
  if not exists (
    select 1 from auth.users
    where id = target_user_id and email_confirmed_at is not null
  ) then
    raise exception 'Choose an existing, email-confirmed Supabase Auth user.';
  end if;

  update public.user_roles set role = 'admin' where user_id = target_user_id;
  if not found then
    raise exception 'No role row found. Apply the FIXHUB migration first.';
  end if;
end;
$$;

commit;
