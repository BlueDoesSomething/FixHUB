# Repair request feature

## Workflow

1. `/client/request`: choose a device, enter brand/model and a 10–5,000-character
   problem description, optionally attach photos, and select home service/drop-off.
2. `/client/request/location`: choose a map pin/GPS position and an optional
   address or landmark. For drop-off this is the customer's starting area, not a shop.
3. `/client/request/review`: review details, photos, service, and map; confirm the
   information and submit. Edit actions return to earlier steps without losing input.
4. `/client/requests/:requestId`: show the saved reference, pending status, photos,
    and location. Saved requests also appear on Home and in Repair History.

New requests support **Smartphone**, **Tablet**, and **Other**. Consoles, laptops,
and desktop/computer categories are no longer offered. The dashboard and repair
form use the same device catalog for validation. Existing history is not deleted;
older drafts keep their details but require choosing a supported device before
continuing or submitting. Nearby recommendations exclude profiles that declare
only retired device categories, without discarding general repair-skill profiles.

## Persistence and submission semantics

Drafts, binary image files, and
submitted requests are stored in IndexedDB (`fixhub-repairs-v1`) on this browser
and origin. They are not uploaded to Supabase, sent to technicians, or synchronized
between devices. `localhost` and `127.0.0.1` are different storage origins.

Draft changes auto-save after a short debounce; leaving a step via its Continue
button waits for a successful save. Refresh restores the saved draft and images.
Submitted requests receive a reference and immutable snapshot. An IndexedDB
transaction saves the request and resets the persisted draft atomically. Repeating
one draft ID is idempotent, preventing duplicate submissions. Storage errors keep
the form intact and do not show a success screen.

Drafts and requests are keyed by the signed-in Supabase user UUID. Signing out or
changing accounts clears the in-memory view. Retired shared-account records are
not imported into real accounts or deleted. Browser storage is not a server-side
security boundary: anyone with access to this browser profile can inspect it.
Clearing site data removes the saved drafts, requests, and photos.

## Photos

- Optional; maximum 3 files, 5 MB per file, and 40 megapixels per decoded image.
- JPEG, PNG, and WebP only. File headers and image decoding are checked, not just
  the filename/MIME value. SVG, HEIC, PDF, and video are not accepted.
- File selection and drag/drop, preview, count, validation messages, and removal.
- Binary Blobs are persisted; temporary object URLs are used only for previews
  and revoked when removed/unmounted.
- Original images are retained locally; EXIF metadata is not stripped.

## Integration boundary

Technician matching, acceptance, quotations, live job statuses, messaging, and
payments remain separate feature stages. A pending local request is not a confirmed
booking and does not authorize a repair charge. Repair History shows only requests
saved for the signed-in account; no example history is populated.

Before production, replace the local storage adapter with authenticated Supabase
operations and private Storage uploads. Resolve ownership from Supabase Auth
UUIDs, use the PostgreSQL schema for coordinates and photo metadata, repeat
validation on trusted server endpoints, and preserve idempotency and transactional
submission behavior. Do not silently fall back to local storage when a cloud request
fails.

## Tests

```powershell
npm run test:unit -- --run
```

With `npm run dev` running:

```powershell
npm run test:e2e -- --spec tests/e2e/specs/repair-request.cy.ts
```

Browser tests use an isolated test database, locally generated PNG images, mocked
GPS where needed, and intercepted map tiles. No cloud resources are required.
