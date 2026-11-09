# Build FIXHUB's Android APK on GitHub

## First-time setup

1. Push this Git repository's contents to GitHub. `.github/`, `android/`, `package.json`, and `capacitor.config.ts` must be at the repository root (the local `Fixhub/` directory). Do not place the entire project inside another `Fixhub/` folder on GitHub.
2. Include `package-lock.json` and the complete native `android/` source, including `android/gradle/wrapper/gradle-wrapper.jar`. Build output, copied web assets, local SDK paths, and keystores are ignored automatically. Do not commit `.env.local`.
3. Open **Settings > Secrets and variables > Actions > Variables > New repository variable** and add:

   | Variable | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Your project API URL, such as `https://YOUR_PROJECT_REF.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Your `sb_publishable_...` key (a legacy `anon` key is also accepted) |

   The workflow also accepts these two names as Actions secrets if you already configured them there; repository variables take precedence. These are **public client settings** bundled inside the APK. Never supply database passwords, secret keys, service-role keys, or connection strings.

   Optional: set both `VITE_MAP_TILE_URL` and `VITE_MAP_TILE_ATTRIBUTION` as repository variables to change map providers. Leave both unset to use the existing OpenStreetMap defaults.

4. Enable GitHub Actions for the repository if prompted. The workflow must be on the default branch for its manual **Run workflow** button to appear.

## Run a build and download

1. Open **Actions > Build Android APK > Run workflow**.
2. Choose your branch and click **Run workflow**. Source changes pushed to `main` or `master` also build automatically.
3. Wait for the green check, open the completed run, and scroll to **Artifacts**.
4. Download **FIXHUB-android-debug-N**, extract the ZIP, and copy `app-debug.apk` to your Android phone.
5. Open the APK and allow installation from that source if Android asks. Android 7.0 or newer is required. Artifacts are retained for 14 days.

The app's web assets are bundled in the APK; no localhost server is needed on the phone. Supabase and online maps still require internet access. Existing unconnected business-data features remain unconnected; packaging does not implement those backend queries. Email-link callbacks and native device features should be tested separately before distribution.

For Google sign-in and email confirmation/recovery, configure the hosted provider,
SMTP, and `com.fixhub.app://auth/callback` redirect allowlist as described in
[authentication.md](authentication.md). The APK uses a system browser for Google
OAuth and accepts the native callback on both cold and warm starts.

## What the workflow does

`.github/workflows/android-apk.yml` installs the locked npm dependencies, validates the public configuration, builds the web app, runs Capacitor sync, and calls Gradle's `:app:assembleDebug`. GitHub supplies Node.js 22, Temurin Java 21, Android SDK 36, and Build Tools 36.0.0. Actions and the Gradle download are checksum-pinned. The APK uses app ID **`com.fixhub.app`** and name **FIXHUB**.

This is a **debug-signed testing APK**, not a signed production release or Play Store bundle. No signing secrets are required. GitHub's temporary runners may generate different debug signing keys, so an update may require uninstalling the old APK first. Uninstalling deletes that installation's local drafts and requests. Stable production updates require a protected, persistent release keystore and a separate release-signing setup.

## Local Android Studio workflow (optional)

Install Node.js 22+, Android Studio with SDK 36/Build Tools 36.0.0, and Java 21. Configure your public `.env.local` values, then run from the repository root:

```powershell
npm ci
npm run android:sync
npm run android:open
```

Or build from a terminal with a configured Android SDK:

```powershell
cd android
.\gradlew.bat :app:assembleDebug
```

The output is `android/app/build/outputs/apk/debug/app-debug.apk`. Edit `capacitor.config.ts` and the native Android package/application ID together if you need a different app ID before publishing.
