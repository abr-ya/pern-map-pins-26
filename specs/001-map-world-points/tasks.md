# Tasks: Points on the Map (001-map-world-points)

**Input**: Design documents from `/home/user/full2026/react-express-map-pins/specs/001-map-world-points/`
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml)

**Tests**: **Included** per [plan.md](./plan.md) and `.specify/memory/constitution.md` (Principle III). Each user story has an implementation block followed by **Tests for User Story** (Vitest + Supertest for Express; React Testing Library for UI smoke where noted).

**Organization**: Tasks are grouped by user story so each increment can be implemented and validated independently. **Run tests for a story after its implementation tasks** (or in parallel for [P] test files once the SUT exists).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies on incomplete tasks in the same batch)
- **[Story]**: User story from [spec.md](./spec.md) (US1–US5)
- Every task includes at least one concrete file path

## Path Conventions (from [plan.md](./plan.md))

- **Web app**: `frontend/src/`, `backend/src/` with split deploy; OpenAPI may live in `backend/src/openapi/openapi.yaml` and stay aligned with `specs/001-map-world-points/contracts/openapi.yaml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo scaffold and toolchain so `backend/` and `frontend/` are buildable and runnable.

- [X] T001 Create pnpm workspace with root `package.json` and `pnpm-workspace.yaml` including `frontend` and `backend` at repository root
- [X] T002 [P] Initialize `backend/package.json` with TypeScript, **Express 5** (`express@^5`), `tsx`, Vitest, Supertest, **Prisma** (`@prisma/client`, `prisma` CLI), **Zod 4**, `pino`, `cors`, `@clerk/express`, and `@aws-sdk/client-s3` for R2; add `backend/vitest.config.ts` and `test` / `test:watch` scripts suitable for `backend/tests/`
- [X] T003 [P] Initialize `frontend/package.json` with Vite, React, TypeScript, **Tailwind CSS 4**, TanStack Query v5, `@clerk/react`, `react-leaflet`, `leaflet`, `react-hook-form`, `@hookform/resolvers`, and **Zod 4**; add `frontend/vitest.config.ts` (or Vite `test` with Vitest) and `jsdom` for Testing Library, plus `test` script
- [X] T004 [P] Add strict `tsconfig.json` for `backend/tsconfig.json` and `frontend/tsconfig.json` with project references or root `tsconfig.json` as needed
- [X] T005 [P] Add ESLint (and Prettier if desired) config at `eslint.config.mjs` or equivalent at repository root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, API shell, logging, validation helpers, and client bootstrap — **required before user story work**.

**⚠️ CRITICAL**: No user story implementation until this phase is complete (except that Phase 1 must finish first).

- [X] T006 **Prisma ORM 7**: `backend/prisma/schema.prisma` — `datasource db { provider = "postgresql" }` only (no `url` in schema; [Prisma 7 config](https://pris.ly/d/config-datasource)). `backend/prisma.config.ts` — `datasource.url` from `process.env.DATABASE_URL` after `import 'dotenv/config'`; `migrations.path`; scripts `db:generate` / `db:migrate` / `db:migrate:dev` in `backend/package.json`
- [ ] T007 Define all models and relations in `backend/prisma/schema.prisma` per `specs/001-map-world-points/data-model.md` (User, Group, GroupMember, UserPreference, Folder, Point, Tag, PointTag, FavoriteFolder, Favorite, Comment, Rating)
- [ ] T008 Create initial migration with `prisma migrate dev` from `backend/` (loads `prisma.config.ts` automatically) or `prisma migrate diff` + commit so `backend/prisma/migrations/` has `0001_*` SQL for Neon; document `db:migrate` / `db:migrate:dev` in `backend/package.json`
- [X] T009 `backend/src/lib/prisma.ts`: **singleton** `PrismaClient` with **`@prisma/adapter-pg` + `pg` `Pool`** and `globalThis` cache in dev ([runtime client](https://pris.ly/d/prisma7-client-config)); wire or re-export from `backend/src/index.ts` / `backend/src/db/index.ts` when the app starts
- [ ] T010 **Express 5** application entry in `backend/src/index.ts` registering CORS for `FRONTEND_URL`, JSON body parser, request-id middleware, and global error handler in `backend/src/middleware/errorHandler.ts` returning contract-shaped errors (`code`, `message`) per `specs/001-map-world-points/contracts/openapi.yaml` (see [Express 5 migration](https://expressjs.com/en/guide/migrating-5.html) if upgrading patterns)
- [ ] T011 [P] Add structured JSON logging in `backend/src/lib/logger.ts` and request logging middleware in `backend/src/middleware/requestLogger.ts`
- [ ] T012 [P] Add WGS84 validation helpers in `backend/src/lib/geo.ts` (latitude ∈ [-90,90], longitude ∈ [-180,180]) for reuse on all point writes
- [ ] T013 Mount `GET /api/health` in `backend/src/routes/health.ts` and register with the app per `specs/001-map-world-points/contracts/openapi.yaml` `/health`
- [ ] T014 Add OpenAPI static asset path and serve Swagger UI at `GET /api/docs` in `backend/src/routes/docs.ts` (guarded in production per [research.md](./research.md)), sourcing spec from `backend/src/openapi/openapi.yaml` (initially copied or synced from `specs/001-map-world-points/contracts/openapi.yaml`)
- [ ] T015 [P] Add TanStack Query client in `frontend/src/lib/queryClient.ts` and API base client in `frontend/src/lib/api.ts` using `import.meta.env.VITE_API_URL`
- [ ] T016 [P] Add `frontend/.env.example` and `frontend/src/vite-env.d.ts` for `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL`

**Checkpoint**: Health and DB migrations run; API serves docs in dev; frontend can call `${VITE_API_URL}/api/health`

---

## Phase 3: User Story 1 — Map and five latest points (Priority: P1)

**Goal**: Guest main screen: interactive OSM map, “latest five” public list, **only** those five as markers, map framing to show all five, empty state when none.

**Independent test**: While unsigned, pan/zoom works; list and map show **at most five** public points, newest first; with zero data, list shows empty state and map still works. (Signed-in “full public layer” is covered in US4 once `/map/public` exists.)

- [ ] T017 [US1] Implement `GET /api/public/latest` in `backend/src/routes/public.ts` delegating to `backend/src/services/publicPointsService.ts` (up to 5 rows: `visibility = public` and not group-only, `created_at` DESC) per [data-model.md](./data-model.md) and [contracts/openapi.yaml](./contracts/openapi.yaml) `/public/latest`
- [ ] T018 [P] [US1] Add Zod/DTO mappers in `backend/src/lib/schemas/point.ts` and `backend/src/lib/photoUrl.ts` to build `Point` JSON with `photoUrl` from `R2_PUBLIC_BASE_URL` and `points.photo_key`
- [ ] T019 [US1] Create feature module `frontend/src/features/map/MapPage.tsx` with `react-leaflet` `MapContainer`, OpenStreetMap tile layer, and proper Leaflet CSS import in `frontend/src/main.tsx` or `frontend/src/index.css`
- [ ] T020 [P] [US1] Create `frontend/src/features/map/LatestPointsPanel.tsx` that loads `/api/public/latest` via TanStack Query and shows up to five items with empty state when `items` is empty
- [ ] T021 [US1] Create `frontend/src/features/map/GuestMapLayer.tsx` that places markers **only** for the five (or fewer) point IDs from the latest endpoint and uses `useMap`/`fitBounds` (or world view) in `frontend/src/features/map/useGuestMapBounds.ts` so all markers remain reachable per [spec.md](./spec.md) edge cases
- [ ] T022 [US1] Wire default route in `frontend/src/App.tsx` (or `frontend/src/routes/`) to `MapPage` at `/`
- [ ] T023 [P] [US1] Keep `specs/001-map-world-points/contracts/openapi.yaml` and `backend/src/openapi/openapi.yaml` aligned for implemented paths (`/public/latest`, `Point` schema)

### Tests for User Story 1

- [ ] T024 [P] [US1] Add `backend/tests/integration/public.latest.test.ts` with Supertest: `GET /api/public/latest` returns 200, `items.length` ≤ 5, ordering newest-first, and only public (non–group-only) points for seeded data
- [ ] T025 [P] [US1] Add `backend/src/services/publicPointsService.test.ts` (or colocated `publicPointsService.integration.test.ts`) with tests for the “latest five” selection rules against a test database or query-level assertions
- [ ] T026 [P] [US1] Add `frontend/src/features/map/LatestPointsPanel.test.tsx` and `frontend/src/features/map/GuestMapLayer.test.tsx` (Vitest + Testing Library): empty `items` state; mocked API returns ≤5 points

**Checkpoint**: Guest experience matches **FR-001**, **FR-002**, **FR-011** for the main screen; US1 test suite green

---

## Phase 4: User Story 2 — Registration and sign-in (Priority: P1)

**Goal**: Email+password and Google via Clerk; optional modal/screen; no mandatory email verification gate before write actions in v1.

**Independent test**: Register and sign in with email and Google; invalid sign-in does not leak account hints; after sign-in, session is obvious in UI; creating a point is not blocked by inbox verification (FR-013) once US3 is implemented.

- [ ] T027 [US2] Wrap the app in `ClerkProvider` in `frontend/src/main.tsx` using `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] T028 [P] [US2] Add auth entry UI in `frontend/src/features/auth/AuthDialog.tsx` (or `frontend/src/features/auth/AuthRoutes.tsx`) using Clerk `SignIn` / `SignUp` components without breaking `MapPage` use
- [ ] T029 [US2] Add Clerk authentication middleware in `backend/src/middleware/clerkAuth.ts` (Bearer / session as per Clerk + Express docs) and apply to protected routers
- [ ] T030 [US2] Implement Clerk webhook route in `backend/src/routes/webhooks.ts` calling `backend/src/services/userSyncService.ts` to upsert `users` on `user.created` / `user.updated` with `CLERK_WEBHOOK_SECRET` verification
- [ ] T031 [P] [US2] Add `backend/.env.example` with `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `FRONTEND_URL`, and R2 variables per `specs/001-map-world-points/quickstart.md`
- [ ] T032 [US2] Add `frontend/src/components/AppHeader.tsx` (or `frontend/src/components/UserMenu.tsx`) showing signed-in state and sign-out using Clerk, integrated into `frontend/src/App.tsx`
- [ ] T033 [P] [US2] Ensure CORS in `backend/src/index.ts` allows the configured frontend origin only (per [research.md](./research.md))

### Tests for User Story 2

- [ ] T034 [P] [US2] Add `backend/tests/integration/auth.protected.test.ts` with Supertest: a protected sample route (or `POST /api/points` after stub) returns **401/403** when `Authorization` is missing/invalid, using Clerk test doubles or mock JWT as documented for Vitest
- [ ] T035 [P] [US2] Add `backend/tests/integration/webhooks.clerk.test.ts` with Supertest: `POST` webhook with valid `svix`/`CLERK` signature body creates/updates `users`; invalid signature returns **4xx** without DB writes
- [ ] T036 [P] [US2] Add `frontend/src/components/AppHeader.test.tsx` (Vitest + Testing Library) with `@clerk/react` test helpers: signed-out vs signed-in render paths

**Checkpoint**: Auth works end-to-end; internal `users` rows align with Clerk ids for subsequent stories; US2 test suite green

---

## Phase 5: User Story 3 — Creating and organizing own points (Priority: P2)

**Goal**: Signed-in user creates a point from map click (title required; description and one optional photo); folders and tags; when a folder is selected, show that folder’s points on the map.

**Independent test**: Create point with title only, then with description/photo; create folders and tags; assign tags; select folder and see expected markers. Presigned upload and single-image rules per [spec.md](./spec.md) **FR-004** / **FR-005** / **FR-006**.

- [ ] T037 [US3] Implement `POST /api/points` in `backend/src/routes/points.ts` with Zod `PointCreate`, `geo` validation, and persistence in `backend/src/services/pointWriteService.ts` per [contracts/openapi.yaml](./contracts/openapi.yaml) `/points`
- [ ] T038 [P] [US3] Implement `POST /api/points/{pointId}/photo-upload` in `backend/src/routes/points.ts` with R2 presigned PUT in `backend/src/lib/r2.ts` and size/content-type policy in `backend/src/middleware/uploadPolicy.ts`
- [ ] T039 [P] [US3] Add folder CRUD and ownership checks in `backend/src/routes/folders.ts` and `backend/src/services/folderService.ts` per [data-model.md](./data-model.md) `folders`
- [ ] T040 [P] [US3] Add tag and `point_tags` handling in `backend/src/routes/tags.ts` and `backend/src/services/tagService.ts` with assignment from point create/update
- [ ] T041 [US3] Add `frontend/src/features/points/CreatePointForm.tsx` with `react-hook-form` + Zod, triggered from map click in `frontend/src/features/map/MapPage.tsx`, calling `POST /api/points` and optional `photo-upload` after save
- [ ] T042 [P] [US3] Add `frontend/src/features/folders/FolderList.tsx` and map filter state (folder id in URL or context) in `frontend/src/features/map/MapPage.tsx` wiring to a `GET` API for the signed-in user’s points filtered by `folderId` in `backend/src/routes/pointsQuery.ts` (or extend `backend/src/routes/points.ts`) — add paths to `specs/001-map-world-points/contracts/openapi.yaml` and `backend/src/openapi/openapi.yaml`
- [ ] T043 [US3] Add marker list/cluster pattern in `frontend/src/features/map/ClusteredMarkers.tsx` (or `leaflet.markercluster`) to satisfy overlap edge case in [spec.md](./spec.md) when many markers exist
- [ ] T044 [P] [US3] Enforce at most one `photo_key` per point; allow replace via new presign + update in `backend/src/services/pointWriteService.ts` and `CreatePointForm.tsx`

### Tests for User Story 3

- [ ] T045 [P] [US3] Add `backend/src/lib/geo.test.ts` with Vitest: rejects lat/lng out of WGS84 range (align with `backend/src/lib/geo.ts` and 400s from `POST /api/points`)
- [ ] T046 [P] [US3] Add `backend/tests/integration/points.create.test.ts` with Supertest + authenticated user fixture: `POST /api/points` returns 201; invalid coordinates return **400** with contract error shape; second image attempt rejected per **FR-004**
- [ ] T047 [P] [US3] Add `backend/tests/integration/photo-upload.test.ts` and `backend/tests/integration/folders-tags.test.ts` (or one `points.features.test.ts`): presigned upload author-only; folder CRUD and tag assign return expected status codes
- [ ] T048 [P] [US3] Add `frontend/src/features/points/CreatePointForm.test.tsx` (Testing Library + user-event): required title, validation messages, map-click coordinate passthrough (mocked)

**Checkpoint**: Signed-in user can create, label, and organize points with optional photo (R2) and see folder-filtered map; US3 test suite green

---

## Phase 6: User Story 4 — Public visibility and private groups (Priority: P2)

**Goal**: Signed-in users see all others’ public points; private group content only for members; **active group** switcher; only active group’s member-only content on map/folder views with public layer per plan.

**Independent test**: Two users see each other’s public points; non-member does not see group-only points; member with **Group A** active does not see **Group B**’s private map layer until switch; “latest five” still excludes private group-only points from the public list.

- [ ] T049 [US4] Expose `GET`/`PATCH /api/me/preferences` in `backend/src/routes/me.ts` for `activeGroupId` with membership validation using `user_preferences` and `group_members` in `backend/src/services/preferencesService.ts` per [contracts/openapi.yaml](./contracts/openapi.yaml) `/me/preferences`
- [ ] T050 [P] [US4] Add group and membership management endpoints or bootstrap in `backend/src/routes/groups.ts` and `backend/src/services/groupService.ts` per [research.md](./research.md) (admin script, invite code, or seed — document in `specs/001-map-world-points/quickstart.md`)
- [ ] T051 [US4] Implement `GET /api/map/public` in `backend/src/routes/map.ts` with bbox query parameters per [contracts/openapi.yaml](./contracts/openapi.yaml) `/map/public`, implemented in `backend/src/services/mapPointsService.ts` (public **plus** `group_only` for `activeGroupId` when user is a member)
- [ ] T052 [P] [US4] Enforce `visibility` and `group_id` on every read/write in `mapPointsService.ts` and `pointWriteService.ts` for **FR-007** and **FR-008**
- [ ] T053 [US4] Add `frontend/src/features/groups/ActiveGroupSwitcher.tsx` bound to `PATCH /api/me/preferences` and reflect active label in `AppHeader` or map toolbar
- [ ] T054 [P] [US4] Replace/extend guest-only map layer in `frontend/src/features/map/SignedInMapLayer.tsx` (or refactor `MapPage.tsx`) to load `/api/map/public` for signed-in map with viewport bounds, preserving guest behavior from US1 when session is null
- [ ] T055 [US4] Update `specs/001-map-world-points/contracts/openapi.yaml` and `backend/src/openapi/openapi.yaml` for any new group or map query parameters

### Tests for User Story 4

- [ ] T056 [P] [US4] Add `backend/tests/integration/me.preferences.test.ts` with Supertest: `PATCH /api/me/preferences` with non-member `activeGroupId` returns **403**; public-only (null) succeeds for authenticated user
- [ ] T057 [P] [US4] Add `backend/tests/integration/map.public.test.ts` with Supertest: `GET /api/map/public` with bbox returns public points; group-only points appear only for member with that group **active**; other group’s private points **excluded** (seed two groups)
- [ ] T058 [P] [US4] Add `frontend/src/features/groups/ActiveGroupSwitcher.test.tsx` (Testing Library): calls preference API; active label updates (mocked fetch)

**Checkpoint**: Group privacy and active-group semantics match **FR-014** and acceptance scenarios in [spec.md](./spec.md) User Story 4; US4 test suite green

---

## Phase 7: User Story 5 — Favorites and point engagement (Priority: P3)

**Goal**: Favorites with favorite-folders; point detail with comments and 1–5 rating; guest read-only detail for public points (no comment list; show aggregate rating).

**Independent test**: Guest: open public detail from allowed entry — see title, description, photo, aggregate rating; no comments or write actions. Signed-in: favorites CRUD, comment thread, one rating per user per point, changeable. Matches **FR-009**, **FR-010**, **FR-012**.

- [ ] T059 [US5] Implement `GET /api/public/points/{pointId}` in `backend/src/routes/public.ts` using `publicPointsService.ts` to return 404 for non-visible points and guest-safe `Point` (no `myRating` for guest; omit comments) per [contracts/openapi.yaml](./contracts/openapi.yaml) `/public/points/{pointId}`
- [ ] T060 [P] [US5] Implement `GET`/`POST /api/points/{pointId}/comments` in `backend/src/routes/comments.ts` with `comments` table and signed-in-only list per [contracts/openapi.yaml](./contracts/openapi.yaml) `/points/{pointId}/comments`
- [ ] T061 [P] [US5] Implement `PUT /api/points/{pointId}/rating` in `backend/src/routes/ratings.ts` and `backend/src/services/ratingService.ts` with upsert and aggregate average via `backend/src/services/ratingAggregate.ts` for `Point` DTOs
- [ ] T062 [US5] Add favorites and favorite-folder APIs in `backend/src/routes/favorites.ts` and `backend/src/services/favoriteService.ts` per [data-model.md](./data-model.md) `favorites` and `favorite_folders`; add schemas and paths to `specs/001-map-world-points/contracts/openapi.yaml` and `backend/src/openapi/openapi.yaml` (per contract file note “to be expanded”)
- [ ] T063 [P] [US5] Build `frontend/src/features/points/PointDetailPanel.tsx` (or `frontend/src/features/points/PointDetailPage.tsx`) with guest vs signed-in UI per **FR-010** and **FR-012**
- [ ] T064 [P] [US5] Build `frontend/src/features/favorites/FavoritesPanel.tsx` for listing and moving favorites between favorite folders
- [ ] T065 [US5] Connect marker and list `onClick` in `MapPage.tsx` to open detail route or side panel in `frontend/src/routes/index.tsx` with optional `?pointId=` query

### Tests for User Story 5

- [ ] T066 [P] [US5] Add `backend/tests/integration/public.point-detail.test.ts` with Supertest: guest (no auth) `GET /api/public/points/{id}` returns public fields and aggregate rating; **no** comment thread in payload; 404 for hidden points
- [ ] T067 [P] [US5] Add `backend/tests/integration/engagement.test.ts` with Supertest: `GET`/`POST` comments and `PUT` rating require auth; favorite add/remove and favorite-folder moves behave per schema (seed users/points)
- [ ] T068 [P] [US5] Add `frontend/src/features/points/PointDetailPanel.test.tsx` and `frontend/src/features/favorites/FavoritesPanel.test.tsx` (Testing Library): guest shows no comment input; signed-in path mocked for comment/rating/favorites actions

**Checkpoint**: Engagement flows complete; guest detail is read-only for social fields; US5 test suite green

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation, operability, and spec alignment

- [ ] T069 [P] Walk through `specs/001-map-world-points/quickstart.md` and fix gaps in `backend/package.json` / `frontend/package.json` scripts so `pnpm install`, migrate, and two-server dev run match the doc
- [ ] T070 Harden `backend/src/routes/docs.ts` and env-based toggles in `backend/src/index.ts` for production (disable or protect Swagger) per [plan.md](./plan.md) and `.specify/memory/constitution.md`
- [ ] T071 [P] Add top-level `README.md` with pointer to `specs/001-map-world-points/plan.md` and how to run frontend/backend
- [ ] T072 Verify partial indexes and constraints in `backend/prisma/migrations` (or `@@index` in `schema.prisma`) match “latest five” and FK rules in [data-model.md](./data-model.md) (add follow-up Prisma migration if anything was deferred)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → no prerequisites
- **Foundational (Phase 2)** → depends on Setup; **blocks all user stories**
- **User stories** → all depend on Foundational completion; then prefer **P1 (US1, US2)** before **P2 (US3, US4)** and **P3 (US5)** for risk reduction
- **Polish (Phase 8)** → after all user stories in scope

### User Story Dependencies

- **US1** → after Foundational; no auth required for guest path
- **US2** → after Foundational; no hard dependency on US1 (but product-wise map already exists)
- **US3** → depends on **US2** (Clerk) for `POST /points` and user-owned folders/tags
- **US4** → depends on **US2** and **US3** (points and visibility model)
- **US5** → depends on **US2** and **US3** (points exist; favorites/comments/ratings attach to points). Can proceed in parallel with final US4 polish if teams split work, but map/detail integration should stay consistent

### Within Each User Story

- **US1–US5**: After implementation tasks, complete **Tests for User Story** (T024–T026, T034–T036, T045–T048, T056–T058, T066–T068) so the story is verified before moving on; integration tests need the app, DB, and auth fixtures from earlier phases
- **US1**: Backend latest query before guest map markers; DTO/photoUrl parallelizable with list UI
- **US2**: Webhook and middleware can follow ClerkProvider in either order, but user sync should exist before relying on `users.id` in writes
- **US3**: Core `POST /points` before photo upload; folders/tags parallel where separate files; T045 can run in parallel with T046–T048 once `geo` and `POST /points` exist
- **US4**: `preferences` and `map/public` service logic before full UI switcher integration
- **US5**: Public `GET` detail and aggregates before favorites UI; comments and ratings can parallel in backend

### Parallel Opportunities

- After Phase 2: **US1** and **US2** can be developed in parallel by different owners (public routes vs Clerk)
- [P] tasks within a phase: different files, no shared incomplete dependency
- **US3** folder routes vs **US3** tag routes after point write path exists
- **US5** comments route vs **US5** rating route after point IDs exist in DB; **US1–US5** test files marked [P] can run in parallel with each other when the corresponding routes/components exist

---

## Parallel Example: User Story 1

```text
# Backend DTOs while wiring latest query:
"backend/src/lib/schemas/point.ts" and "backend/src/lib/photoUrl.ts"

# Frontend: list panel + map layer can be split:
"frontend/src/features/map/LatestPointsPanel.tsx"
"frontend/src/features/map/GuestMapLayer.tsx" + "frontend/src/features/map/useGuestMapBounds.ts"
```

---

## Parallel Example: User Story 3

```text
# After POST /api/points exists:
"backend/src/routes/folders.ts" with "backend/src/services/folderService.ts"
"backend/src/routes/tags.ts" with "backend/src/services/tagService.ts"
```

---

## Implementation Strategy

### MVP First (minimum shippable slice)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1) — guest map + latest five
3. Complete Phase 4 (US2) — sign-in
4. Complete Phase 5 (US3) — create and organize
5. **Stop and validate** with quickstart scenarios before private groups and engagement depth

### Incremental Delivery

1. **Setup + Foundational** → health + DB + docs
2. **+ US1** → guest experience demo (list + map)
3. **+ US2** → accounts
4. **+ US3** → core product (“my points”)
5. **+ US4** → private groups and full signed-in map
6. **+ US5** → social layer
7. **+ Polish** → production operability

### Parallel Team Strategy

1. Shared completion of Phases 1–2
2. Developer A: US1 (public read path + map) while Developer B: US2 (Clerk + user sync)
3. Then converge on US3, split backend routes vs frontend forms
4. US4/US5 as above with API vs UI split

---

## Format Validation (checklist for generators)

- Every line uses `- [ ] T###` with a description containing at least one file path
- [Story] label present on user-story **implementation and test** tasks: `[US1]` through `[US5]`
- **Setup / Foundational / Polish** tasks: **no** `[US#]` label
- **[P]** only where files and dependencies allow parallel work

---

## Notes

- Extend `specs/001-map-world-points/contracts/openapi.yaml` (and the served copy) whenever new routes are added; version bump on breaking changes per [plan.md](./plan.md)
- R2: local dev may use mock presign if needed; document in `specs/001-map-world-points/quickstart.md`
- Group membership **onboarding** (invite vs admin) is explicitly flexible in [research.md](./research.md) — implement one path in T050 and document it
