# Object Storage Choice: Cloudflare R2 vs UploadThing

Scope: this analysis covers the **single decision** of where to store user-
uploaded point photos for the `pern-map-pins-26` project (feature
`001-map-world-points`). It is not a general comparison of the two
services.

## Context

The feature requires that signed-in users attach **at most one photo**
per point (FR-004). Photos are publicly readable for public points, and
must be addressable from the map view. The current plan
(`specs/001-map-world-points/plan.md`, `research.md`, `data-model.md`,
`contracts/openapi.yaml`) is built around an S3-compatible flow:

- Backend issues a **presigned PUT URL** (`POST /api/points/{id}/photo-upload`)
- Frontend uploads the file directly to object storage
- DB stores `points.photo_key`; the public URL is derived as
  `${R2_PUBLIC_BASE_URL}/${photo_key}` in `backend/src/lib/photoUrl.ts`
- `@aws-sdk/client-s3` is already installed in `backend/package.json`
  (task T002 closed)

## How each option models the problem

### Cloudflare R2

- S3-compatible API; we sign a `PUT` URL on the backend and the
  browser uploads directly. No file passes through our server.
- Public read is enabled per bucket via the R2.dev subdomain or a
  custom domain; URLs follow `${PUBLIC_BASE_URL}/${key}`.
- Auth on the upload step is enforced by **us**: the presign endpoint
  is mounted behind `clerkAuthMiddleware` and validates ownership of
  the target `pointId` before signing.

### UploadThing

- A managed file-upload service that wraps S3-compatible storage
  behind its own SDK (`uploadthing` server + `@uploadthing/react` client).
- The upload flow uses their `<UploadDropzone>` / `useUploadThing`
  hook; the file goes through UploadThing's edge endpoints, which
  validate against a **FileRouter** defined on our backend (with our
  Clerk auth middleware).
- After upload, UploadThing returns a final URL (e.g.
  `https://<app>.ufs.sh/f/<key>`); we store either the URL or the key
  in our DB.

## Comparison for our scenario

| Criterion | Cloudflare R2 | UploadThing |
|---|---|---|
| Time to wire up from zero | ~15 min (bucket + token + CORS + presign endpoint) | ~10 min (app + token + FileRouter + client component) |
| SDK already in `package.json` | Yes (`@aws-sdk/client-s3`) | No (would add `uploadthing` + `@uploadthing/react`) |
| Matches current plan / contract | Yes (`research.md`, `data-model.md`, OpenAPI, T038/T044/T047) | No — requires updates to `research.md`, `data-model.md`, `contracts/openapi.yaml`, and several tasks |
| Upload model | Browser → R2 directly via presigned PUT | Browser → UploadThing edge → their storage |
| Where files live | Our R2 bucket in our Cloudflare account | UploadThing's infrastructure (URLs on `ufs.sh` / `utfs.io`) |
| Vendor lock-in | Low (S3 API is portable to AWS S3, MinIO, Backblaze B2, etc. — change endpoint and keys, keep code) | Higher (their SDK on both sides; migration off requires re-uploading files and replacing component code) |
| Auth integration with Clerk | Manual: our presign endpoint sits behind `clerkAuthMiddleware` and checks ownership before signing | Built-in: FileRouter `middleware()` runs on each upload; we call `getAuth(req)` from `@clerk/express` there |
| Free tier | 10 GB storage; **egress is free** | 2 GB storage |
| Paid tier (relevant scale) | ~$0.015/GB-month storage; class-A ops cheap; **no egress charges** | $10/month "Pro" with ~1 TB storage; usage-based beyond |
| Egress cost on a public map (many concurrent loads of pin photos) | Zero | Counts toward usage / plan |
| Server-side validation hooks (size, mime) | We write our own `uploadPolicy.ts` middleware before signing; harder to enforce post-upload size limits | Built into FileRouter config (`maxFileSize`, `maxFileCount`, `image: { maxFileSize: '4MB' }`) |
| Image transforms (resize, thumbnails) | Not built-in; either Cloudflare Images (separate product) or transform on upload | Not built-in either; same workaround |
| Operability for our case | Standard S3 mental model (boto3, aws-cli, MinIO all interoperable) | Service-specific dashboard |
| Aligns with constitution principle "do not multiply integration points without justification" | Yes (one storage primitive, S3-compatible) | Adds a third-party SaaS in front of storage |
| **Payment method required to use the free tier** | **Yes** — Cloudflare requires a card on file to enable R2 (even when staying within the free quota), as overage protection | **No** — free plan ("Hobby") activates with Google/GitHub OAuth; card only required when upgrading to Pro |

## Payment method requirement (important for hobby / pet projects)

This factor often decides the question on its own for solo developers
and pet projects, so it deserves its own section.

### Cloudflare R2

- A Cloudflare account itself is created without a card.
- Activating the **R2** product in the dashboard prompts for a
  **payment method**, regardless of expected usage. Cloudflare uses
  this as overage protection — they will not charge you while you stay
  inside the free tier (10 GB storage, 1 M Class A ops/month, 10 M
  Class B ops/month, free egress), but the card must be on file before
  R2 can be enabled.
- Accepted: regular debit / credit cards (including most virtual
  cards). PayPal is not accepted at the time of writing.
- Cloudflare exposes spend notifications and limits in the billing
  panel; turn these on to be notified before any unexpected ops-based
  charges accrue.

### UploadThing

- Sign up with Google or GitHub OAuth.
- The **free plan** (≈ 2 GB storage, 100 GB bandwidth/month) is
  activated immediately with **no payment method**.
- A card is only required when upgrading to **Pro** ($10/month) or
  enabling pay-as-you-go overage above the free quota.

### Implication

If avoiding (or postponing) a card on a foreign payment account is a
hard constraint — common in pet projects, in regions with payment
restrictions, or simply when the project's commercial future is
uncertain — UploadThing is the friendlier starting point. R2 still
wins on egress economics and portability once the project is past the
"do I even keep this online?" stage and a card is acceptable.

> Both vendors update billing rules periodically. Verify the current
> wording at https://dash.cloudflare.com (R2 in **Workers & Pages**)
> and https://uploadthing.com/dashboard before you sign up; if it has
> changed, update this document.

## Where UploadThing wins for this project

- **No payment method required to start.** Free plan activates via
  OAuth, with no card on file. R2 requires a card even on the free
  tier.
- **Ergonomics on the frontend.** `<UploadDropzone endpoint="pointPhoto">`
  is genuinely shorter than building a `react-dropzone` + presigned
  PUT flow.
- **Less S3 plumbing.** No need to write `r2.ts`, `uploadPolicy.ts`,
  presign endpoint, or CORS bucket configuration.
- **Built-in size/type enforcement** lives in one config object.
- **2 GB free tier is plenty for development** and for small-scale
  production launch.

## Where R2 wins for this project

- **The plan is already designed around it.** Switching to UploadThing
  is not a swap-in; it forces edits to `research.md`, `data-model.md`
  (semantics of the stored value change), `contracts/openapi.yaml`
  (the `photo-upload` operation signature is different), and T038 /
  T044 / T047 in `tasks.md`.
- **`@aws-sdk/client-s3` is already a dependency** — no new packages.
  Task T002 explicitly added it for R2.
- **Free egress matters.** A public map page that loads many pin
  photos puts cumulative bandwidth on the storage provider. R2's
  zero-egress policy makes this a non-issue forever; UploadThing
  egress is not free outside the "Pro" included quota.
- **Lower lock-in.** S3 API is portable. Today R2; tomorrow MinIO for
  self-hosted dev or AWS S3 in production — same `@aws-sdk/client-s3`
  code, just different endpoint and credentials. UploadThing requires
  rewriting both client and server upload code on migration.
- **Storage stays in accounts we control.** For a project that may
  later host user-generated content with privacy implications, owning
  the bucket is preferable.
- **Aligns with the project's stated constitution principle** of
  minimizing third-party integration surface unless it offsets months
  of custom work — which the small presign endpoint does not justify.

## Risks and how each option handles them

| Risk | R2 | UploadThing |
|---|---|---|
| Forgotten CORS on bucket → uploads fail in browser | Real risk; one-time setup | N/A — handled by them |
| Leaked credentials | Rotate API token in Cloudflare dashboard; existing presigned URLs expire | Rotate UT token; existing direct URLs unchanged (CDN paths) |
| Service outage | Cloudflare-wide outage takes uploads + map tiles together (we already depend on Cloudflare for OSM-style hosting if we go that way) | Adds a second SaaS dependency in addition to Cloudflare |
| Pricing surprise at scale | Predictable: storage + class-A ops; egress free | Step-function pricing past free tier; depends on per-month volume |
| Breaking SDK upgrade | Low (AWS SDK is stable; v3 is current) | Medium (UploadThing SDK is younger and evolving) |

## What changes if we switch to UploadThing

To keep this honest, here is the concrete delta if we switch:

1. `specs/001-map-world-points/research.md` — replace the "Object
   storage: Cloudflare R2" decision with UploadThing and record the
   reason.
2. `specs/001-map-world-points/data-model.md` — `points.photo_key`
   stays as a string but its semantics change (URL or key returned by
   UT). Likely add `photo_url` for clarity.
3. `specs/001-map-world-points/contracts/openapi.yaml` — the
   `POST /api/points/{id}/photo-upload` response schema changes (no
   presigned PUT URL; instead a token / config the frontend hands to
   UT).
4. `specs/001-map-world-points/tasks.md` — rewrite T038, T044, T047.
5. `backend/package.json` — add `uploadthing`; keep
   `@aws-sdk/client-s3` only if used elsewhere, otherwise remove.
6. `frontend/package.json` — add `@uploadthing/react` and `uploadthing`.
7. `backend/.env.example` and `backend/.env` — replace `R2_*` with
   `UPLOADTHING_TOKEN` (and any URL prefix UT exposes).
8. Backend code: introduce `backend/src/uploadthing.ts` (FileRouter)
   instead of `backend/src/lib/r2.ts` + `uploadPolicy.ts` + the presign
   route.
9. Frontend code: replace the planned `react-dropzone` + presign flow
   with `<UploadDropzone>` or `useUploadThing`.

This is roughly half a day of paperwork plus rewrites across a few
files. It is doable; it is not "just change one env var".

## Conclusion

The choice now depends primarily on whether attaching a payment
method to a Cloudflare account is acceptable for this project.

**If a card on file is acceptable**, **stay on Cloudflare R2**. Three
reasons, in order of weight:

1. **Plan alignment.** The spec, data model, contract, and a handful
   of tasks (T002, T038, T044, T047) already encode the R2 / S3 flow.
   Switching is a documentation refactor as much as a code change.
2. **Cost predictability for a public map.** Free egress is the right
   default for an app whose primary surface is a public map that
   serves many image GETs.
3. **Lower lock-in.** S3 API portability lets us move providers
   without rewriting client or server upload code.

**If avoiding a card at this stage is a hard requirement** — common
for pet projects, regions with payment restrictions, or projects whose
commercial future is uncertain — **switch to UploadThing**. The free
plan activates with OAuth only, ergonomics on both ends are friendly,
and 2 GB / 100 GB bandwidth per month is enough to validate the idea.
The cost is a documentation update across `research.md`,
`data-model.md`, `contracts/openapi.yaml` and tasks T038 / T044 / T047
(see "What changes if we switch"), plus higher lock-in and non-zero
egress later.

If the team later decides the chosen path no longer fits — either the
R2 plumbing is too heavy, or UploadThing's free tier / egress costs
become a constraint — this decision should be revisited explicitly,
with the document changes listed in the "What changes if we switch"
section treated as a tracked task.

---

**Decision:** pending — driven by the payment-method constraint
above. Default recommendation is Cloudflare R2 if a card on file is
acceptable; UploadThing otherwise.

**Date of analysis:** 2026-04-28 (op4.7h).
