# Implementation Plan: Points on the Map (001-map-world-points)

**Branch**: `001-map-world-points` | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-map-world-points/spec.md` + stack preferences (TypeScript, React, Express, Neon, etc.)

## Summary

Deliver a **map-first web app** where guests see the **latest five** public points and matching map markers; **signed-in** users create **points** (WGS84 coordinates, title, optional description, **one** photo), organize with **folders** and **tags**, share **public** content, participate in **private groups** (with an **active group switcher**), use **favorites** with subfolders, and engage via **comments** and **1–5 ratings**.  

**Approach**: **Split deploy** — Vite + **React** SPA in `frontend/`, **Express** API in `backend/`, both **TypeScript**; **Neon PostgreSQL** as source of truth; **Clerk** for email/password + Google; **Cloudflare R2** (S3-compatible) for **photo** storage via presigned uploads; **Leaflet** + **react-leaflet** with **OpenStreetMap** tiles for the map; **Swagger** (OpenAPI 3) served from the API. Validation at boundaries with **Zod** (shared or mirrored schemas); geospatial input validated in Express (lat ∈ [-90,90], lng ∈ [-180,180], SRID **WGS84** for stored coordinates).

**Phase 0–1 outputs**: [research.md](./research.md) (decisions), [data-model.md](./data-model.md) (schema), [contracts/openapi.yaml](./contracts/openapi.yaml) (API contract), [quickstart.md](./quickstart.md) (local run).

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on **Node.js 20 LTS** (frontend and backend).  
**Primary Dependencies**:
- **Frontend**: React 18+, Vite, **Tailwind CSS**, **shadcn/ui** (Radix), **react-hook-form** + **Zod**, **TanStack Query** v5, **react-dropzone** (photo pick), **react-leaflet** + **Leaflet**, **Clerk** React SDK
- **Backend**: **Express** 4.x, **Zod** (request validation), **Prisma** or **Drizzle** ORM (TBD in tasks; default assumption **Drizzle** for lightweight SQL), **@clerk/express** (or verify JWT via Clerk), **swagger-ui-express** + **OpenAPI** spec file, **@aws-sdk/client-s3** (R2), **pino** or **winston** (structured logs)

**Storage**: **Neon** **PostgreSQL** 15+ (connection string; optional **PostGIS** later for heavy geo queries; **v1** uses `double precision` lat/lng + app validation per constitution).  
**Object storage**: **Cloudflare R2** (S3 API, public or signed read URLs for images).  

**Testing**: **Vitest** + **Supertest** (API), **Vitest** + **Testing Library** (React), **Playwright** for smoke E2E on critical paths (map + point CRUD) when time allows.  

**Target Platform**: **Web** (evergreen browsers); API on **Linux** containers (Node).  

**Project Type**: **Web application** (separate `frontend/` + `backend/`).  

**Performance Goals** (MVP, to refine under load):
- API **p95** for read-heavy list/map queries **&lt; 500ms** on modest hardware with indexes as in data model
- Map interaction **60fps** on mid-range clients where possible (cluster markers when &gt; ~200 visible—plan in UI tasks)

**Constraints**:
- **Constitution II**: all point writes validated; reject invalid coordinates with clear 400 + message
- **FR-011/FR-007**: query filters differ for **guest** vs **signed-in**; guest map uses **only** “latest five” point IDs
- **FR-014**: `activeGroupId` (or “public only”) in session or persisted preference drives **server-side** scoping of group-private rows
- **CORS** explicit per environment (separate front/back URLs)
- **Separate deploy**: two build artifacts, env per service (see [research.md](./research.md))

**Scale/Scope (MVP)**:
- Target **1k** concurrent signed-in users **optimistic**; schema supports growth; no premature microservices

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-evaluated after Phase 1 design — **PASS**.*

- **Full-stack boundaries**: **Express** is authoritative for visibility rules, point persistence, and presigned upload policy; **React** only reflects API + Clerk session. **No** second source of truth for “who sees what” beyond documented Clerk identity mapping.
- **Geospatial and data integrity**: All point creates/updates go through Zod + server checks; `latitude`/`longitude` as validated numbers; out-of-range **400**; **no** silent coordinate drift. CRS: **WGS84**; document in [data-model.md](./data-model.md).
- **Testable delivery**: API routes covered by **Vitest+Supertest**; domain helpers unit-tested; React **components and hooks** with Testing Library; E2E optional but recommended for sign-in and create point.
- **API contracts**: **OpenAPI 3** in [contracts/openapi.yaml](./contracts/openapi.yaml); breaking changes require version bump + notes (Principle IV).
- **Operability**: Structured JSON logs, request id, global error handler mapping to stable client-facing codes/messages. **Complexity** below justified: Clerk + R2 add integration surface but replace months of custom auth and storage (see [research.md](./research.md)).

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

*No constitution violations requiring justification. Clerk and R2 are third-party services chosen for operability, security, and TTFM; the alternative (custom auth + local disk) would violate long-term operability and split-deploy expectations.*

| Item | N/A for MVP |
|------|----------------|
| (empty) | — |

## Phase 0: Research (complete)

All decisions are recorded in [research.md](./research.md). Highlights:

| Topic | Decision |
|-------|----------|
| Auth | **Clerk** (email + Google, React + Express, hosted stability) |
| Object storage | **Cloudflare R2** (S3 API, no vendor lock-in for client code) |
| Map | **react-leaflet** + **OSM** tiles; marker clustering in UI for density |
| API docs | **OpenAPI 3** + **Swagger UI** on `/api/docs` in dev/staging (guard in prod) |
| ORM | **Drizzle** (recommended) or **Prisma** — pick one in implementation tasks |
| Monorepo tooling | `pnpm` workspaces (recommended) or npm — tasks |

## Phase 1: Design (complete)

- **Data model**: [data-model.md](./data-model.md) (tables, indexes, rules).
- **HTTP contract**: [contracts/openapi.yaml](./contracts/openapi.yaml) (aligns with Zod in implementation).
- **Onboarding**: [quickstart.md](./quickstart.md).

### Constitution Check (post-design)

- **Private group scoping** encoded as `visibility` + `group_id` + server enforcement of `activeGroupId` in session/DB.
- **Guest** endpoints **constrained** to public “latest five” and read-only public detail; **no** comment list for guest in contract.
- **Photo**: one `photo_key` + URL derivation from R2; max size in middleware.

## Next steps

- Run **`/speckit.tasks`** to generate `tasks.md` from this plan and the spec.
- Implement **migrations** against Neon; configure **Clerk** dev instance + **R2** bucket CORS for frontend origin.
