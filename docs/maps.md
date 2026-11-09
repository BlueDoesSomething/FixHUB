# FIXHUB maps

## Included in this feature

- Leaflet 1.9 renders real OpenStreetMap street tiles without an API key.
- The repair location page supports clicking the map, dragging the destination
  pin, keyboard selection, and an explicit **Use My Current Location** button.
- Confirmation saves latitude/longitude and the optional typed address in the
  repair draft, now persisted locally in IndexedDB as part of the
  [repair request flow](repair-request-flow.md). It is not a Firebase/PostgreSQL write.
- Tracking and active repairs display unavailable/empty states until real job
  and location data is connected. The directory does not populate fictional pins.
- Marker labels and tooltips are created as DOM text, not interpolated HTML.
- Resize handling supports responsive layouts, modals, and cached Ionic pages.
- Client location maps and the technician dashboard automatically follow device
  GPS while open, subject to browser/device permission. Manual pin selection or
  address search stops following GPS so a later fix cannot overwrite that choice.
- On the technician dashboard, **Share live location** explicitly enables GPS
  publishing; **Save & share location** instead saves a fixed service base.
  **Stop sharing** removes either kind from the customer directory.
- Customers can open **Find Technicians** from their home page, choose a starting
  point, and filter shared technician locations within 5–100 km. Distances are
  straight-line estimates. **Get directions** opens Google Maps in a new tab/app;
  there is no embedded turn-by-turn navigation or assigned-repair tracking.
- The repair request's location and review steps automatically recommend nearby
  technicians, nearest first, for the selected home/drop-off service. Applications
  declare repair skills, not supported devices; customers must confirm device
  support. Legacy records with explicit device tags are filtered accordingly.

Run `npm run dev`, sign in, then open `/client/request/location` to use the picker.
Supabase authentication is required for protected routes.

## Enable technician locations

Apply `supabase/migrations/20261104000000_technician_locations.sql` after the
existing migrations, then apply
`supabase/migrations/20261107000000_live_technician_locations.sql`
(for a linked project: `npx supabase db push`). No secret key
or extra map API key is required for development. The code does not apply remote
migrations automatically.

If these functions are missing, signed-in users see a configuration message
instead of a generic connection error. GPS, search, and manual map selection stay
usable privately, but saving and sharing stay disabled until the location status
can be loaded. Technician-directory polling pauses after the missing-deployment
response and resumes when the user presses **Refresh**; this avoids retrying a
server error every 15 seconds.

An approved, active technician can open `/technician/dashboard` and allow GPS,
search for an address and choose a result, or click/drag a pin. GPS detection alone
does not publish anything. Choose **Share live location** for foreground updates,
or add a service-address label and explicitly save a fixed pin. Only
signed-in users can discover shared locations; inactive or demoted technicians
are excluded. Database RPCs resolve the technician from the signed-in identity,
validate coordinates, and never expose application phone/email/account IDs.

Customers can browse `/client/request/matching` directly or use the home-page
button. That starting point stays in page memory and is not published or saved
as a repair request. Confirmed repair pins are saved in the existing local draft;
the review step uses that confirmed pin rather than silently moving the address.

## Live sharing and updates

Live technician positions are sent at most once every 15 seconds, only after an
explicit sharing action and while the dashboard map is visible and foregrounded.
GPS must have delivered a fresh fix within 30 seconds. Leaving the page, hiding
the app, choosing a manual pin, or losing GPS stops sharing. Returning to the map
resumes private GPS detection but **does not** silently resume publishing.

The server supplies a 90-second expiry for each live update; expired live pins
are excluded from the directory. The client also removes expired snapshots on
its 15-second reconciliation tick. A disconnected last pin may remain until that
expiry; it is not an indication of technician availability or acceptance.
Fixed shop pins are labeled separately and do not expire. There is no location
history table and no Android background-location permission/service.

Authenticated customers subscribe to a **private** Supabase Realtime Broadcast
topic, `technician-directory`. Database triggers broadcast only `{refresh:true}`
when locations or eligibility change; receivers re-read the safe directory RPC.
No application rows, contact details, account IDs, or raw coordinates are put in
the broadcast. The migration installs the Realtime receive policy; no public
Postgres Changes publication or direct client access to other technicians' rows
is required. Enable Realtime on the Supabase project. If the socket is unavailable,
the UI states this and polls every 15 seconds. Cached Ionic pages and background
apps stop GPS, subscriptions, and polling; returning fetches a fresh snapshot.

## Location data

Only a user's explicitly selected pin or device GPS position is shown on the
repair picker. The default Makati viewport is not a selected address. Driving
routes and ETA calculations are not connected; live directory pins are opt-in.

The original repair picker (`/client/request/location`) still treats its address
field as a delivery/service note only. The new technician and nearby-directory
pickers support explicit address search via a Nominatim-compatible endpoint.
Typing alone does not request a search or move a pin; users choose a result.
Reverse geocoding is not implemented. Moving a searched pin clears the old label
so it cannot silently describe a different location.

## GPS and privacy

Location maps may start foreground GPS detection when opened; the **Use My Current
Location** button also starts or retries detection. Detection alone does not share
the location. Browser permission and HTTPS are required, except for localhost development. If access is denied,
unavailable, or times out, users can still choose a pin manually. GPS accuracy is
shown so users can correct an imprecise result. Leaving the page or manually
choosing a pin prevents a late GPS result from overwriting that selection.
The Android manifest declares coarse/fine location permissions. Rebuild the APK
for manifest changes; device GPS and permission prompts still require testing on
the target device. Android uses `@capacitor/geolocation` for runtime permission
and native GPS (both one-shot requests and watches); browsers use
`navigator.geolocation` over HTTPS/localhost. Existing native permission is checked
before requesting it. Approximate Android permission is accepted without asking
again for precise access, and accuracy is shown. Native requests allow up to 30
seconds for a first fix and enable the Android LocationManager fallback when
Google Play Services cannot provide location. Errors distinguish disabled GPS,
denied permission, timeouts, and device location/Play Services settings.
Foreground watches are cleared on leave/background/unmount. No background location
permission is used. Rebuild/sync Android (`npm run android:sync`) and install a new
APK after upgrading; an already-installed APK will not receive this code by itself.

### Android device check

1. Build/sync with `npm run android:sync`, build the APK in Android Studio (or run
   `.\gradlew.bat :app:assembleDebug` from the `android` directory with Java 21
   and the Android SDK installed), and install the updated APK.
2. Enable Android **Location**, open a location map, and grant **While using the
   app**. Test both **Precise** and **Approximate** permission; either should
   produce a pin and an accuracy estimate without repeated permission prompts.
3. Deny permission or turn off Location, then tap **Use My Current Location**.
   Confirm the explanation appears and manual map selection still works. Re-enable
   permission/Location and retry the button.
4. Leave the map or background the app. GPS updates must stop. On return, manual
   selections must stay manual; live publishing must not resume without consent.

All three dashboard workspaces also have a persistent mobile header: tap the menu
icon for direct access to the role's pages. The five-button bottom navigation and
desktop sidebar remain available, with system safe-area spacing on mobile.

Map tiles are fetched directly from the tile provider. The provider receives the
browser's IP/referrer and the requested map area. Pressing **Search** sends that
query to the geocoding provider; merely typing an address label does not. Google
Maps receives the destination and, if selected, the starting point only when the
user opens directions. Share a shop/service base rather than a private home if
the exact home location should not be visible to customers.

## Address search provider

The development default is `https://nominatim.openstreetmap.org/search`. Requests
are explicit (no autocomplete), cached in memory, limited to five results, and
serialized at least 1.1 seconds apart per running app instance. Errors, timeouts,
empty results, and denied GPS leave manual map selection available. Test traffic
is mocked and never reaches the public search service.

Review <https://operations.osmfoundation.org/policies/nominatim/> before deployment.
Per-browser throttling is **not** an aggregate application-wide rate limit. For
production traffic or installed apps, use a suitable hosted provider or proxy
with application identification and server-side rate limiting. Both build-time
settings must be provided together for an override:

```dotenv
VITE_MAP_SEARCH_URL=https://your-provider.example/search
VITE_MAP_SEARCH_ATTRIBUTION="Your provider's required attribution"
```

The endpoint must accept `q`, `format=jsonv2`, `limit` and return Nominatim-style
`place_id`, `display_name`, `lat`, `lon` rows. Enable browser CORS as appropriate.
Never place a secret provider API key in a public `VITE_` setting.

## Tile service configuration and usage policy

Default URL: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.
Visible OpenStreetMap attribution is retained. Browser HTTP caching is used;
there is no prefetch, bulk download, or offline-download feature.

**OSM's public tile servers are community-funded, best-effort infrastructure,
not an unlimited production API.** Review and comply with their policy:
<https://operations.osmfoundation.org/policies/tiles/>. Keep attribution visible,
do not strip the browser referrer, and do not automate tile scraping. Choose a
commercial provider or self-hosted tiles before substantial production traffic.

To use another compatible raster tile service, set both public build-time values
in `.env.local`, then restart Vite/rebuild:

```dotenv
VITE_MAP_TILE_URL=https://your-provider.example/{z}/{x}/{y}.png
VITE_MAP_TILE_ATTRIBUTION="Your provider's required attribution"
```

Use the provider's required credit text and OSM attribution where applicable.
Do not put secret server credentials in `VITE_` variables; browser values are public.

## Testing

```powershell
npm run test:unit -- --run
npm run test:supabase:sql
```

With the development server running in another terminal:

```powershell
npm run test:e2e -- --spec tests/e2e/specs/map.cy.ts
npm run test:e2e -- --spec tests/e2e/specs/technician-location.cy.ts
```

Browser tests intercept tile requests with a local fixture, so automated runs do
not generate traffic against OSM's public tile servers or request real device GPS.
