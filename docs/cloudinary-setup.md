# Cloudinary Setup (for `pern-map-pins-26`)

Goal: configure a Cloudinary account so the backend can issue **signed
direct uploads** for point photos and the frontend can render them via
URL-based transformations. This document describes only what is
specific to our app — see [Cloudinary docs](https://cloudinary.com/documentation)
for the full reference.

When this is needed: before starting Phase 5 / US3 task **T038**
(`POST /api/points/{pointId}/photo-upload`). The plain
`POST /api/points` (without a photo) does not need Cloudinary, so
backend work on T037 can begin in parallel.

> Background and rationale for choosing Cloudinary over R2 /
> UploadThing / Storj for this project lives in
> [`object-storage-alternatives.md`](./object-storage-alternatives.md).

---

## 1. What we will set up in Cloudinary

Two things, in this order:

1. **Account credentials** (Cloud name, API Key, API Secret) — the
   bare minimum the SDK needs.
2. **A signed upload preset** that pins the upload policy (folder,
   allowed formats, size limit) so the backend only has to sign — it
   does not have to repeat those parameters per request.

Optional hardening (Section 4) restricts what file types and
transformations are accepted at the account level.

---

## 2. Obtain account credentials

1. Sign up at <https://cloudinary.com/users/register_free>. Email or
   Google / GitHub OAuth — **no payment method required** for the
   free plan.
2. Open **Dashboard** (the default landing page after login).
3. In the **Account Details** / **API Keys** card, copy three values:

| Cloudinary field | What it is | Lives in | Public? |
|---|---|---|---|
| **Cloud name** | Identifier of your "cloud"; appears in every URL: `res.cloudinary.com/<cloud_name>/image/upload/...` | `backend/.env` and `frontend/.env` (`VITE_…`) | Yes — safe to expose |
| **API Key** | App identifier for signed requests | `backend/.env` | Mostly public, but treat as low-grade secret |
| **API Secret** | HMAC key used to sign upload requests | `backend/.env` only | **Secret** — never ship to the browser |

> The Dashboard hides the API Secret behind a "Reveal" / eye icon.
> Click it once, copy, paste into `backend/.env`, do not paste it
> anywhere else.

> The default key pair is **master-level** for your cloud. It works
> for development out of the box. For anything that goes online,
> generate a **Restricted API key** instead and use that one in
> `backend/.env` — see Section 3.

---

## 3. Create an additional API key (recommended for any deployed env)

Cloudinary lets every plan create additional API keys alongside the
default one. Using a separate key in `backend/.env` limits the blast
radius if the env file ever leaks and lets us rotate the application
key without rotating the master one.

### 3.1. What our backend actually does

Operations our backend performs against Cloudinary:

| Operation | Where it runs | What it needs |
|---|---|---|
| `cloudinary.utils.api_sign_request(...)` | local HMAC | nothing — never hits Cloudinary |
| `POST /v1_1/<cloud>/image/upload` (browser, with our signature) | Cloudinary verifies signature | signing key allowed to upload |
| `cloudinary.uploader.destroy(public_id)` (replace / delete photo, T044) | Cloudinary | media-library write |
| `cloudinary.api.resource(public_id)` (optional metadata reads) | Cloudinary | media-library read |

All of the above are technical / media-library operations. We do
**not** use Cloudinary for billing, user management, or key
provisioning from the backend.

### 3.2. Roles available when creating an API key

> **Reference:** [Roles and Permissions overview](https://cloudinary.com/documentation/permissions_overview)
> in the Cloudinary docs is the source of truth here. The summary
> below is a working interpretation, not a substitute for the docs.

Cloudinary is in the middle of migrating from a legacy access-bundle
model (Master Admin / Admin / Technical Admin / Billing / Reports /
Media Library Admin / Media Library User) to a more granular **Roles
and Permissions** system based on system policies and roles scoped
to the account, a product environment, or a specific folder /
collection. According to the docs, broad migration of existing
accounts starts in May 2026; new free accounts created since
February 2026 may already be on the new system. To check, open
**Console Settings** and look for **Role Management** — its presence
indicates the new system is active for your account.

In practice, what you see when assigning a role to a freshly created
API key today depends on which system your account is on:

- **Legacy view (most existing accounts as of writing):** a picker
  with three "access bundles" — **Master Admin**, **Admin**,
  **Tech Admin** (sometimes labelled Technical Admin).
- **Roles and Permissions view (new free accounts):** a more
  granular picker where you can attach individual system roles
  (e.g. Media Library Admin) or, on paid plans, custom roles built
  from system policies. Free plan exposes system roles and access
  bundles via the Console only.

#### If the legacy picker is what you see

| Role | What it can do | Suitable for our backend? |
|---|---|---|
| **Master Admin** | Full control of the cloud, including creating, deleting, and rotating other API keys, plus account-level configuration | Overkill — we never need to touch other keys from the backend |
| **Admin** | Full operational access (Media Library, upload presets, transformations, settings) — but cannot manage other API keys | Reasonable starting point. More than we strictly need |
| **Tech Admin** | Technical scope only (uploads, transformations, technical configuration) — narrower than Admin | Also sufficient and a tighter scope than Admin |

For day-zero pet-project work, **Admin** is the path of least
friction. We should plan to revisit this once we are deployed and
once it is clear whether the account has been migrated to the new
Roles and Permissions system — at that point we can downscope to a
narrower role (likely **Media Library Admin** or a folder-scoped
role limited to `pern-map-pins/`).

#### If the Roles and Permissions picker is what you see

Pick a system role with the smallest scope that still covers the
operations in Section 3.1:

- Upload images (preset-based, signed)
- Destroy images (replace / cleanup)
- Read upload presets

A safe starting point on the new system is **Media Library Admin**
restricted to the relevant product environment, or a folder role
scoped to `pern-map-pins/`. See
[System roles and policies list](https://cloudinary.com/documentation/permissions_system_roles_policies)
for the exact policy contents of each predefined role.

### 3.3. Create the key

1. **Settings (gear icon) → Access Keys** (also labelled **API
   Keys** on some plans).
2. **Generate New API Key**.
3. Name it something obvious, e.g. `pern-map-pins-backend-dev`
   (and later `…-prod` for production).
4. Pick a **role** per Section 3.2 — **Admin** is the default
   recommendation.
5. **Save** and copy the new `API Key` and `API Secret`
   immediately — the secret is shown **once**.

### 3.4. Use this key in `backend/.env`

The values that go into `CLOUDINARY_API_KEY` and
`CLOUDINARY_API_SECRET` (Section 6) should be **this** key's pair —
not the default key from Section 2.

Keep the default key in your password manager only, as a
"break-glass" credential. It does **not** belong in any `.env`,
deploy panel, or commit.

### 3.5. Skip-this-step exception

For a one-off local smoke test (Section 7) before any deploy, the
default key from Section 2 is acceptable. Replace it with the
additional key before the first push to a remote host.

---

## 4. Create the signed upload preset

A **preset** is a named set of upload parameters stored on Cloudinary's
side. The backend signs the upload request *with the preset name*; the
preset itself enforces the policy. This is cleaner than repeating the
policy on every signature.

### 4.1. Create the preset

1. **Settings (gear icon) → Upload → Upload presets → Add upload preset**.
2. Configure as follows:

| Field | Value | Why |
|---|---|---|
| **Preset name** | `pern-map-pins-points` | Stable name we'll reference by env var |
| **Signing mode** | **Signed** | Backend must sign every upload; no anonymous browser uploads |
| **Folder** | `pern-map-pins/points` | Keeps point photos isolated from anything else we may add later |
| **Resource type** | `image` | We never accept video / raw / pdf for points |
| **Allowed formats** | `jpg, png, webp, heic, avif` | Mirrors what we accept on the form; aligns with `uploadPolicy.ts` |
| **Max file size** | `5242880` (5 MB) | Same value the backend middleware will enforce; defence in depth |
| **Use filename** | Off | Generated public IDs only; user filenames leak into URLs otherwise |
| **Unique filename** | On | Prevents collisions on retries |
| **Overwrite** | Off | Each upload gets a fresh public_id |
| **Eager transformations** | leave empty | Build thumbnails via URL transforms on demand |
| **Auto-tagging / categorization addons** | Off | Out of scope, costs credits |

3. **Save**.

### 4.2. Why "signed" and not "unsigned"

An *unsigned* preset would let any browser hit Cloudinary directly
without our backend, which conflicts with the project's rule that
**Express is the source of truth for who can upload**
(`plan.md` → Constitution Check). With a signed preset, every upload
must carry an HMAC signature minted by our Express endpoint behind
`clerkAuthMiddleware`, so we keep authorization in one place.

---

## 5. Optional but recommended hardening

These are account-level settings under **Settings → Security**.

| Setting | Value | What it buys us |
|---|---|---|
| **Restricted media types** | Disallow everything except `image` | If anyone bypasses preset enforcement, Cloudinary still rejects non-image uploads |
| **Auto-delete unused resources** | Off | We manage lifecycle from our backend; auto-delete would surprise us |
| **Strict transformations** | Off | Allowing arbitrary URL transforms is fine for our use; turn this on later only if the credit usage gets noisy |
| **Notification URL** | leave empty | We do not currently consume Cloudinary webhooks |

---

## 6. Environment variables

### 6.1. `backend/.env`

`CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` should be the
**additional Admin / Tech Admin key** from Section 3, not the
default pair from Section 2.

```env
# --- Cloudinary -----------------------------------------------------------
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=replace_me_with_additional_key_secret
CLOUDINARY_UPLOAD_PRESET=pern-map-pins-points
# Folder is also encoded in the preset, but keeping it as an env var
# lets local dev / staging / prod write into different prefixes.
CLOUDINARY_UPLOAD_FOLDER=pern-map-pins/points
```

### 6.2. `frontend/.env`

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

Only `cloud_name` is needed in the browser bundle — to compose URLs
like `https://res.cloudinary.com/<cloud_name>/image/upload/w_240,h_240,c_fill,f_auto,q_auto/<public_id>.jpg`.
**API key and API secret must never be exposed to the frontend.**

After editing `.env` files, restart `npm run dev` — `tsx watch` does
not re-read environment variables on the fly.

---

## 7. Smoke test (after credentials and preset are in place)

> The backend code paths for this exist after task **T038**. Until
> then, you can validate the credentials with the curl below.

Sign a test upload from a temporary local script:

```ts
import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const timestamp = Math.floor(Date.now() / 1000);
const signature = cloudinary.utils.api_sign_request(
  { timestamp, upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET },
  process.env.CLOUDINARY_API_SECRET!,
);
console.log({ timestamp, signature });
```

Then upload a sample image:

```bash
curl -X POST "https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload" \
  -F "file=@./sample.jpg" \
  -F "api_key=${CLOUDINARY_API_KEY}" \
  -F "timestamp=${TIMESTAMP}" \
  -F "signature=${SIGNATURE}" \
  -F "upload_preset=${CLOUDINARY_UPLOAD_PRESET}"
```

A successful response returns JSON with `secure_url` and `public_id`.

In the Cloudinary Dashboard, the file should appear under **Media
Library → pern-map-pins / points/**.

---

## 8. Notes

- Keep `backend/.env` out of git (it already is via `.gitignore`).
  Do not paste `CLOUDINARY_API_SECRET` into chat, screenshots, or
  shared snippets.
- For staging and production, set the same env vars in the host's
  dashboard (Railway / Fly / Render). It is fine to use the **same
  Cloudinary cloud** with different `CLOUDINARY_UPLOAD_FOLDER`
  prefixes (e.g. `pern-map-pins-staging/points`,
  `pern-map-pins-prod/points`) to keep environments isolated inside
  one free-tier account.
- If the free-tier credit budget becomes tight later, the natural
  next step is upgrading Cloudinary, **not** moving providers — the
  abstraction in `backend/src/lib/cloudinary.ts` (added in T038)
  isolates the rest of the codebase from this concern.

---

## 9. Checklist (tick as you go)

### Account and credentials

- [x] Cloudinary account created at <https://cloudinary.com/users/register_free>
- [x] `Cloud name` copied from Dashboard
- [ ] Default `API Key` and `API Secret` retrieved from Dashboard
      (kept in password manager, **not** in `.env`)

### Additional API key (recommended for any deployed env)

> **Note (2026-04-28):** I selected **Admin** for
> `pern-map-pins-backend-dev` to keep things moving. Cloudinary is
> rolling out a more granular **Roles and Permissions** system (see
> Section 3.2 and the
> [Roles and Permissions overview](https://cloudinary.com/documentation/permissions_overview)
> docs). Once this account is on the new system — or before the
> first non-local deployment, whichever comes first — revisit this
> choice and downscope the key (likely **Media Library Admin** or a
> folder-scoped role limited to `pern-map-pins/`).

- [x] **Settings → Access Keys → Generate New API Key**
- [x] Key named `pern-map-pins-backend-dev` (or analogous)
- [x] Role chosen: **Admin** (temporary — to be tightened later;
      see note above)
- [x] New key's `API Key` and `API Secret` copied immediately
      (the secret is shown only once)
- [ ] Default key kept only in password manager as break-glass credential
- [ ] Revisit role and downscope to a narrower role
      (e.g. Media Library Admin or folder-scoped role under
      `pern-map-pins/`) before first non-local deploy

### Upload preset

> **Note (2026-04-28):** Smoke test confirmed the preset exists and
> accepts signed uploads, but the uploaded file landed at the cloud
> root rather than `pern-map-pins/points/`. That means the preset's
> **Folder** field (and likely the other policy fields) is not set
> yet — the items below should be reopened and applied in the
> Console.

- [x] Preset `pern-map-pins-26` created under **Settings → Upload → Upload presets**
- [x] Preset **Signing mode** set to **Signed**
- [ ] Preset **Folder** set to `pern-map-pins/points`
- [ ] Preset **Resource type** set to `image`
- [ ] Preset **Allowed formats** set to `jpg, png, webp, heic, avif`
- [ ] Preset **Max file size** set to `5242880` (5 MB)
- [ ] Preset saved with the policy fields above

### Optional hardening

- [ ] **Restricted media types** under **Settings → Security** restricted to `image`

### Environment variables

- [x] `CLOUDINARY_CLOUD_NAME` set in `backend/.env`
- [x] `CLOUDINARY_API_KEY` in `backend/.env` is the **additional
      Admin / Tech Admin key**, not the default one
- [x] `CLOUDINARY_API_SECRET` in `backend/.env` is that additional
      key's secret, not the default one
- [x] `CLOUDINARY_UPLOAD_PRESET` set in `backend/.env`
- [x] `CLOUDINARY_UPLOAD_FOLDER` set in `backend/.env`
- [ ] `VITE_CLOUDINARY_CLOUD_NAME` set in `frontend/.env`
- [ ] `npm run dev` restarted after editing `.env`

### Smoke test

Run via `pnpm --filter backend exec tsx scripts/cloudinary-smoke.ts`
(or `npx tsx backend/scripts/cloudinary-smoke.ts` from the repo root).

- [x] Local HMAC signature produced and accepted by Cloudinary
      (signed upload returned 200 with `public_id` and `secure_url`)
- [x] Sample image uploaded successfully via the smoke script
- [x] Uploaded file reachable via the public `secure_url` (HEAD 200)
- [x] Cleanup `destroy` confirmed (no leftover test asset in Media Library)
- [ ] Uploaded file visible under `pern-map-pins/points/` in the
      Media Library — **blocked on the preset Folder setting above**

### Repository changes (done by the assistant; tick once merged)

- [ ] `backend/.env.example` updated with `CLOUDINARY_*` placeholders
- [ ] `frontend/.env.example` updated with `VITE_CLOUDINARY_CLOUD_NAME`
- [ ] `specs/001-map-world-points/research.md` updated to record
      Cloudinary as the chosen object storage with rationale
- [ ] `specs/001-map-world-points/data-model.md` clarifies that
      `points.photo_key` stores the Cloudinary `public_id`
- [ ] `specs/001-map-world-points/contracts/openapi.yaml` reflects
      the Cloudinary signature response shape for
      `POST /api/points/{pointId}/photo-upload`
- [ ] `specs/001-map-world-points/tasks.md` T038 / T044 / T047
      reworded for Cloudinary
