# FIXHUB: Supabase + PostgreSQL

## Current state

Use **Supabase Auth, PostgreSQL, and Storage** with a **development project**. The older Firebase foundation is preserved for reference, not required for Supabase.

### What is done

- **Database schema** — two versioned SQL migrations cover the full data model:
  - Auth foundation: `profiles`, `user_roles`, `get_my_account()`, signup triggers
  - Business data: `technician_applications`, `application_events`, `technician_profiles`, `repair_requests`, `repair_photos`, `reviews`, `review_replies` + 15 RPCs with RLS on every table
- **Frontend auth** — login/signup forms wired to Supabase Auth:
  - `src/services/supabaseAuth.ts` — signUp, signIn, signOut, session restore, auth state listener
  - `src/stores/auth.ts` — Supabase-only session management; missing configuration never grants access
  - `src/components/landing/home/AuthForm.vue` — email/password authentication without account shortcuts
  - `src/router/index.ts` — route guards for protected routes (client/technician/admin)
  - `src/main.ts` — restores existing session on app load
- **Typed database client** — `src/types/database.ts` covers all tables, enums, and RPCs

### What is not done yet

- **Business-data integration is pending** — technician applications, repair requests, and reviews stores are not yet wired to the Supabase RPCs. Directories, rankings, reports, and review eligibility start empty. Browser-saved repair drafts and requests use the signed-in user's UUID; this is not cloud synchronization.
- **Storage buckets** are not configured yet (repair photos, application documents).

### Cloud project status

The full schema (3 migrations) is applied to the live Supabase cloud project `ssdxvkxpncrkhlvsbixj`. A third migration (`20261103000000_fix_reserved_keyword_var.sql`) fixes a critical bug where the PL/pgSQL variable name `current_role` (a PostgreSQL reserved keyword) shadowed the system function in security-definer RPCs, causing `submit_my_application` and `create_my_repair_request` to reject valid clients.

All 15 RPCs are verified working via an end-to-end smoke test (`tests/supabase/live-smoke.mjs`) covering: application submission → admin approval → role promotion → repair request creation → technician acceptance → status workflow → review → reply → review summary. Three test accounts exist: client, technician, and admin.

The hosted smoke test requires `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SMOKE_CLIENT_EMAIL`, `SUPABASE_SMOKE_CLIENT_PASSWORD`, `SUPABASE_SMOKE_ADMIN_EMAIL`, and `SUPABASE_SMOKE_ADMIN_PASSWORD` in the local process environment. It changes database records and a test account's role, so it also requires the explicit opt-in `SUPABASE_SMOKE_ALLOW_WRITES=yes`. Use only a development project and dedicated test accounts; never commit their passwords or run this test as part of APK packaging.

## 1. Create a development project

1. Sign in at <https://supabase.com/dashboard> and create an organization if needed.
2. Create a project named **fixhub-dev**. Review the current plan, billing terms, and limits before confirming.
3. Choose a region near your users, such as **Singapore if available** for a Philippines-focused app.
4. Generate a strong database password and save it in your password manager. **Do not paste it into chat, Git, or a `VITE_` variable.**
5. Wait for provisioning. Keep the Data API enabled for `public`. Do not expose `fixhub_private` through the API.

You do **not** need to install PostgreSQL manually to use hosted Supabase. You do not need a separate Express server.

## 2. Apply the database migrations

From the repository's `Fixhub/` directory:

```powershell
npm install
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
```

The project reference appears in the dashboard project URL/settings. Enter CLI credentials only into the trusted CLI prompts. The checked-in local `project_id = "fixhub"` is not your hosted project reference.

Review the dry-run. For this fresh development project, it should apply two migrations:

```text
supabase/migrations/20261101000000_auth_profiles.sql
supabase/migrations/20261102000000_business_data.sql
supabase/migrations/20261103000000_fix_reserved_keyword_var.sql
```

When you are ready to change that development database:

```powershell
npx supabase db push
```

### What the migrations create

| Object | Purpose |
| --- | --- |
| `public.profiles` | Private user name, phone, city, and timestamps, keyed by Supabase Auth UUID |
| `public.user_roles` | Protected `client`, `technician`, or `admin` role |
| `public.get_my_account()` | Read the signed-in user's profile and authoritative role |
| `public.technician_applications` | Technician applications with admin-controlled status workflow |
| `public.application_events` | Audit trail of application status changes (security-definer RPCs only) |
| `public.technician_profiles` | Created on application approval; promotes user to technician |
| `public.repair_requests` | Customer repair requests with status workflow and auto-generated reference number |
| `public.repair_photos` | Repair photo metadata (Storage object paths, max 3 per repair, each <= 5MB) |
| `public.reviews` | One review per completed repair, by the customer (1-5 stars) |
| `public.review_replies` | One reply per review, by the reviewed technician |
| `public.is_admin()` / `public.is_technician()` | Role-check helpers for RLS policies |
| RPCs | `submit_my_application`, `admin_start_review`, `admin_request_info`, `admin_reject_application`, `admin_approve_application`, `create_my_repair_request`, `cancel_my_repair_request`, `accept_repair_request`, `advance_repair_status`, `list_my_repair_requests`, `list_available_repairs`, `technician_review_summary` |
| `fixhub_private` helpers | Signup and timestamp triggers, not browser-callable APIs |

Existing object-name collisions stop the migration transaction rather than overwriting tables. If anything already exists unexpectedly, stop and inspect before proceeding.

**Alternative for a brand-new project without CLI linking:** paste each migration file into that project's SQL Editor and run it once (in order). Do not also push it blindly through the CLI. Before moving to CLI-managed changes, reconcile the migration history (`supabase db pull` / reviewed migration repair as appropriate). Once using migrations, deploy schema changes through migration files rather than ad-hoc dashboard edits.

## 3. Add public browser configuration

Copy `.env.example` to `.env.local` without overwriting an existing local environment file. In the project's **Connect** panel/API keys settings, find the project API URL and **publishable key**:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
```

Only these public API values belong in the browser. The client also accepts a legacy **anon** key for older projects/local CLI stacks; it rejects secret/service-role keys and database connection strings. This check is only a configuration guard: **anything placed in `VITE_` variables is bundled publicly**, so rotate a secret immediately if it was accidentally exposed.

Restart `npm run dev` after changing environment variables. Sign-in always requires Supabase Auth. Missing configuration or failed authentication shows an error and never grants access. Tests use isolated service/network fixtures rather than a runtime fallback.

## 4. Configure Auth in the hosted dashboard

These settings are **hosted-project settings**; editing local `supabase/config.toml` does not apply them remotely:

- Enable email/password signup.
- Enable email confirmation and choose a minimum password length of **12 or more**.
- For local web development, use `http://localhost:5173` as Site URL and allow `http://127.0.0.1:5173` if you use that origin too.
- Add exact callback/reset URLs for the frontend authentication routes. Add the real HTTPS deployment URL before deployment; do not broadly allow arbitrary redirects.
- Use test accounts only at this stage. Review Supabase's current email limits and configure your own SMTP before inviting external users.

You may create a confirmed **test user** in **Authentication -> Users** after applying the migration. Its `profiles` and `user_roles` rows should appear automatically. Every user starts as `client`, even if their email is `admin@fixhub.com` or their metadata says `admin`.

Sign-in requires an existing Supabase Auth account and its password. Signup requires at least 12 characters; email addresses never determine account privileges.

## 5. Create the first administrator deliberately

As project owner, open `supabase/admin/bootstrap-admin.sql`, replace `REPLACE_WITH_AUTH_USER_UUID` with your confirmed test account's **Auth user UUID**, then run the edited SQL in the intended development project's SQL Editor.

- This file is not a migration and is not exposed as an API.
- An unconfirmed/missing account is rejected.
- There is no "first user becomes admin", email shortcut, or client-controlled role update.
- Users may edit their own allowed profile fields, never their role, UUID, or timestamps.
- Admin business-data access is enforced through `public.is_admin()` in RLS policies and security-definer RPCs.

## 6. Run the checks

```powershell
npm run test:unit -- --run
npm run test:supabase:sql
npm run build
```

The SQL check runs the actual migrations against embedded PostgreSQL (PGlite) with a minimal Supabase Auth **test fixture**. It verifies RLS, grants, signup/backfill behavior, role escalation prevention, private helpers, profile constraints, and bootstrap behavior. It is **not** an end-to-end test of the hosted Auth server, JWT verification, email delivery, or PostgREST. Those need validation against the development project.

Run `npm audit` before production deployment as a separate dependency-security check.

### Optional full local Supabase stack

Docker Desktop must be running in Linux-container mode. Match `db.major_version` in `supabase/config.toml` to the hosted project (`show server_version;` in SQL Editor), then:

```powershell
npm run supabase:start
npm run supabase:status
```

Local endpoints use API port `54321`, PostgreSQL `54322`, Studio `54323`, and test email inbox `54324`. Use only the local public/anon key in browser configuration. The first startup downloads container images. Do not run the full stack unless you want those local resources/downloads.

To stop it without intentionally deleting its data:

```powershell
npm run supabase:stop
```

Do not run database reset commands against an environment containing data you want to keep.

### Refresh the SDK types after schema changes

With the development project linked and migrations applied:

```powershell
npx supabase gen types typescript --linked --schema public | Set-Content -Encoding utf8 src/types/database.ts
```

The checked-in types in `src/types/database.ts` describe both migrations. Generated types should become the source of truth after the remote schema exists. Regenerate from the intended project, review the diff, then run the build.

## Next milestones

1. ~~Wire login/signup to Supabase Auth; add session restoration and protected routes.~~ **Done.**
2. Connect profile editing to `updateMySupabaseProfile`.
3. Wire technician applications store to `submit_my_application` and admin RPCs (`admin_start_review`, `admin_request_info`, `admin_approve_application`, `admin_reject_application`).
4. Wire repair requests store to `create_my_repair_request`, `cancel_my_repair_request`, `accept_repair_request`, `advance_repair_status`, `list_my_repair_requests`, `list_available_repairs`.
5. Wire reviews store to the `reviews` and `review_replies` tables; populate leaderboard/report aggregates with authorized database queries.
6. Configure Storage buckets for repair photos and application documents with object-level policies.

Storage uploads must use private buckets and object-level policies; PostgreSQL stores file metadata/object paths, not base64 file contents. Upload authorization and cleanup need to be designed alongside the owning application/repair records, so no unrestricted upload policy is introduced.

References: [Vue quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/vue), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [migrations](https://supabase.com/docs/guides/deployment/database-migrations), [Storage security](https://supabase.com/docs/guides/storage/security/access-control).
