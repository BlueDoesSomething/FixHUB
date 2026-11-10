# Technician billing (PayMongo sandbox)

Approved, active technicians can opt into ₱150/month automatically renewing billing. Applying is free. When enforcement is enabled, **only new job acceptance** requires provider-verified `active` status; assigned repairs, histories, and reviews remain available. Web and Android read the same Supabase record. No real charges are supported by this integration.

## Prerequisites

1. Request **Subscriptions API** and **Card Vaulting** access for the PayMongo sandbox account from PayMongo support. The Subscriptions API may return 404 before enablement. Cards only in this UI (Maya is supported by the API but not implemented here; GCash is not supported for automatic subscriptions).
2. Create a **scheduled** (not on-demand) sandbox plan: `amount: 15000` centavos, `currency: PHP`, `interval: monthly` (some PayMongo examples use `month`), `interval_count: 1`, and **no `cycle_count`** so it renews indefinitely. Record its `plan_…` ID. The server checks the plan, invoice Payment Intent, and subscription against the price and sandbox mode.
3. Get `sk_test_…` and `pk_test_…` keys from PayMongo. Do not paste the secret into the app, `.env.local`, chat, or Git. Set `VITE_PAYMONGO_PUBLIC_KEY=pk_test_…` in the web/Android build environment; rebuild the app. Set `VITE_PAYMONGO_RETURN_URL=https://YOUR_DEPLOYED_SITE/technician/subscription?return=1` for Android; use a **real HTTPS deployment**, not localhost or a WebView origin. After external card authentication, close the browser to return to the Android app; it refreshes PayMongo status on resume. For local web testing, the return URL defaults to the current local origin.
4. Set secrets using the Supabase CLI in the linked development project (use a secure terminal/CI secret store, not a committed file):

   ```powershell
   npx supabase secrets set PAYMONGO_SECRET_KEY=sk_test_YOUR_KEY PAYMONGO_PLAN_ID=plan_YOUR_PLAN PAYMONGO_WEBHOOK_SECRET=YOUR_ENDPOINT_SIGNING_SECRET
   ```

   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided to deployed Supabase Edge Functions by Supabase. Never publish the service-role key.

5. Deploy the migration and functions to the **development** project:

   ```powershell
   npx supabase db push --dry-run
   npx supabase db push
   npx supabase functions deploy technician-subscription
   npx supabase functions deploy paymongo-webhook --no-verify-jwt
   ```

   The migration creates the `fixhub_private.technician_billing_settings` singleton with `enforced = false`; **deploying it does not block jobs**. `paymongo-webhook` has no Supabase JWT because PayMongo signs its HTTP requests. The handler rejects invalid HMAC signatures and live-mode events. Do not expose the private schema through the Data API.

6. Register a PayMongo **test-mode** webhook pointing to `https://YOUR_PROJECT_REF.supabase.co/functions/v1/paymongo-webhook`. Subscribe to `subscription.activated`, `subscription.updated`, `subscription.past_due`, `subscription.unpaid`, `subscription.invoice.paid`, and `subscription.invoice.payment_failed` (and `subscription.invoice.updated` if offered). Copy **that endpoint's signing secret** to `PAYMONGO_WEBHOOK_SECRET`. The handler verifies `Paymongo-Signature` and retrieves authoritative subscription state from PayMongo; duplicate and delayed events reconcile to the latest state.

## Verify before enforcement

- Sign in as an approved technician on web, subscribe with a documented PayMongo **test** card, complete 3DS if required, and refresh status. Confirm `active` and the next billing date in the website and Android app. Check that `technician_subscriptions` has the correct PayMongo customer/subscription IDs and the webhook was delivered.
- Check an applicant cannot start billing; a technician without an active profile cannot start billing; repeated clicks/retries cannot create multiple payable subscriptions; a failed first payment stays `incomplete`; cancellation stops future charges and updates status. Test a simulated renewal failure/recovery in the PayMongo sandbox if supported.
- Confirm that previously accepted jobs still advance, and pending requests remain visible. Then, **only after these checks**, an authorized database operator may enable acceptance enforcement:

   ```sql
   update fixhub_private.technician_billing_settings set enforced = true where singleton = true;
   ```

   To immediately restore new-job acceptance if PayMongo/webhooks fail:

   ```sql
   update fixhub_private.technician_billing_settings set enforced = false where singleton = true;
   ```

   Keep enforcement **off** if keys, PayMongo subscription capability, the webhook, the HTTPS return URL, or the test payment is not working. Do not run the rollout SQL in a live project until production billing/legal/compliance are separately planned.
