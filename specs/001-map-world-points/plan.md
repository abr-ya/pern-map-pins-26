# Implementation Plan: Points on the Map (001-map-world-points)

**Branch**: `001-map-world-points` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-map-world-points/spec.md` + stack preferences (TypeScript, React, Express, Neon, etc.)

## Summary

Deliver a **map-first web app** where guests see the **latest five** public points and matching map markers; **signed-in** users create **points** (WGS84 coordinates, title, optional description, **one** photo), organize with **folders** and **tags**, share **public** content, participate in **private groups** (with an **active group switcher**), use **favorites** with subfolders, and engage via **comments** and **1–5 ratings**.  

**Map camera (spec FR-015 / FR-016, 2026-05-12)**: When the user **selects** a point (marker or list), the client **centers** the map on that point and zooms to a **neighborhood scale** (~three to four city blocks—see [research.md](./research.md) §8). When selection is **cleared**, the map returns to the **same default framing** as for the **current context** with **no** selection: guest → same rules as today’s `useGuestMapBounds` over latest-five coordinates; signed-in **folder** view → `fitBounds` over folder points (or empty-state center); signed-in **explore** (no folder) → `fitBounds` over **currently loaded** in-view public markers (`explorePoints`), or agreed empty/world fallback. No API or schema changes—**React + Leaflet** only.

**Approach**: **Split deploy** — Vite + **React** SPA in `frontend/`, **Express** API in `backend/`, both **TypeScript**; **Neon PostgreSQL** as source of truth; **Clerk** for email/password + Google; **Cloudinary** for **photo** storage (signed direct uploads; `points.photo_key` holds the Cloudinary `public_id`); **Leaflet** + **react-leaflet** with **OpenStreetMap** tiles for the map; **Swagger** (OpenAPI 3) served from the API. Validation at boundaries with **Zod 4** (shared or mirrored schemas); geospatial input validated in Express (lat ∈ [-90,90], lng ∈ [-180,180], SRID **WGS84** for stored coordinates).

> **Note:** Early design considered **Cloudflare R2** (S3-compatible presigned `PUT`). The repository **does not** use R2 or `@aws-sdk/client-s3`; rationale and comparisons live in `docs/object-storage-alternatives.md` and `specs/001-map-world-points/research.md`.

**Phase 0–1 outputs**: [research.md](./research.md) (decisions), [data-model.md](./data-model.md) (schema), [contracts/openapi.yaml](./contracts/openapi.yaml) (API contract), [quickstart.md](./quickstart.md) (local run).

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on **Node.js 20 LTS** (frontend and backend).  
**Primary Dependencies**:
- **Frontend**: **React 19**, Vite, **Tailwind CSS 4** (`@tailwindcss/vite`), **shadcn/ui** (Radix), **react-hook-form** + **@hookform/resolvers** + **Zod 4**, **TanStack Query** v5, **react-dropzone** (photo pick), **react-leaflet** + **Leaflet**, **Clerk** (`@clerk/react`)
- **Backend**: **Express 5.x**, **Zod 4** (request validation), **Prisma ORM 7** with **Prisma Migrate** to Neon (connection URL in `prisma.config.ts`, not in `schema.prisma`; `PrismaClient` with driver adapter in app code), **@clerk/express** (or verify JWT via Clerk), **swagger-ui-express** + **OpenAPI** spec file, **pino** or **winston** (structured logs)

**Storage**: **Neon** **PostgreSQL** 15+ (connection string; optional **PostGIS** later for heavy geo queries; **v1** uses `double precision` lat/lng + app validation per constitution).  
**Object storage**: **Cloudinary** for point photos (signed browser upload; `photoUrl` from `photo_key` + `CLOUDINARY_CLOUD_NAME`). *R2 was evaluated and not adopted* (see `docs/object-storage-alternatives.md`).  

**Testing**: **Vitest** + **Supertest** (API), **Vitest** + **Testing Library** (React), **Playwright** for smoke E2E on critical paths (map + point CRUD). Workspace lives in `e2e/`; **US1 covered** (`e2e/tests/guest-map.spec.ts`), **US2/US3 tracked** under tasks.md `T073`, CI workflow under `T074`.  

**Target Platform**: **Web** (evergreen browsers); API on **Linux** containers (Node).  

**Project Type**: **Web application** (separate `frontend/` + `backend/`).  

**Performance Goals** (MVP, to refine under load):
- API **p95** for read-heavy list/map queries **&lt; 500ms** on modest hardware with indexes as in data model
- Map interaction **60fps** on mid-range clients where possible (cluster markers when &gt; ~200 visible—plan in UI tasks)

**Constraints**:
- **Constitution II**: all point writes validated; reject invalid coordinates with clear 400 + message
- **FR-011/FR-007**: query filters differ for **guest** vs **signed-in**; guest map uses **only** “latest five” point IDs
- **FR-014**: `activeGroupId` (or “public only”) in session or persisted preference drives **server-side** scoping of group-private rows
- **FR-015 / FR-016**: map **center/zoom on select** and **restore default framing on deselect** are **client-only**; must not fight guest `useGuestMapBounds` / signed-in folder fits—use a small hook or effect keyed on `selectedPointId` + context (guest vs folder vs explore) so select **overrides** bounds, deselect **re-applies** the context’s default fit (see [research.md](./research.md) §8).
- **CORS** explicit per environment (separate front/back URLs)
- **Separate deploy**: two build artifacts, env per service (see [research.md](./research.md))

**Scale/Scope (MVP)**:
- Target **1k** concurrent signed-in users **optimistic**; schema supports growth; no premature microservices

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-evaluated after Phase 1 design — **PASS**.*

- **Full-stack boundaries**: **Express** is authoritative for visibility rules, point persistence, and **Cloudinary** upload signing policy; **React** only reflects API + Clerk session. **No** second source of truth for “who sees what” beyond documented Clerk identity mapping.
- **Geospatial and data integrity**: All point creates/updates go through Zod + server checks; `latitude`/`longitude` as validated numbers; out-of-range **400**; **no** silent coordinate drift. CRS: **WGS84**; document in [data-model.md](./data-model.md).
- **Testable delivery**: API routes covered by **Vitest+Supertest**; domain helpers unit-tested; React **components and hooks** with Testing Library; **Playwright** smoke E2E in `e2e/` — **US1 done**, US2 sign-in and US3 create-point tracked under `tasks.md` `T073`.
- **API contracts**: **OpenAPI 3** in [contracts/openapi.yaml](./contracts/openapi.yaml); breaking changes require version bump + notes (Principle IV).
- **Operability**: Structured JSON logs, request id, global error handler mapping to stable client-facing codes/messages. **Complexity** below justified: Clerk + Cloudinary add integration surface but replace months of custom auth and storage (see [research.md](./research.md)).

## Project Structure

### Documentation (this feature)

```text
specs/001-map-world-points/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── openapi.yaml
```

### Source Code (repository root) — target layout

```text
frontend/                    # Vite + React; deploy: Vercel / Netlify / Cloudflare Pages
├── src/
│   ├── components/
│   ├── features/            # map, points, auth shell
│   ├── lib/                 # api client, zod, queryClient
│   └── routes/              # or app router per chosen routing lib
└── tests/

backend/                     # Express; deploy: Railway / Fly.io / Render
├── src/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── lib/                 # db, r2, logger
│   └── openapi/             # optional: generated or static
└── tests/

# Optional later:
# packages/shared/            # shared zod schemas + types
```

**Structure decision**: **Two deployable applications** at repo root (`frontend/`, `backend/`) to satisfy **independent** deployment; shared types can start as a small `packages/shared` or duplicated Zod in both until extracted.

## Complexity Tracking

*No constitution violations requiring justification. **Clerk** and **Cloudinary** are third-party services chosen for operability, security, and TTFM; the alternative (custom auth + local disk) would violate long-term operability and split-deploy expectations. **Cloudflare R2** was considered for photos but is not used in this codebase.*

| Item | N/A for MVP |
|------|----------------|
| (empty) | — |

## Phase 0: Research (complete)

All decisions are recorded in [research.md](./research.md). Highlights:

| Topic | Decision |
|-------|----------|
| Auth | **Clerk** (email + Google, React + Express, hosted stability) |
| Object storage | **Cloudinary** (point photos; R2 evaluated — see `docs/object-storage-alternatives.md`) |
| Map | **react-leaflet** + **OSM** tiles; marker clustering in UI for density |
| API docs | **OpenAPI 3** + **Swagger UI** on `/api/docs` in dev/staging (guard in prod) |
| ORM | **Prisma ORM 7** + **Prisma Migrate** + `@prisma/adapter-pg` / `pg` (Drizzle was not adopted) |
| Monorepo tooling | `pnpm` workspaces (recommended) or npm — tasks |

## Phase 1: Design (complete)

- **Data model**: [data-model.md](./data-model.md) (tables, indexes, rules).
- **HTTP contract**: [contracts/openapi.yaml](./contracts/openapi.yaml) (aligns with Zod in implementation).
- **Onboarding**: [quickstart.md](./quickstart.md).

### Constitution Check (post-design)

- **Private group scoping** encoded as `visibility` + `group_id` + server enforcement of `activeGroupId` in session/DB.
- **Guest** endpoints **constrained** to public “latest five” and read-only public detail; **no** comment list for guest in contract.
- **Photo**: one `photo_key` (Cloudinary `public_id`) + URL derivation in `photoUrl.ts`; max size in middleware.
- **Map camera (FR-015/FR-016)**: behavior lives in the **React** map layer; server contracts unchanged; aligns with Principle I (server remains authoritative for *which* points exist; client owns *viewport* animation).

### Map camera implementation notes (FR-015 / FR-016)

| Context | On select (FR-015) | On deselect (FR-016) |
|--------|--------------------|----------------------|
| **Guest** | `flyTo` / `setView` on point coords; zoom ≈ **16** (tunable) or `fitBounds` on a **~450 m** radius box around the point for “3–4 blocks” feel | Re-run **`useGuestMapBounds`** (or equivalent) for current latest-five `items`—must match first-load behavior |
| **Signed-in, folder** | Same neighborhood framing on selected coords | `fitBounds` over **all** `myPoints` for that folder (padding + `maxZoom` cap as today for multi-pin) |
| **Signed-in, explore** | Same neighborhood framing | `fitBounds` over **`explorePoints`** currently in memory for the last bounds query; if zero pins, keep **non-broken** center/zoom (align with empty copy in sidebar) |

**Implementation sketch**: Extract or pair hooks so `detailPointId !== null` **short-circuits** auto guest/folder bounds effects, then on `null` restore. Use **`flyTo`** for smoother UX on select. When **folder** or **auth** context changes while detail open, clear selection first (spec edge case) then apply default bounds for the new context.

**Testing**: Extend **Playwright** / component tests: guest selects from list → map centers; close detail → bounds match unselected guest view; folder mode select/deselect cycle (see `tasks.md` after `/speckit.tasks` refresh).

## Next steps

- Run **`/speckit.tasks`** (or manually add tasks) to align `tasks.md` with map-camera work items.
- Implement **migrations** against Neon; configure **Clerk** dev instance + **Cloudinary** upload preset (see `docs/cloudinary-setup.md`).

> **Repo workflow**: `.specify/scripts/bash/setup-plan.sh --json` expects a **feature branch** name (`NNN-name`); if the clone is on `master`, run planning from `001-map-world-points` or pass the feature directory via your Spec Kit wrapper—paths in this doc assume `specs/001-map-world-points/`.
