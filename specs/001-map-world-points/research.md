# Research: 001 map-world-points

**Date**: 2026-04-22

## 1. Authentication: Clerk vs Better Auth vs Auth.js

**Decision: Clerk**

**Rationale**:
- **Stability and docs**: Mature product, first-class **React** and **Express/Node** SDKs, **Google OAuth** and **email/password** out of the box (matches spec FR-003).
- **Time-to-ship**: Hosted UI and session management reduce custom code; aligns with **separate deploy** (frontend and backend only need keys and SDK wiring).
- **User sync**: Webhooks (e.g. `user.created`) to upsert a row in **Neon** with `clerk_id` and display name, keeping **Express** in control of app-specific roles and group membership.

**Alternatives considered**:
- **Better Auth**: Open-source, self-hosted, no mandatory vendor; stronger fit if the team forbids third-party **auth** storage. **Trade-off**: more implementation and ops work; session + OAuth wiring for Express + React is manual.
- **Auth.js (NextAuth)**: Tied to Next.js patterns; this stack is **Vite + Express**, so not the default path.

**Follow-up in implementation**:
- Map **Clerk** `userId` to internal `users.id` (UUID) in PostgreSQL.
- Protect Express routes with Clerk JWT (Bearer) or session cookie per Clerk docs; ensure **CORS** and **allowed origins** for the SPA.

---

## 2. Object storage (photos)

**Decision (implementation): [Cloudinary](https://cloudinary.com/)** — signed direct upload from the browser; `points.photo_key` stores the Cloudinary `public_id`; public URLs are derived in `backend/src/lib/photoUrl.ts` using `CLOUDINARY_CLOUD_NAME`. Setup steps: [`docs/cloudinary-setup.md`](../../docs/cloudinary-setup.md).

**Alternatives considered (historical)**:
- **Cloudflare R2** (S3-compatible API) was the **original** plan in early design: presigned `PUT`, `@aws-sdk/client-s3`, object key in `photo_key`. **Not used in this repository** — we compared egress, billing (card on file), and DX; see [`docs/r2-vs-uploadthing.md`](../../docs/r2-vs-uploadthing.md) and [`docs/object-storage-alternatives.md`](../../docs/object-storage-alternatives.md).
- **Local disk / Docker volume**: Fails **split deploy** and horizontal scaling; only for local dev.
- **Supabase Storage**: Nice DX but couples another vendor; team already chose **Neon** for DB.
- **Backblaze B2**: Similar trade-offs to R2; not selected.

**Constraints (spec)**:
- **One** image per point (v1); reject multi-file uploads in API.

---

## 3. Map library

**Decision: `react-leaflet` + `leaflet` + OpenStreetMap tile layer**

**Rationale**:
- **OSM** tiles: no Mapbox token for baseline (respect “no card” for dev/prototype); attribution required.
- **Ecosystem**: Stable; supports marker clustering add-on (`react-leaflet-cluster` or `leaflet.markercluster`).

**Alternatives**:
- **MapLibre GL** + **react-map-gl**: Smoother zoom for heavy data; can swap later; higher initial setup.

**Guest vs signed-in** (spec FR-011, FR-007):
- **Guest**: request **exactly** point IDs for “latest five” from API, render **only** those markers; fit bounds to markers.
- **Signed-in**: request public points in viewport (with limit + clustering) and merge **group** points per `activeGroupId` (server-filtered).

---

## 4. API documentation (Swagger)

**Decision: `swagger-ui-express` (or `swagger-ui` static) + single OpenAPI 3 file**

**Rationale**:
- **Express** can serve **GET `/api/docs`** in development; protect or disable in production or behind auth.
- **Source of truth**: [contracts/openapi.yaml](./contracts/openapi.yaml); optionally generate Zod or validate responses in CI later.

---

## 5. ORM

**Decision (in use in repo): Prisma ORM 7** with **Prisma Migrate** to Neon.

- **Schema**: `backend/prisma/schema.prisma` — models; `datasource db { provider = "postgresql" }` only (no `url` in schema; [Prisma 7](https://pris.ly/d/config-datasource)).
- **CLI / migrations URL**: `backend/prisma.config.ts` — `datasource.url` from `DATABASE_URL` (after `dotenv/config` in that file).
- **Runtime**: `backend/src/lib/prisma.ts` — `PrismaClient` with **`@prisma/adapter-pg`** + `pg` ([client + adapter](https://pris.ly/d/prisma7-client-config)).

*Earlier note: Drizzle was considered; this repo uses **Prisma 7**.*

---

## 6. Split deployment

**Decision**:
- **Frontend**: **Vercel**, **Netlify**, or **Cloudflare Pages** — static/SSR-less SPA; env: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL`.
- **Backend**: **Railway**, **Fly.io**, or **Render** — Node process; env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `FRONTEND_URL` (CORS), **`CLOUDINARY_*`** (see `docs/cloudinary-setup.md`).
- **Neon** and **Cloudinary** are **managed**; no colocation requirement.

**CORS**: Allow only `FRONTEND_URL` origin(s) in production.

---

## 7. Group membership assignment (spec deferred)

**Decision for MVP (implementation)**:
- **Admin** or **bootstrap script** to create groups and add members, **or** simple **invite code** field—**choose in tasks**; not blocking architecture.

**Active group (FR-014)**: store `active_private_group_id` in **server session** (Redis optional) or in **`user_preferences`** table keyed by `user_id`.

## Resolved (no open NEEDS CLARIFICATION)

All items above close planning unknowns; remaining product nuance (e.g. public-only map mode) is captured in [data-model.md](./data-model.md) and [plan.md](./plan.md) as plan-level defaults.
