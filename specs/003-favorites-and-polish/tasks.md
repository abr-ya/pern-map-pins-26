# Tasks: Favorites & product polish (003-favorites-and-polish)

**Feature branch**: `003-favorites-and-polish` (create when starting this work)

**Input**: Remaining work split out when closing [`specs/002-point-engagement/tasks.md`](../002-point-engagement/tasks.md) for PR (**T062, T064, T066–T074**). Task IDs are **unchanged** from the original 002 plan for traceability.

**Prerequisites**: [`specs/002-point-engagement/tasks.md`](../002-point-engagement/tasks.md) slice merged (public point detail, comments, ratings, `PointDetailPanel`, map/list navigation). Design references unchanged: [plan.md](../001-map-world-points/plan.md), [spec.md](../001-map-world-points/spec.md), [data-model.md](../001-map-world-points/data-model.md), [contracts/openapi.yaml](../001-map-world-points/contracts/openapi.yaml).

**Tests**: Vitest + Supertest + Testing Library + Playwright where listed; run locally per workspace rules.

---

## Phase 1: User Story 5 — Favorites (remainder)

**Goal**: Close **FR-009** / favorites narrative in [spec.md](../001-map-world-points/spec.md); integrate with point detail when useful.

- [X] T062 [US5] Add favorites and favorite-folder APIs in `backend/src/routes/favorites.ts` and `backend/src/services/favoriteService.ts` per [data-model.md](../001-map-world-points/data-model.md) `favorites` and `favorite_folders`; add schemas and paths to `specs/001-map-world-points/contracts/openapi.yaml` and `backend/src/openapi/openapi.yaml` (per contract file note “to be expanded”)
- [X] T064 [P] [US5] Build `frontend/src/features/favorites/FavoritesPanel.tsx` for listing and moving favorites between favorite folders

### Tests (US5 remainder)

- [ ] T066 [P] [US5] Confirm or extend `backend/tests/integration/public.point-detail.test.ts`: guest `GET /api/public/points/{id}` — public fields + aggregate rating; **no** comment thread in payload; 404 for hidden points (file may already exist; align with checklist)
- [ ] T067 [P] [US5] Add `backend/tests/integration/engagement.test.ts` with Supertest: `GET`/`POST` comments and `PUT` rating require auth; favorite add/remove and favorite-folder moves behave per schema (seed users/points)
- [ ] T068 [P] [US5] Testing Library: `frontend/src/features/points/PointDetailPanel.test.tsx` — add signed-in/mocked flows if missing; add `frontend/src/features/favorites/FavoritesPanel.test.tsx` (guest/signed-in as appropriate)

---

## Phase 2: Polish & cross-cutting concerns

**Purpose**: End-to-end validation, operability, and spec alignment

- [ ] T069 [P] Walk through `specs/001-map-world-points/quickstart.md` and fix gaps in `backend/package.json` / `frontend/package.json` scripts so `pnpm install`, migrate, and two-server dev run match the doc
- [ ] T070 Harden `backend/src/routes/docs.ts` and env-based toggles in `backend/src/index.ts` for production (disable or protect Swagger) per [plan.md](../001-map-world-points/plan.md) and `.specify/memory/constitution.md`
- [ ] T071 [P] Add top-level `README.md` with pointer to `specs/001-map-world-points/plan.md` and how to run frontend/backend
- [ ] T072 Verify partial indexes and constraints in `backend/prisma/migrations` (or `@@index` in `schema.prisma`) match “latest five” and FK rules in [data-model.md](../001-map-world-points/data-model.md) (add follow-up Prisma migration if anything was deferred)
- [ ] T073 [P] Extend Playwright coverage to **US2** sign-in (`e2e/tests/auth.spec.ts`) and **US3** create-point (`e2e/tests/create-point.spec.ts`) per [plan.md](../001-map-world-points/plan.md) Constitution Check; use Clerk testing tokens / mocked auth and `page.route` for API where a real DB is not desired
- [ ] T074 Add GitHub Actions workflow `.github/workflows/e2e.yml` running `pnpm install`, `pnpm --filter e2e exec playwright install --with-deps chromium`, `pnpm test:e2e`; upload `e2e/playwright-report/` as artifact on failure (matches `reporter` setting in `e2e/playwright.config.ts` for CI)

---

## Dependencies

- **T062** before **T067** (favorites in integration tests) and before **T064** / **T068** (Favorites UI + tests)
- **Phase 2** can proceed in parallel where tasks do not share files

---

## Notes

- Extend `specs/001-map-world-points/contracts/openapi.yaml` (and `backend/src/openapi/openapi.yaml`) when adding favorite routes; version bump on breaking changes per [plan.md](../001-map-world-points/plan.md)
- Optional deep-link `?pointId=` for point detail was listed under 002 **T065**; still not implemented — may be added here or in a small UI task
