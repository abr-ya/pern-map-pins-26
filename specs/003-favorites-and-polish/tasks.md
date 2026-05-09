# Tasks: Favorites & product polish (003-favorites-and-polish)

**Status**: **Delivered slice** — this checklist is complete for the PR from branch **`003-favorites-and-polish`** (favorites APIs, `FavoritesPanel`, frontend tests **T068**).

**Deferred**: backend integration **T066–T067** landed in **`004`**; product polish **T069–T074** is tracked in [`specs/005-cross-cutting/tasks.md`](../005-cross-cutting/tasks.md).

**Input**: Remaining work was originally split when closing [`specs/002-point-engagement/tasks.md`](../002-point-engagement/tasks.md).

**Design references**: [plan.md](../001-map-world-points/plan.md), [spec.md](../001-map-world-points/spec.md), [data-model.md](../001-map-world-points/data-model.md), [contracts/openapi.yaml](../001-map-world-points/contracts/openapi.yaml).

**Tests**: Vitest + Supertest + Testing Library where applicable; run locally per workspace rules.

---

## Phase 1: User Story 5 — Favorites (remainder) — shipped in 003

**Goal**: Close **FR-009** / favorites narrative in [spec.md](../001-map-world-points/spec.md); integrate with point detail when useful.

- [X] T062 [US5] Add favorites and favorite-folder APIs in `backend/src/routes/favorites.ts` and `backend/src/services/favoriteService.ts` per [data-model.md](../001-map-world-points/data-model.md) `favorites` and `favorite_folders`; add schemas and paths to `specs/001-map-world-points/contracts/openapi.yaml` and `backend/src/openapi/openapi.yaml` (per contract file note “to be expanded”)
- [X] T064 [P] [US5] Build `frontend/src/features/favorites/FavoritesPanel.tsx` for listing and moving favorites between favorite folders

### Frontend tests (US5)

- [X] T068 [P] [US5] Testing Library: `frontend/src/features/points/PointDetailPanel.test.tsx` — signed-in/mocked flows; `frontend/src/features/favorites/FavoritesPanel.test.tsx`

**Shipped via [004](../004-tests-and-polish/tasks.md)**: backend integration tasks **T066**, **T067**.

---

## Phase 2 — polish & cross-cutting

Polish tasks **T069–T074** are tracked in **[`specs/005-cross-cutting/tasks.md`](../005-cross-cutting/tasks.md)** (**005** slice).

---

## Notes

- Optional deep-link `?pointId=` for point detail was listed under 002 **T065**; may land in **005** or a small UI task — see [`specs/005-cross-cutting/tasks.md`](../005-cross-cutting/tasks.md).
