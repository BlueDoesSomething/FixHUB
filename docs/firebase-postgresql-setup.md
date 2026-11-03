# FIXHUB: Firebase + PostgreSQL

> **Previous foundation, retained for reference.** Supabase Auth + PostgreSQL + Storage
> is now the chosen direction. Start with [supabase-setup.md](supabase-setup.md).
> Supabase Auth is connected to the frontend. Do not provision Firebase/Cloud SQL
> for the Supabase setup.

## Architecture

This project uses **Firebase SQL Connect** (formerly **Data Connect**) backed by
**Cloud SQL for PostgreSQL**. It does **not** use Cloud Firestore or Realtime
Database for website records.

- **Firebase Authentication:** sign-up, passwords, sessions, and user identity.
- **SQL Connect:** authenticated, predefined API operations and a generated web SDK.
- **PostgreSQL:** users, technician applications, review history, technician profiles,
  and repair requests.
- **Cloud Storage (future):** certificates, IDs, repair photos, and other files.
  Files should not be stored as base64 strings in PostgreSQL.

The Firebase API and CLI still use the name `dataconnect`; that is expected.
No standalone Express server is needed for these initial database operations.
Trusted server code may be added later for payments, notifications, or integrations.

## Current implementation boundary

This is the **initial backend foundation**, not a finished production backend.
The Vue business-data screens are **not connected** to Firebase; the `.env` values
below do not change that. They use empty states and browser-local user submissions.

Implemented API operations:

- Create/read/update the authenticated user's profile. New profiles are always customers.
- Submit and read your own text-only technician application.
- Admin-only listing, starting reviews, requesting information, rejection, and approval.
- Approval atomically creates a technician profile, promotes the user, and adds an audit event.
- Create/list your own repair requests; cancel only your own pending request.

Not yet implemented: application document uploads and verification, application
editing/resubmission, technician assignment and repair status transitions, chat,
notifications, payments, pagination beyond the initial 100-record cap, and frontend integration.
Do not use the text-only approval flow to verify real technicians until document
verification is implemented. Current app sign-in uses Supabase, not this foundation.

`docs/technician-applications-backend.md` is the earlier proposed REST design.
The GraphQL sources in `dataconnect/` describe this implementation; the old REST
endpoints are not deployed or used. One application is retained per user in this
initial schema, with resubmission to be implemented on that same record.

## 1. Develop locally without a Firebase account or billing

Use Node.js 22 or newer (this workspace uses Node.js 24). From `Fixhub/`:

```powershell
npm install
npm run backend:generate
npm run test:backend
```

To leave the backend running for development:

```powershell
npm run backend:emulators
```

- Authentication emulator: `127.0.0.1:9099`
- SQL Connect emulator: `127.0.0.1:9399`
- Local project ID: `demo-fixhub`

The SQL Connect emulator uses an embedded local PGlite database. You do not need
to install PostgreSQL manually for these tests. The CLI downloads its emulator
on first use, so an internet connection is needed initially.

The test command starts fresh emulators, creates test accounts, checks access
controls through the real client SDK, and stops the emulators afterward. Stop an
already-running emulator before running it. Local test data is disposable; this
setup does not configure an emulator export/import persistence workflow.

On some Windows setups, the CLI prints `read ECONNRESET` while shutting down the
SQL Connect emulator. In this workspace the tests complete successfully with
exit code 0 despite that shutdown warning. Check the test summary and exit code;
connection errors during test execution should still be investigated.

The checked-in `demo-` project is intentional: these commands never provision
Cloud SQL or deploy anything. Do not substitute a production project in the tests.

## 2. Create your Firebase project

1. Open <https://console.firebase.google.com/> and create a project, e.g. `FIXHUB`.
2. Google Analytics is optional for this stage.
3. In **Project settings → Your apps**, register a **Web** app.
4. Copy its `firebaseConfig` values into a local `.env.local`, using `.env.example`
   as the template. These values are used when frontend integration is added.
5. In **Authentication → Sign-in method**, enable **Email/Password**.
6. Check **Authentication → Settings → Authorized domains** and add `localhost`
   for development if it is not already present. Add your real website domain later.

Only public Firebase web configuration is needed to connect the browser app.
**Never share a service-account JSON, private key, database password, or user password.**
Never put Admin SDK credentials or a PostgreSQL connection string in a `VITE_`
environment variable: those values are bundled into browser code.

## 3. Provision PostgreSQL only after reviewing costs

In the Firebase console, open **SQL Connect** (older interfaces call it Data
Connect), review the currently available trial and billing terms, and create the
service and PostgreSQL instance when you are ready.

Cloud SQL is a hosted database and can incur ongoing charges. Firebase currently
documents limited-time trials, including an eligible Spark-plan trial. Trial
availability and terms can change; do not assume the production database is
permanently free. Billing budget alerts are not spending caps.

Before provisioning, choose your location carefully. The local configuration
uses Singapore (`asia-southeast1`) as a starting point for a Philippines-focused
app. Confirm availability and use the same region for SQL Connect and Cloud SQL.

Match the real resources to `dataconnect/dataconnect.yaml`, or update that file:

- Service ID: `fixhub`
- PostgreSQL database: `fixhub`
- Cloud SQL instance ID: `fixhub-postgres`
- Connector ID: `main`

After you have explicitly chosen to create cloud resources, authenticate the CLI:

```powershell
npx firebase login
npx firebase use --add
```

Add the real project under a separate alias such as `development`; keep the
default `demo-fixhub` project for local work. Review database migration changes:

```powershell
npx firebase dataconnect:sql:diff --project development
```

Only when ready to apply the reviewed migration and publish the backend:

```powershell
npx firebase deploy --only dataconnect --project development
```

Review any provisioning, schema migration, and billing prompts. The configuration
uses `COMPATIBLE` validation rather than deleting unrelated database objects.

## 4. Administrator access

No public API accepts a role from the browser. There is deliberately no
"first registered user becomes admin" behavior and no email-based admin shortcut.

Create the account in Firebase Auth and create its PostgreSQL user profile first.
As the Firebase project owner, run `dataconnect/admin/bootstrap-admin.gql` in the
Firebase SQL Connect VS Code extension against the intended environment. Pass
that account's Firebase Auth **UID**, not its email.

The bootstrap file is outside the deployed connector and marked `NO_ACCESS`.
Do not expose it through a browser endpoint. Admin privileges for database
operations are checked against the authoritative PostgreSQL user role.

## Next stage

For the chosen Supabase integration, follow `supabase-setup.md` instead. This
legacy Firebase setup is retained only for reference and emulator tests.

When integrating role and workflow status reads, request server-fresh results
with `{ fetchPolicy: 'SERVER_ONLY' }` rather than relying on a previous cached
response. Server authorization always checks the database, independently of any
cached client profile.

References:

- <https://firebase.google.com/docs/sql-connect>
- <https://firebase.google.com/docs/sql-connect/quickstart>
- <https://firebase.google.com/docs/sql-connect/authorization-and-security>
- <https://firebase.google.com/docs/sql-connect/pricing>
