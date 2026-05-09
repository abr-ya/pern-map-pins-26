# Tasks: Integration tests & product polish (004-tests-and-polish)

**Feature branch**: `004-tests-and-polish` (create when starting this work)

**Status**: Carries **remaining** items from [`specs/003-favorites-and-polish/tasks.md`](../003-favorites-and-polish/tasks.md) after the **003 PR** (favorites APIs, `FavoritesPanel`, frontend tests **T068**). Task IDs **T066–T074** are unchanged for traceability.

**Prerequisites**: 003 slice merged (see [`specs/003-favorites-and-polish/tasks.md`](../003-favorites-and-polish/tasks.md)). Design references: [plan.md](../001-map-world-points/plan.md), [spec.md](../001-map-world-points/spec.md), [data-model.md](../001-map-world-points/data-model.md), [contracts/openapi.yaml](../001-map-world-points/contracts/openapi.yaml).

**Tests**: Vitest + Supertest + Playwright where listed; run locally per workspace rules.

---

## Phase 1: User Story 5 — Backend integration tests (remainder)

**Goal**: Align Supertest coverage with public detail, engagement (comments, ratings, favorites), and checklist expectations.

- [ ] T066 [P] [US5] Confirm or extend `backend/tests/integration/public.point-detail.test.ts`: guest `GET /api/public/points/{id}` — public fields + aggregate rating; **no** comment thread in payload; 404 for hidden points (align with checklist)
- [ ] T067 [P] [US5] Add `backend/tests/integration/engagement.test.ts` with Supertest: `GET`/`POST` comments and `PUT` rating require auth; favorite add/remove and favorite-folder moves behave per schema (seed users/points)

---

## Phase 2: Polish & cross-cutting concerns

**Purpose**: End-to-end validation, operability, spec alignment.

- [ ] T069 [P] Walk through `specs/001-map-world-points/quickstart.md` and fix gaps in `backend/package.json` / `frontend/package.json` scripts so `pnpm install`, migrate, and two-server dev run match the doc
- [ ] T070 Harden `backend/src/routes/docs.ts` and env-based toggles in `backend/src/index.ts` for production (disable or protect Swagger) per [plan.md](../001-map-world-points/plan.md) and `.specify/memory/constitution.md`
- [ ] T071 [P] Add top-level `README.md` with pointer to `specs/001-map-world-points/plan.md` and how to run frontend/backend
- [ ] T072 Verify partial indexes and constraints in `backend/prisma/migrations` (or `@@index` in `schema.prisma`) match “latest five” and FK rules in [data-model.md](../001-map-world-points/data-model.md) (add follow-up Prisma migration if anything was deferred)
- [ ] T073 [P] Extend Playwright coverage to **US2** sign-in (`e2e/tests/auth.spec.ts`) and **US3** create-point (`e2e/tests/create-point.spec.ts`) per [plan.md](../001-map-world-points/plan.md) Constitution Check; use Clerk testing tokens / mocked auth and `page.route` for API where a real DB is not desired
- [ ] T074 Add GitHub Actions workflow `.github/workflows/e2e.yml` running `pnpm install`, `pnpm --filter e2e exec playwright install --with-deps chromium`, `pnpm test:e2e`; upload `e2e/playwright-report/` as artifact on failure (matches `reporter` setting in `e2e/playwright.config.ts` for CI)

---

## Dependencies

- **T062** (favorites APIs) is delivered in **003**; **T067** depends on it for favorite flows in integration tests.
- **Phase 2** can proceed in parallel where tasks do not share files.

---

## Notes

- Optional deep-link `?pointId=` for point detail was listed under 002 **T065**; still not implemented — may be added in 004 or a small UI follow-up.
- OpenAPI: keep `specs/001-map-world-points/contracts/openapi.yaml` and `backend/src/openapi/openapi.yaml` aligned on changes; version bump on breaking changes per [plan.md](../001-map-world-points/plan.md).
