# Tasks: Backend integration tests (004-tests-and-polish) — delivered slice

**Feature branch**: `004-tests-and-polish`

**Status**: **Closed for PR** — Phase 1 (**T066**, **T067**) targets this merge. Polish and cross-cutting work (**T069–T074**) now lives under **[`specs/005-cross-cutting/tasks.md`](../005-cross-cutting/tasks.md)**.

**Context**: Earlier carry-over from **[`specs/003-favorites-and-polish/tasks.md`](../003-favorites-and-polish/tasks.md)** after the **003 PR**. Design references: [plan.md](../001-map-world-points/plan.md), [spec.md](../001-map-world-points/spec.md), [data-model.md](../001-map-world-points/data-model.md), [contracts/openapi.yaml](../001-map-world-points/contracts/openapi.yaml).

**Tests**: Vitest + Supertest; run locally per workspace rules.

---

## Delivered — Phase 1: User Story 5 (backend integration remainder)

**Goal**: Align Supertest coverage with public detail, engagement (comments, ratings, favorites), and checklist expectations.

- [x] T066 [P] [US5] Confirm or extend `backend/tests/integration/public.point-detail.test.ts`: guest `GET /api/public/points/{id}` — public fields + aggregate rating; **no** comment thread in payload; 404 for hidden points (align with checklist)
- [x] T067 [P] [US5] Add `backend/tests/integration/engagement.test.ts` with Supertest: `GET`/`POST` comments and `PUT` rating require auth; favorite add/remove and favorite-folder moves behave per schema (mocked users/points consistent with sibling integration tests)

---

## Follow-up

| Track | Tracking |
|-------|----------|
| **T069–T074** (quickstart/scripts, Swagger in prod, README, Prisma audit, Playwright, e2e CI) | **[`specs/005-cross-cutting/tasks.md`](../005-cross-cutting/tasks.md)** |

---

## Dependencies

- **T062** (favorites APIs) shipped in **003**; **T067** depended on favorites — satisfied.

---

## Notes

- Optional deep-link `?pointId=` for point detail was listed under 002 **T065**; may land in **005** or a small UI task — noted in **`005`** checklist notes.
