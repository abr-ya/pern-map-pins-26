# Object Storage Alternatives for `pern-map-pins-26`

> **Implementation note:** The **repository uses Cloudinary** for point photos. The comparison below (including R2, UploadThing, Storj, etc.) is **decision support material**; Cloudflare R2 and other S3-style options are **not** integrated in application code.

This document widens the original
[R2 vs UploadThing](./r2-vs-uploadthing.md) comparison to other
services that satisfy two requirements:

1. Suitable for our use case — one user-uploaded photo per map point,
   public read for public points, modest pet-project scale.
2. **No payment method required to activate the free tier.** This is
   what disqualifies Cloudflare R2 in the constrained scenario from
   the previous document.

The candidates evaluated below are: Cloudinary, ImageKit, Supabase
Storage, Firebase Storage (Spark), Storj. Cloudflare R2 and
UploadThing are kept in the table for reference. Services that fail
the "no card" requirement (AWS S3, Backblaze B2 in current policy,
Bunny.net Storage) are not detailed.

## What our app actually needs from storage

- Authenticated direct upload from the browser of a single image per
  point, gated by Clerk session and ownership of the target point.
- Stable, public read URL for each photo so the map and detail views
  can render an `<img src>`.
- Ideally, server-side or URL-based transforms (thumbnails for the
  list / popup; full size for detail) to avoid storing two copies and
  to keep payload small on the public map.
- Reasonable bandwidth headroom — a public map page tends to load many
  small images at once.
- Survives a small viral spike without an immediate billing event.

Anything beyond that (video, complex pipelines, on-the-fly AI) is out
of scope.

## Candidate 1 — Cloudinary

Image- and video-focused CDN and processing platform, on the market
since 2012.

- **Free tier:** 25 monthly "credits". One credit equals roughly 1 GB
  storage **or** 1 GB bandwidth **or** 1000 transformations. In a
  typical mix that maps to ~25 GB storage plus ~25 GB CDN egress per
  month.
- **Card required on free tier:** **No**. Sign up via email or
  Google / GitHub OAuth.
- **Mental model:** signed direct upload from the browser. The
  backend computes a `signature` from `timestamp` plus upload
  parameters using the Cloudinary API secret; the frontend POSTs to
  Cloudinary with that signature. After upload Cloudinary returns a
  `public_id`; we store it (or the derived URL) in `points.photo_key`.
- **Built-in transforms:** very strong. URL of the form
  `/upload/w_120,h_120,c_fill,f_auto,q_auto/<public_id>.jpg` returns
  the right thumbnail with auto-format (AVIF / WebP) and auto-quality.
  This removes the need for a thumbnail pipeline of our own.
- **CDN:** global, included in every plan including free.
- **Auth integration with Clerk:** one Express endpoint behind
  `clerkAuthMiddleware` returns `signature` + `timestamp` + safe
  parameters; that's the entire integration surface.
- **Lock-in:** moderate. URLs live on `res.cloudinary.com/<cloud>/...`;
  migration off requires re-uploading and rewriting URL composition.
- **Risks:** the credit-based free tier is shared across storage,
  bandwidth, and transforms — a viral page can drain credits faster
  than a flat-quota service.

## Candidate 2 — ImageKit

Image-focused CDN and storage, similar product category to Cloudinary
but narrower scope.

- **Free tier:** 20 GB storage and 20 GB bandwidth per month, flat
  quotas (not credits).
- **Card required on free tier:** **No**.
- **Mental model:** server signs an upload token, frontend uses the
  ImageKit upload SDK or a plain `multipart/form-data` POST.
- **Built-in transforms:** yes — URL-based, comparable to Cloudinary
  for the operations we need (resize, crop, format auto, quality).
- **CDN:** included.
- **Auth integration with Clerk:** same shape as Cloudinary —
  authenticated Express endpoint that returns signed upload params.
- **Lock-in:** moderate, same shape as Cloudinary.
- **Risks:** smaller community than Cloudinary, fewer integration
  examples; the product is still good for a single-image upload flow.

## Candidate 3 — Supabase Storage

Object storage that ships as part of the Supabase platform.

- **Free tier:** 1 GB storage and 5 GB egress per month.
- **Card required on free tier:** **No**.
- **Mental model:** **S3-compatible** API since 2024. A project **could**
  add `@aws-sdk/client-s3` and point it at Supabase’s S3 endpoint
  (this repo **does not** — it uses Cloudinary only).
- **Built-in transforms:** basic image transformations available,
  weaker than Cloudinary or ImageKit.
- **CDN:** included for public buckets.
- **Auth integration with Clerk:** straightforward — our presign
  endpoint authenticates with Clerk and signs against Supabase keys.
- **Lock-in:** **low** thanks to the S3 API; the same code can
  later point to R2, AWS S3, MinIO, etc.
- **Drawback for this project specifically:** Supabase is a full
  platform (Postgres, Auth, Storage, Edge Functions). We already use
  Neon for DB and Clerk for auth, so adopting Supabase only for
  storage means a new vendor account that does not amortize across
  other features. The free tier (1 GB) is also smaller than UT's
  2 GB.

## Candidate 4 — Firebase Storage (Spark plan)

Google Cloud Storage exposed via the Firebase SDK on the consumer
"Spark" tier.

- **Free tier:** 5 GB storage and 1 GB/day download.
- **Card required on free tier:** **No**. The Spark plan does not
  require a billing account; only the paid "Blaze" tier does.
- **Mental model:** Firebase Admin SDK on the backend, Firebase JS
  SDK on the frontend, or signed URLs.
- **Built-in transforms:** **None**. Resize/thumbnail requires a
  Cloud Function or external worker, which on Spark is constrained.
- **CDN:** Google global edge.
- **Auth integration with Clerk:** awkward — the natural path is
  Firebase Auth; with Clerk we end up issuing custom tokens or signed
  URLs from our backend.
- **Lock-in:** high. Different SDK on both sides; URLs live under
  `firebasestorage.googleapis.com`.
- **Drawback for this project specifically:** the 1 GB/day download
  ceiling can be hit in a single day if a public map page goes viral;
  no transforms means we either ship full-size images everywhere or
  build our own resize pipeline.

## Candidate 5 — Storj

Decentralized, geographically distributed object storage with an
S3-compatible gateway.

- **Free tier:** **25 GB storage** and **25 GB egress** per month —
  the most generous of the candidates here for raw quota.
- **Card required on free tier:** **No**. Sign-up uses email plus
  identity verification; no card is required to use the free quota.
- **Mental model:** **S3-compatible** via Storj's S3 gateway — same
  presign pattern as R2; would use `@aws-sdk/client-s3` against the
  gateway (**not** present in this codebase).
- **Built-in transforms:** **None**. Storj is a pure object store; if
  we want thumbnails we either store two files or add an image worker
  in front (e.g. Cloudflare Workers / `imgproxy`).
- **CDN:** built-in "Linksharing" service for public objects;
  performance is generally good but tail latency (P95/P99) can be
  noticeably higher than centralized CDNs because reads reconstruct
  from multiple geographically distributed nodes.
- **Auth integration with Clerk:** same shape as R2 — our backend
  signs PUT URLs using Storj credentials, the browser uploads
  directly.
- **Lock-in:** **low** thanks to the S3-compatible gateway. Migration
  to AWS S3 / R2 / MinIO is a credentials-and-endpoint change.
- **Drawbacks specific to this project:**
  - Tail latency can be more variable than Cloudinary / Cloudflare.
    For a public map that loads many small images at once, this
    occasionally shows up as one slow image in a batch.
  - No built-in transforms, so for thumbnails we are back to either
    "store two sizes" or "put a transform proxy in front", which
    cancels much of the storage advantage of the larger free tier.
  - Smaller ecosystem and fewer integration tutorials than the other
    candidates.
  - Free tier requires identity verification (passport / ID
    document), which some people prefer to avoid for a pet project.

## Comparison table

Numbers reflect free-tier defaults at the time of writing; verify
current quotas on each provider's pricing page before committing.

| Criterion | [Cloudflare R2](https://developers.cloudflare.com/r2/) | [UploadThing](https://uploadthing.com/) | [Cloudinary](https://cloudinary.com/) | [ImageKit](https://imagekit.io/) | [Supabase Storage](https://supabase.com/storage) | [Firebase Spark](https://firebase.google.com/products/storage) | [Storj](https://www.storj.io/) |
|---|---|---|---|---|---|---|---|
| Card required on free tier | **Yes** | No | No | No | No | No | No |
| Free storage | 10 GB | 2 GB | ~25 GB (via credits) | 20 GB | 1 GB | 5 GB | **25 GB** |
| Free bandwidth | unlimited (free egress) | 100 GB / mo | ~25 GB (via credits) | 20 GB / mo | 5 GB / mo | 1 GB / day | 25 GB / mo |
| API style | S3-compatible | proprietary SDK | proprietary REST + SDK | proprietary REST + SDK | **S3-compatible** | Firebase SDK | **S3-compatible** |
| Already in `package.json` | No — **Cloudinary only** in this repo (no `@aws-sdk/client-s3`) | No | No | No | No (unless added) | No | No |
| URL-based image transforms | None | basic | **Strong** | **Strong** | basic | None | None |
| CDN included | Yes | Yes | Yes | Yes | Yes | Yes | Yes (Linksharing) |
| Tail latency profile | Centralized, low | Centralized, low | Centralized, low | Centralized, low | Centralized, low | Centralized, low | Distributed, **higher variance** |
| Vendor lock-in | Low | High | Moderate | Moderate | Low | High | Low |
| Suits Clerk auth | Manual signing | Built-in middleware | Manual signing | Manual signing | Manual signing | Awkward (custom tokens) | Manual signing |
| Plan-document churn if adopted | N/A — **R2 not adopted** | T038 / T044 / T047, research, data-model, OpenAPI | T038 / T044 / T047, research, data-model, OpenAPI | T038 / T044 / T047, research, data-model, OpenAPI | Mostly env vars (S3 endpoint), minor docs | T038 / T044 / T047, research, data-model, OpenAPI | Mostly env vars (S3 endpoint), minor docs |
| Drawback for our specific project | Card required to activate | Smallest free tier; tight lock-in | Credit-based quota can be drained by a single viral page | Smaller ecosystem than Cloudinary | 1 GB free is tight; redundant with our existing stack (Neon + Clerk) | 1 GB/day download cap; no transforms; awkward with Clerk | Higher tail latency; no transforms; ID verification |

## How they rank for our specific kind of app

Public map with many small images per page, one image per record,
solo developer, pet-project budget.

**Shipped in this repo:** **Cloudinary** (item 2 below). **Cloudflare R2** (item 1) was evaluated and **not** integrated.

1. **Cloudflare R2** — best technical fit among **S3-style** stores overall, but only if a card
   on file is acceptable.
2. **Cloudinary** — best "no card" fit; **this is what we implemented.**
   URL-based transforms suit thumbnails on a public map without extra pipelines.
3. **ImageKit** — strong runner-up to Cloudinary for the same
   reasons; pick it if Cloudinary's dashboard or pricing model feels
   too heavyweight.
4. **Storj** — best raw quota of the "no card" group and S3-
   compatible, but the missing transforms and higher P95/P99 latency
   make it a worse fit for a public map than Cloudinary or ImageKit.
   Useful if we only need to store originals and do not care about
   thumbnails.
5. **Firebase Spark** — workable but the 1 GB/day egress cap and
   awkward Clerk integration cost more than they give back.
6. **Supabase Storage** — fine in isolation, but does not amortize
   for us because we already have Neon and Clerk; the smallest free
   storage tier of the group.
7. **UploadThing** — friendly DX, but objectively the smallest free
   tier among the no-card options, and tight lock-in. Reasonable as a
   fallback if everything above is rejected for unrelated reasons.

## Recommendation

**Implemented stack:** **`Cloudinary`** for point photos (see
[`cloudinary-setup.md`](./cloudinary-setup.md) and
[`research.md`](../specs/001-map-world-points/research.md)). **Cloudflare
R2 is not used** in application code or `package.json`.

**If we were choosing again today (hypothetical):**

- **Cloudflare R2** — strongest technical fit among S3-compatible
  stores *if* a card on file is acceptable and you want zero egress
  fees on a public map.
- **Cloudinary** — best **no-card** fit for a thumbnail-heavy public
  map; what we actually shipped.
- **UploadThing**, **Storj**, **ImageKit**, etc. — remain documented
  above for context; none are required by the current codebase.

Historical notes on migrating *from* an R2-shaped plan appear in
[`r2-vs-uploadthing.md`](./r2-vs-uploadthing.md) (archival).

---

**Date of analysis:** 2026-04-28 (op4.7h).
