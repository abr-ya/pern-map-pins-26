# Tasks: Point engagement — **delivered slice** (002-point-engagement)

**Status**: This checklist is **complete** for the PR merged from branch **`002-point-engagement`** (public detail, comments, ratings, detail UI, map/list navigation). **Favorites**, extra tests, and **cross-cutting polish** are tracked in [`specs/003-favorites-and-polish/tasks.md`](../003-favorites-and-polish/tasks.md) (**T062, T064, T066–T074**).

**Prerequisites** (historical): [001-map-world-points](../001-map-world-points/) through US4. Design: [plan.md](../001-map-world-points/plan.md), [spec.md](../001-map-world-points/spec.md), [contracts/openapi.yaml](../001-map-world-points/contracts/openapi.yaml).

**Product note**: [spec.md](../001-map-world-points/spec.md) **US5** still mentions **favorites**; behaviour matches that narrative fully only after **003**.

---

## Phase 1: User Story 5 — engagement slice (no favorites)

**Goal**: Guest read-only point detail (**FR-012**); signed-in comments and 1–5 rating (**FR-010**); map-aligned visibility for `GET /api/public/points/{id}`.

- [X] T059 [US5] Implement `GET /api/public/points/{pointId}` in `backend/src/routes/public.ts` using `publicPointsService.ts` (and shared `pointReadAccess`) per OpenAPI `/public/points/{pointId}`
- [X] T060 [P] [US5] Implement `GET`/`POST /api/points/{pointId}/comments` in `backend/src/routes/comments.ts` per OpenAPI `/points/{pointId}/comments`
- [X] T061 [P] [US5] Implement `PUT /api/points/{pointId}/rating` in `backend/src/routes/ratings.ts`, `ratingService.ts`, `ratingAggregate.ts`
- [X] T063 [P] [US5] Build `frontend/src/features/points/PointDetailPanel.tsx` with guest vs signed-in UI per **FR-010** / **FR-012**
- [X] T065 [US5] Open detail from `MapPage.tsx` via marker/list clicks (sidebar; optional `?pointId=` URL deferred)

**Delivered tests (non-exhaustive vs original T066–T068)**:

- [X] Backend: `backend/tests/integration/public.point-detail.test.ts`, `comments.test.ts`, `ratings.test.ts` (and related)
- [X] Frontend: `frontend/src/features/points/PointDetailPanel.test.tsx` (guest path)

---

## Follow-up

| Track | Location |
|-------|----------|
| Favorites APIs + UI, remaining integration/FE tests, Phase 2 polish | [`specs/003-favorites-and-polish/tasks.md`](../003-favorites-and-polish/tasks.md) |

---

## Notes

- `getOptionalClerkUserId` / `isClerkAuthEnabled` in `backend/src/middleware/clerkAuth.ts` keep public routes safe when Clerk env is absent (e.g. tests).
- Keep `backend/src/openapi/openapi.yaml` aligned with `specs/001-map-world-points/contracts/openapi.yaml` when contracts change.
