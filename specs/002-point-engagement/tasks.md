# Tasks: Point engagement & polish (002-point-engagement)

**Feature branch**: `002-point-engagement` (create when starting this work)

**Input**: Deferred work extracted from [`specs/001-map-world-points/tasks.md`](../001-map-world-points/tasks.md).

**Prerequisites**: [001-map-world-points](../001-map-world-points/) delivered through **Phase 6 (US4)** in repo. Design references: [plan.md](../001-map-world-points/plan.md), [spec.md](../001-map-world-points/spec.md) (User Story 5 + polish/adoption), [research.md](../001-map-world-points/research.md), [data-model.md](../001-map-world-points/data-model.md), [contracts/openapi.yaml](../001-map-world-points/contracts/openapi.yaml).

**Tests**: Same stack as Phase 7–8 in the original breakdown (Vitest + Supertest + Testing Library + Playwright where listed).

**Organization**: Phase 1 = User Story 5 (engagement). Phase 2 = cross-cutting polish. Task IDs **T059–T074** are preserved for continuity with historical planning.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies on incomplete tasks in the same batch)
- **[Story]**: User story **[US5]** from [spec.md](../001-map-world-points/spec.md)
- Every task includes at least one concrete file path

## Path Conventions

- Same as [plan.md](../001-map-world-points/plan.md): `frontend/src/`, `backend/src/`; keep `backend/src/openapi/openapi.yaml` aligned with `specs/001-map-world-points/contracts/openapi.yaml` when extending contracts.

---

## Phase 1: User Story 5 — Favorites and point engagement (Priority: P3)

**Goal**: Favorites with favorite-folders; point detail with comments and 1–5 rating; guest read-only detail for public points (no comment list; show aggregate rating).

**Independent test**: Guest: open public detail from allowed entry — see title, description, photo, aggregate rating; no comments or write actions. Signed-in: favorites CRUD, comment thread, one rating per user per point, changeable. Matches **FR-009**, **FR-010**, **FR-012**.

- [X] T059 [US5] Implement `GET /api/public/points/{pointId}` in `backend/src/routes/public.ts` using `publicPointsService.ts` to return 404 for non-visible points and guest-safe `Point` (no `myRating` for guest; omit comments) per [contracts/openapi.yaml](../001-map-world-points/contracts/openapi.yaml) `/public/points/{pointId}`
- [X] T060 [P] [US5] Implement `GET`/`POST /api/points/{pointId}/comments` in `backend/src/routes/comments.ts` with `comments` table and signed-in-only list per [contracts/openapi.yaml](../001-map-world-points/contracts/openapi.yaml) `/points/{pointId}/comments`
- [ ] T061 [P] [US5] Implement `PUT /api/points/{pointId}/rating` in `backend/src/routes/ratings.ts` and `backend/src/services/ratingService.ts` with upsert and aggregate average via `backend/src/services/ratingAggregate.ts` for `Point` DTOs
- [ ] T062 [US5] Add favorites and favorite-folder APIs in `backend/src/routes/favorites.ts` and `backend/src/services/favoriteService.ts` per [data-model.md](../001-map-world-points/data-model.md) `favorites` and `favorite_folders`; add schemas and paths to `specs/001-map-world-points/contracts/openapi.yaml` and `backend/src/openapi/openapi.yaml` (per contract file note “to be expanded”)
- [ ] T063 [P] [US5] Build `frontend/src/features/points/PointDetailPanel.tsx` (or `frontend/src/features/points/PointDetailPage.tsx`) with guest vs signed-in UI per **FR-010** and **FR-012**
- [ ] T064 [P] [US5] Build `frontend/src/features/favorites/FavoritesPanel.tsx` for listing and moving favorites between favorite folders
- [ ] T065 [US5] Connect marker and list `onClick` in `MapPage.tsx` to open detail route or side panel in `frontend/src/routes/index.tsx` with optional `?pointId=` query

### Tests for User Story 5

- [ ] T066 [P] [US5] Add `backend/tests/integration/public.point-detail.test.ts` with Supertest: guest (no auth) `GET /api/public/points/{id}` returns public fields and aggregate rating; **no** comment thread in payload; 404 for hidden points
- [ ] T067 [P] [US5] Add `backend/tests/integration/engagement.test.ts` with Supertest: `GET`/`POST` comments and `PUT` rating require auth; favorite add/remove and favorite-folder moves behave per schema (seed users/points)
- [ ] T068 [P] [US5] Add `frontend/src/features/points/PointDetailPanel.test.tsx` and `frontend/src/features/favorites/FavoritesPanel.test.tsx` (Testing Library): guest shows no comment input; signed-in path mocked for comment/rating/favorites actions

**Checkpoint**: Engagement flows complete; guest detail is read-only for social fields; US5 test suite green

---

## Phase 2: Polish & cross-cutting concerns

**Purpose**: End-to-end validation, operability, and spec alignment

- [ ] T069 [P] Walk through `specs/001-map-world-points/quickstart.md` and fix gaps in `backend/package.json` / `frontend/package.json` scripts so `pnpm install`, migrate, and two-server dev run match the doc
- [ ] T070 Harden `backend/src/routes/docs.ts` and env-based toggles in `backend/src/index.ts` for production (disable or protect Swagger) per [plan.md](../001-map-world-points/plan.md) and `.specify/memory/constitution.md`
- [ ] T071 [P] Add top-level `README.md` with pointer to `specs/001-map-world-points/plan.md` and how to run frontend/backend
- [ ] T072 Verify partial indexes and constraints in `backend/prisma/migrations` (or `@@index` in `schema.prisma`) match “latest five” and FK rules in [data-model.md](../001-map-world-points/data-model.md) (add follow-up Prisma migration if anything was deferred)
- [ ] T073 [P] Extend Playwright coverage to **US2** sign-in (`e2e/tests/auth.spec.ts`) and **US3** create-point (`e2e/tests/create-point.spec.ts`) per [plan.md](../001-map-world-points/plan.md) Constitution Check (E2E recommended for sign-in and create point); use Clerk testing tokens / mocked auth and `page.route` for API where a real DB is not desired
- [ ] T074 Add GitHub Actions workflow `.github/workflows/e2e.yml` running `pnpm install`, `pnpm --filter e2e exec playwright install --with-deps chromium`, `pnpm test:e2e`; upload `e2e/playwright-report/` as artifact on failure (matches `reporter` setting in `e2e/playwright.config.ts` for CI)

---

## Dependencies & execution order

### Phase dependencies

- **Phase 1 (US5)** → requires **001** complete through US4 (auth, points, map/public, visibility)
- **Phase 2 (Polish)** → after Phase 1 unless a polish task is explicitly independent (e.g. T071 README can be parallelized early if desired)

### User story (US5)

- **US5** → depends on **US2** and **US3** from 001 (points exist; favorites/comments/ratings attach to points). Public `GET` detail and aggregates before favorites UI; comments and ratings can parallel in backend

### Parallel opportunities

- **US5** comments route vs **US5** rating route after point IDs exist in DB
- [P] tasks in Phase 2: different files where no shared incomplete dependency

---

## Notes

- Extend `specs/001-map-world-points/contracts/openapi.yaml` (and the served copy in `backend/src/openapi/openapi.yaml`) whenever new routes are added; version bump on breaking changes per [plan.md](../001-map-world-points/plan.md)
- **Cloudinary**: unchanged from 001; see [quickstart.md](../001-map-world-points/quickstart.md)
