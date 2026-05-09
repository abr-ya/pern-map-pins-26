# Tasks: Operability, docs, and E2E CI (005-cross-cutting)

**Feature branch**: `005-cross-cutting` (create when starting this work)

**Status**: Absorbs **Phase 2** items previously listed under **[`specs/004-tests-and-polish/tasks.md`](../004-tests-and-polish/tasks.md)** (**T069–T074**). Task IDs are unchanged for traceability.

**Prerequisites**: **[`specs/004-tests-and-polish/tasks.md`](../004-tests-and-polish/tasks.md)** Phase 1 merged (**T066**, **T067** — backend integration tests remainder). Design references: [plan.md](../001-map-world-points/plan.md), [spec.md](../001-map-world-points/spec.md), [data-model.md](../001-map-world-points/data-model.md), [contracts/openapi.yaml](../001-map-world-points/contracts/openapi.yaml).

**Tests**: Vitest + Supertest + Playwright where listed; run locally per workspace rules.

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

- **T062** / **003** favorites APIs underpin **T067** integration tests (**004** delivered).
- **Phase 2** tasks can proceed in parallel where they do not share files.

---

## Notes

- Optional deep-link `?pointId=` for point detail was listed under 002 **T065**; still not implemented — may be added here or as a small UI follow-up.
- OpenAPI: keep `specs/001-map-world-points/contracts/openapi.yaml` and `backend/src/openapi/openapi.yaml` aligned on changes; version bump on breaking changes per [plan.md](../001-map-world-points/plan.md).
