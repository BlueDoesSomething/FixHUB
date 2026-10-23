# Technician Applications — Backend Specification

Specification for persisting and reviewing **technician applications** behind the
frontend module (`/become-a-technician` and `/admin/applications`).

The current frontend is fully functional against an in-memory + `localStorage`
store (`src/stores/technicianApplications.ts`). This document describes the
PostgreSQL schema and REST API to make the same behaviour authoritative on the
server. The frontend store maps 1:1 onto the endpoints below.

---

## 1. Domain model

A **technician application** belongs to a FIXHUB **user account** (a customer may
apply without creating a duplicate account). Once approved, the account is
promoted to a **technician** and the application links to the resulting
technician profile.

### Statuses

| Status             | Meaning                                                        |
| ------------------ | -------------------------------------------------------------- |
| `pending`          | Submitted, waiting for initial review.                          |
| `under_review`     | A reviewer is currently assessing the credentials.              |
| `needs_information`| Reviewer requested more detail; the applicant can resubmit.     |
| `approved`         | Approved; technician profile created/activated.                 |
| `rejected`         | Declined; may be re-applied for if policy allows.               |

### Review actions → transitions

| Action          | From                                    | To                 |
| --------------- | --------------------------------------- | ------------------ |
| `start-review`  | `pending`, `needs_information`          | `under_review`     |
| `request-info`  | `pending`, `under_review`               | `needs_information`|
| `approve`       | `pending`, `under_review`, `needs_info` | `approved`         |
| `reject`        | `pending`, `under_review`, `needs_info` | `rejected`         |

`request_info` and `reject` **require a note**; `approve` accepts an optional note.

---

## 2. PostgreSQL schema (migration SQL)

```sql
-- 0001_technician_applications.sql
BEGIN;

CREATE TYPE application_status AS ENUM (
  'pending', 'under_review', 'needs_information', 'approved', 'rejected'
);

CREATE TYPE review_action AS ENUM (
  'start_review', 'request_info', 'approve', 'reject'
);

-- Applications ---------------------------------------------------------------
CREATE TABLE technician_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          application_status NOT NULL DEFAULT 'pending',

  -- personal
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  contact_number  TEXT NOT NULL,
  city            TEXT NOT NULL,

  -- professional
  years_experience      NUMERIC(3,0) NOT NULL CHECK (years_experience >= 0),
  brands                TEXT[] NOT NULL DEFAULT '{}',
  brands_other          TEXT,
  specializations       TEXT[] NOT NULL DEFAULT '{}',
  specializations_other TEXT,
  experience_description TEXT NOT NULL,

  -- service
  service_type    TEXT NOT NULL CHECK (service_type IN ('Home Service', 'Drop-off', 'Both')),
  coverage_area   TEXT NOT NULL,
  working_days    TEXT[] NOT NULL DEFAULT '{}',
  working_hours   TEXT NOT NULL,

  -- reviewer / outcome
  reviewer_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  feedback            TEXT,
  allow_reapply       BOOLEAN NOT NULL DEFAULT TRUE,
  technician_profile_id UUID,             -- FK added after technicians table

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One active application per user (rejected apps may be superseded by a new row).
CREATE UNIQUE INDEX uq_application_user_active
  ON technician_applications (user_id)
  WHERE status <> 'rejected';

CREATE INDEX idx_application_status      ON technician_applications (status);
CREATE INDEX idx_application_user        ON technician_applications (user_id);

-- Uploaded files (certificates, IDs, work photos) ----------------------------
CREATE TABLE technician_application_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES technician_applications(id) ON DELETE CASCADE,
  category        TEXT NOT NULL CHECK (category IN ('certificate', 'work_photo')),
  file_name       TEXT NOT NULL,
  content_type    TEXT NOT NULL CHECK (content_type IN ('application/pdf','image/jpeg','image/png')),
  size_bytes      BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880), -- 5 MB
  storage_key     TEXT NOT NULL,           -- object-store key (S3/GCS), never the bytes
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_application ON technician_application_documents (application_id);

-- Immutable audit trail of every status change -------------------------------
CREATE TABLE technician_application_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES technician_applications(id) ON DELETE CASCADE,
  status          application_status NOT NULL,
  action          review_action,
  note            TEXT,
  actor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_application ON technician_application_events (application_id, created_at);

-- Existing accounts promoted on approval -------------------------------------
CREATE TABLE technicians (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  application_id    UUID REFERENCES technician_applications(id) ON DELETE SET NULL,
  verification_status TEXT NOT NULL DEFAULT 'verified',
  rating            NUMERIC(2,1) NOT NULL DEFAULT 0,
  completed_jobs    INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE technician_applications
  ADD CONSTRAINT fk_application_technician
  FOREIGN KEY (technician_profile_id) REFERENCES technicians(id) ON DELETE SET NULL;

-- keep updated_at fresh -------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_application_touch
  BEFORE UPDATE ON technician_applications
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;
```

### Approval side-effect (transactional)

On `approve`, within one transaction: set `status='approved'`, set
`reviewer_id`/`reviewed_at`/`feedback`, insert a `technicians` row (if none),
set `technician_profile_id`, set the user's `role='technician'`, and append a
`technician_application_events` row. Rejections set `allow_reapply` per policy and
also append an event row.

---

## 3. REST API

All routes are JSON. Auth uses the session bearer/JWT of the logged-in user.
Admin routes require `role = 'admin'`.

### Applicant endpoints

| Method | Path                                    | Auth          | Description                       |
| ------ | --------------------------------------- | ------------- | --------------------------------- |
| `POST` | `/api/technician-applications`          | customer      | Submit a new application.         |
| `GET`  | `/api/technician-applications/me`       | customer      | Current user's application.       |
| `PATCH`| `/api/technician-applications/me`       | customer      | Edit + resubmit (→ `pending`).    |
| `POST` | `/api/technician-applications/me/documents` | customer  | Upload one file (multipart).      |

`POST /api/technician-applications` request body:

```json
{
  "applicant": { "fullName": "Marco Lopez", "email": "marco@email.com",
                 "contactNumber": "+63 917 555 2211", "city": "Quezon City" },
  "professional": { "yearsExperience": "6", "brands": ["Samsung", "Xiaomi"],
                    "brandsOther": null,
                    "specializations": ["Screen Replacement"],
                    "specializationsOther": null,
                    "experienceDescription": "..." },
  "service": { "serviceType": "Both", "coverageArea": "Quezon City",
               "workingDays": ["Mon","Tue"], "workingHours": "9:00 AM - 7:00 PM" },
  "documents": [ { "category": "certificate", "fileName": "id.pdf",
                   "contentType": "application/pdf", "sizeBytes": 210000,
                   "storageKey": "uploads/..." } ]
}
```

Responses return the full application resource:

```json
{
  "id": "app-...",
  "status": "pending",
  "applicant": { "...": "..." },
  "professional": { "...": "..." },
  "service": { "...": "..." },
  "documents": [ { "id": "...", "category": "certificate", "fileName": "id.pdf",
                   "contentType": "application/pdf", "sizeBytes": 210000,
                   "downloadUrl": "https://.../signed" } ],
  "review": { "reviewer": "Admin User", "reviewedAt": "2026-10-04T13:40:00Z",
              "feedback": "...", "allowReapply": true },
  "history": [ { "at": "...", "by": "Marco Lopez", "status": "pending",
                 "note": "Application submitted" } ],
  "technicianProfileId": null,
  "createdAt": "2026-10-02T09:15:00Z",
  "updatedAt": "2026-10-04T13:40:00Z"
}
```

### Admin endpoints

| Method | Path                                                | Description                          |
| ------ | --------------------------------------------------- | ------------------------------------ |
| `GET`  | `/api/admin/technician-applications`                | List + filter (`?status=&q=&page=`)  |
| `GET`  | `/api/admin/technician-applications/:id`            | Application detail.                  |
| `POST` | `/api/admin/technician-applications/:id/review`     | Apply a review action.               |
| `GET`  | `/api/admin/technician-applications/stats`          | Status counts for the dashboard.     |

`POST .../review` request body:

```json
{ "action": "approve", "note": "Credentials verified." }
```

- `action`: `start-review` | `request-info` | `approve` | `reject`
- `note`: required (min 5 chars) for `request-info` and `reject`.
- Response: updated application resource (or `409` if the transition is illegal).

### Error shape

```json
{ "error": { "code": "invalid_transition", "message": "Cannot approve a rejected application." } }
```

Common codes: `validation_error` (422), `invalid_transition` (409),
`not_found` (404), `forbidden` (403).

---

## 4. Validation rules (mirror the frontend)

- `fullName` ≥ 2 chars; `email` valid; `contactNumber` matches `^[+()\d\s-]{7,}$`;
  `city` ≥ 2 chars.
- `yearsExperience` integer ≥ 0; `brands` and `specializations` non-empty.
- `experienceDescription` ≥ 20 chars.
- `serviceType` ∈ {Home Service, Drop-off, Both}; `coverageArea` ≥ 2 chars;
  `workingDays` non-empty; `workingHours` ≥ 3 chars.
- At least one document total.
- Documents: MIME ∈ {application/pdf, image/jpeg, image/png}; size ≤ 5 MB;
  max 5 files per category.

---

## 5. Frontend ↔ API mapping

| Frontend (`useTechnicianApplications`) | API                                            |
| -------------------------------------- | ---------------------------------------------- |
| `submit(payload)`                      | `POST /api/technician-applications`            |
| `mine(userId)`                         | `GET /api/technician-applications/me`          |
| `resubmit(id, payload)`                | `PATCH /api/technician-applications/me`        |
| `all()` / `counts()`                   | `GET /api/admin/technician-applications[/stats]` |
| `review(id, action, note)`             | `POST /api/admin/technician-applications/:id/review` |

### Migration notes

1. Replace the `localStorage` load/persist layer with API calls; keep the
   reactive `state` and component contracts unchanged.
2. File uploads: switch the `FileReader` data URLs to `multipart/form-data`
   uploads returning a `storageKey` + signed `downloadUrl`.
3. The demo `auth.ts` store is in-memory only; real sessions must resolve
   `user_id` server-side before linking an application.
