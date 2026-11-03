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

Run `npm run dev`, sign in, then open `/client/request/location` to use the picker.
Supabase authentication is required for protected routes.

## Location data

Only a user's explicitly selected pin or device GPS position is shown on the
repair picker. The default Makati viewport is not a selected address. Live
technician tracking, driving routes, and ETA calculations are not connected.

The address field is a delivery/service note only. **Address search and reverse
geocoding are not implemented**; entering text does not move the pin. A geocoding
provider and a routing provider should be selected separately if those features
are required. Leaflet itself does not supply either API.

## GPS and privacy

The app requests device location only after a button click. Browser permission
and HTTPS are required, except for localhost development. If access is denied,
unavailable, or times out, users can still choose a pin manually. GPS accuracy is
shown so users can correct an imprecise result. Leaving the page or manually
choosing a pin prevents a late GPS result from overwriting that selection.

Map tiles are fetched directly from the tile provider. The provider receives the
browser's IP/referrer and the requested map area. The app does not send typed
addresses to a geocoder.

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
```

With the development server running in another terminal:

```powershell
npm run test:e2e -- --spec tests/e2e/specs/map.cy.ts
```

Browser tests intercept tile requests with a local fixture, so automated runs do
not generate traffic against OSM's public tile servers or request real device GPS.
