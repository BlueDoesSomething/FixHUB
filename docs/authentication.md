# Google and email authentication

FIXHUB uses **Supabase Auth**, not the older Firebase configuration. Google OAuth,
email/password login, email confirmation/resend, and password recovery now have
working handlers and callback pages. Server-assigned database roles still control
dashboard access; Google metadata and email addresses never grant admin access.

## Required hosted settings

These are Supabase/Google dashboard settings, not settings that an APK build can
enable. Do not put Google secrets or SMTP passwords in `.env.local` or `VITE_` values.

### 1. Redirect URLs

In **Supabase → Authentication → URL Configuration**, set Site URL to the actual
HTTPS website (localhost only for development). Add these exact allowed redirects:

```text
http://localhost:5173/auth/callback
http://localhost:5173/auth/callback?flow=recovery
http://127.0.0.1:5173/auth/callback
http://127.0.0.1:5173/auth/callback?flow=recovery
com.fixhub.app://auth/callback
com.fixhub.app://auth/callback?flow=recovery
```

Also add the two `/auth/callback` URLs on the deployed website's HTTPS origin.
If deployed under a subdirectory, include that base path. Do not allow arbitrary
redirects or configure the APK's `https://localhost` WebView origin as the public
Site URL. The app automatically chooses the native callback inside the APK.

### 2. Google provider

1. In Google Cloud, configure the OAuth consent screen and a **Web application**
   OAuth client. If the consent screen is in Testing mode, add the intended Google
   accounts as test users; complete Google's publication/verification requirements
   before a public rollout.
2. Add Supabase's callback as a Google **Authorized redirect URI**:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
   Use the exact callback shown by the Google provider panel if using a custom
   Supabase domain. Do not enter the native FIXHUB callback in Google Cloud.
3. In **Supabase → Authentication → Sign In / Providers → Google**, enable Google
   and save that web client's ID and secret. The secret belongs only in Supabase.
4. Keep secure account-linking defaults. Do not disable email verification or add
   email-based role shortcuts to work around a failed sign-in.

Android opens OAuth in a system browser/custom tab, not Google's unsupported
embedded WebView sign-in. PKCE keeps the verifier in the app, then the native
callback returns a one-use authorization code. Both cold starts and an already-open
APK are handled. The manifest accepts only `com.fixhub.app://auth/callback`.

### 3. Email delivery

In **Supabase → Authentication**, enable email/password signup, email confirmation,
and a minimum password length of 12 or more. For real users, configure **Custom
SMTP** with a verified sender/domain and the provider's required SPF/DKIM records.
Supabase's default email service has strict limits and can restrict delivery to
authorized test addresses. App code cannot remove those restrictions.

- Check Auth/email-provider logs for rejected, rate-limited, or undelivered emails.
- Check Spam/Junk and sender/domain verification.
- Default confirmation/reset templates should retain `{{ .ConfirmationURL }}` so
  Supabase verifies the email and redirects to the supplied callback.
- A pending confirmation is shown as a success notice, not an error. Resend and
  recovery show neutral notices that do not disclose whether an account exists.

## Email links and different devices

Default PKCE email links must finish on the same browser/app installation where
the request started. On Android, open the link on the phone with FIXHUB installed.
Opening it elsewhere may verify the email but cannot transfer the original app's
PKCE verifier. Return to the original app and try email/password login, or request
a fresh link there. A used/expired code never silently authenticates another user.

If cross-device email completion is required, customize the Supabase templates to
send a **one-use token hash** directly to the callback instead. The callback accepts
only `signup`, `email`, and `recovery` email token types through `verifyOtp`:

- Confirmation target: `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup`
- Recovery target: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`

The recovery redirect already has `?flow=recovery`, hence the different separator.
Use `&amp;` for separators inside HTML attributes. Test the actual email client;
some mail clients restrict custom app schemes. Production verified HTTPS App Links
are an alternative but require a real domain and signing-certificate association.
Never put session access/refresh tokens in links; the app rejects implicit sessions.

## Build and test

After adding the native browser plugin/intent filter, run `npm run android:sync`,
rebuild the APK, and install it. An existing APK does not receive these changes.
For local testing, `supabase/config.toml` includes the callback allowlist; it does
not update the hosted project's configuration.

```powershell
npm run test:unit -- --run
npm run test:android
npm run build
# With npm run dev running separately:
npm run test:e2e -- --spec tests/e2e/specs/auth.cy.ts
```

Automated tests stub authentication and email requests. They do not create hosted
users, send email, or contact Google. Before distribution, test Google sign-in and
cancellation, signup/confirmation/resend, recovery, expired links, and cold/warm APK
returns with actual test accounts and the configured Google/SMTP providers.
