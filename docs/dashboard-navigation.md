# FIXHUB: Supabase dashboard navigation

## Common tasks

| Task | Dashboard location |
| --- | --- |
| Find the API URL and publishable key | Connect panel or project API settings |
| Create or inspect an authentication account | Authentication > Users |
| Configure email/password sign-in | Authentication > Sign In / Providers |
| Set localhost and allowed redirect URLs | Authentication > URL Configuration |
| Find a user's UUID | Authentication > Users > open the account |
| Inspect an application profile | Table Editor > public.profiles |
| Inspect an application role | Table Editor > public.user_roles |
| Inspect repair requests and reviews | Table Editor > corresponding public tables |
| Run reviewed migrations or administrator bootstrap SQL | SQL Editor |
| Manage uploaded files and bucket policies | Storage |

Dashboard labels and icon positions can change. Use section names rather than a fixed icon position.

The `auth.users` table is managed by Supabase. Create accounts through **Authentication > Users** or the supported Auth APIs, not by inserting into `auth.users` through Table Editor.

## Create development test accounts

1. Open **Authentication > Users > Add user**.
2. Enter your own test email address and a unique password of at least 12 characters.
3. For a dedicated development account, use the dashboard's email-confirmation option if available. Otherwise complete the normal confirmation email flow before signing in.
4. Save passwords in a password manager or an ignored local environment file, never in repository documentation or source code.

New accounts receive their `profiles` and `user_roles` rows from the database trigger. Every account starts as `client`; an email containing "admin" or "tech" does not assign privileges.

For the first administrator, follow `supabase/admin/bootstrap-admin.sql` and the instructions in [supabase-setup.md](supabase-setup.md). Technician promotion uses the reviewed application-approval flow.

## Browser and Android configuration

Only the API URL and publishable key (or legacy anon key) belong in public application configuration. A publishable key is not an administrator credential; database access still needs appropriate RLS policies and authenticated users.

- Local web development: use the ignored `.env.local` file as described in [supabase-setup.md](supabase-setup.md).
- GitHub Android builds: add the two public repository variables as described in [android-apk.md](android-apk.md).
- Hosted smoke tests: use the dedicated process-environment variables and explicit write opt-in documented in [supabase-setup.md](supabase-setup.md).

Never put service-role keys, secret keys, database passwords, or account passwords in `VITE_` variables, GitHub artifacts, or tracked files. Keep email confirmation enabled for real users and configure production HTTPS callback URLs before deployment.
