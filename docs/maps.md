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
- The technician dashboard has an address-search/GPS/map picker. **Save & share
  location** writes the chosen service base to Supabase; **Stop sharing** removes
  it from the customer directory without deleting the technician's saved pin.
- Customers can open **Find Technicians** from their home page, choose a starting
  point, and filter shared technician locations within 5–100 km. Distances are
  straight-line estimates. **Get directions** opens Google Maps in a new tab/app;
  there is no embedded turn-by-turn navigation or live tracking.

Run `npm run dev`, sign in, then open `/client/request/location` to use the picker.
Supabase authentication is required for protected routes.

## Enable technician locations

Apply `supabase/migrations/20261104000000_technician_locations.sql` after the
existing migrations (for a linked project: `npx supabase db push`). No secret key
or extra map API key is required for development. The code does not apply remote
migrations automatically.

An approved, active technician can open `/technician/dashboard`, search for an
address and choose a result, use **Use My Current Location**, or click/drag a pin.
Add a service-address label if needed, then explicitly save to share it. Only
signed-in users can discover shared locations; inactive or demoted technicians
are excluded. Database RPCs resolve the technician from the signed-in identity,
validate coordinates, and never expose application phone/email/account IDs.

Customers can browse `/client/request/matching` directly or use the home-page
button. Their starting point stays in page memory and is not published or saved
as a repair request. Refresh the directory to retrieve location-sharing changes.

## Location data

Only a user's explicitly selected pin or device GPS position is shown on the
repair picker. The default Makati viewport is not a selected address. Live
technician tracking, driving routes, and ETA calculations are not connected.

The original repair picker (`/client/request/location`) still treats its address
field as a delivery/service note only. The new technician and nearby-directory
pickers support explicit address search via a Nominatim-compatible endpoint.
Typing alone does not request a search or move a pin; users choose a result.
Reverse geocoding is not implemented. Moving a searched pin clears the old label
so it cannot silently describe a different location.

## GPS and privacy

The app requests device location only after a button click. Browser permission
and HTTPS are required, except for localhost development. If access is denied,
unavailable, or times out, users can still choose a pin manually. GPS accuracy is
shown so users can correct an imprecise result. Leaving the page or manually
choosing a pin prevents a late GPS result from overwriting that selection.
The Android manifest declares coarse/fine location permissions. Rebuild the APK
for manifest changes; device GPS and permission prompts still require testing on
the target device. No background location permission or location watcher is used.

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
