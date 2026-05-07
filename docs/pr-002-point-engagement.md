# PR: Point engagement slice — detail, comments, ratings (`002-point-engagement`)

**Suggested PR title**: `feat: public point detail, comments, ratings, and sidebar PointDetailPanel`

---

## Summary

This PR completes an incremental **User Story 5** slice: guests and signed-in users can open a **read-only public point detail** (title, description, photo, aggregate rating) with map-aligned visibility; signed-in users see **comments** (list + post) and can set a **changeable 1–5 rating**. The **sidebar** hosts **`PointDetailPanel`**; clicks on **latest-five list rows** and **map markers** (guest and signed-in cluster layers) open that detail.

**Favorites** (API + `FavoritesPanel`), broader engagement test coverage, and **Phase 2 polish** (quickstart sweep, Swagger hardening, README, E2E/CI) are intentionally **deferred** to [`specs/003-favorites-and-polish/tasks.md`](../specs/003-favorites-and-polish/tasks.md).

---

## What ships in this PR

| Area | Behaviour |
|------|-----------|
| **Public detail API** | `GET /api/public/points/:pointId` — visibility rules aligned with map/public detail; guest has no `myRating`; aggregate rating included |
| **Comments** | `GET`/`POST /api/points/:pointId/comments` — auth required; same visibility guard as detail |
| **Ratings** | `PUT /api/points/:pointId/rating` — upsert + returned `averageRating` / `myRating`; uses `ratingAggregate` helper |
| **Read access** | `requirePointReadableForClerk` in `pointReadAccess.ts` shared by comments and ratings; `getPublicPointById` refactored to shared visibility helpers |
| **Clerk guard** | `getOptionalClerkUserId` so public routes do not call `getAuth` when Clerk middleware is not mounted |
| **Frontend** | `PointDetailPanel`, `apiPutJson`, extended `LatestPointsPanel`, marker click handlers on `GuestMapLayer` / `ClusteredMarkers`, `MapPage` selection state |
| **Tests** | Integration: `public.point-detail`, `comments`, `ratings`; frontend: `PointDetailPanel` guest test |

Other commits on the branch may include **CI/deploy** adjustments (e.g. deploy workflow triggers); review the full diff for workflow-only changes.

---

## Out of scope (003)

- **T062 / T064**: favorites and favorite-folder APIs + `FavoritesPanel`
- **T066–T068**: fuller engagement / favorites test matrix (partially started)
- **T069–T074**: quickstart/script alignment, production Swagger policy, root README, Prisma index audit, Playwright US2/US3, `e2e` GitHub Actions workflow

See [`specs/003-favorites-and-polish/tasks.md`](../specs/003-favorites-and-polish/tasks.md).

---

## How to test locally

From repo root (env per [`specs/001-map-world-points/quickstart.md`](../specs/001-map-world-points/quickstart.md)):

- **Backend**: `pnpm --filter backend test` (run locally; Vitest can be heavy in sandboxes)
- **Frontend**: `pnpm --filter frontend test`
- **Manual**: run API + Vite; as guest — open a latest-five item or pin → detail without comments; sign in → comments + rating controls

---

## Spec / docs pointers

| Artifact | Purpose |
|----------|---------|
| [`specs/002-point-engagement/tasks.md`](../specs/002-point-engagement/tasks.md) | Closed checklist for this slice |
| [`specs/003-favorites-and-polish/tasks.md`](../specs/003-favorites-and-polish/tasks.md) | Remaining US5 + polish |
| [`specs/001-map-world-points/spec.md`](../specs/001-map-world-points/spec.md) | Full requirements (US5 includes favorites — completed after 003) |
| [`specs/001-map-world-points/contracts/openapi.yaml`](../specs/001-map-world-points/contracts/openapi.yaml) | API contract |

---

## Checklist for reviewers

- [ ] Public detail never exposes group-only or hidden points to the wrong viewer (404 vs map rules).
- [ ] Guest UI: no comment list or rating entry; sign-in prompt is clear.
- [ ] Signed-in: comments and rating mutations behave; errors surface sanely.
- [ ] Deferred scope is understood: **003** for favorites + polish, not silent requirement creep in this PR.

---

## Copy-paste block for GitHub

Use the **Suggested PR title** above; paste **Summary** through **Checklist for reviewers**, or link to this file as the single source of truth.
