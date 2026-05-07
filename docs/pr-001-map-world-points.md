# PR: Points on the map — US1–US4 (`001-map-world-points`)

**Suggested PR title**: `feat: map app foundation through US4 (guest map, Clerk auth, CRUD points, groups & public bbox layer)`

---

## Summary

This change set delivers the first shippable vertical slice of the “Points on the map” application: guests see the latest public points on an OSM map; signed-in users authenticate with Clerk, create and organize points (folders, tags, optional Cloudinary photo), and use a bbox-based public map layer with private-group visibility controlled by an active-group preference.

Later scope (**User Story 5** and polish) is split across follow-up specs: the first slice (public detail, comments, ratings, detail UI) ships in [`specs/002-point-engagement/tasks.md`](../specs/002-point-engagement/tasks.md); **favorites**, remaining tests, and cross-cutting polish live in [`specs/003-favorites-and-polish/tasks.md`](../specs/003-favorites-and-polish/tasks.md) (tasks **T062, T064, T066–T074**).

---

## What ships in this PR

| Area | Behaviour |
|------|-----------|
| **US1 — Guest map** | Interactive Leaflet map; “latest five” public points; markers and list aligned; framing for sparse markers |
| **US2 — Auth** | Clerk (email/password and Google-ready setup); webhook user sync; protected routes |
| **US3 — My points** | Map click → create point (title/description/photo); folders and tags; folder filter on map |
| **US4 — Visibility** | `/api/map/public` with bbox; preferences for `activeGroupId`; member-only vs public rules; Active Group UI |

Infrastructure from the feature plan remains in-repo: PostgreSQL via Prisma, OpenAPI (+ Swagger guard in development), structured logging, geo validation.

---

## Out of scope (follow-up)

- **User Story 5 (remainder)**: favorites and favorite-folder APIs, `FavoritesPanel`, fuller engagement tests, Phase 2 polish (`specs/003-favorites-and-polish/tasks.md`). The **002** PR already delivered public detail, comments, ratings, and `PointDetailPanel` ([`specs/002-point-engagement/tasks.md`](../specs/002-point-engagement/tasks.md)).

Product note: [`specs/001-map-world-points/spec.md`](../specs/001-map-world-points/spec.md) still describes the full **US5** narrative (including **favorites**); the **002** merge completes detail + comments + rating UI; **favorites** and listed polish items ship with **003**.

---

## How to test locally

From the repo root (see [`specs/001-map-world-points/quickstart.md`](../specs/001-map-world-points/quickstart.md) for env vars):

- **Unit/integration**:  
  `pnpm -r --filter '!e2e' test`

- **E2E** (when configured): uses the `e2e/` workspace (`pnpm test:e2e` at root when documented).

Ensure `DATABASE_URL`, Clerk keys, and optional Cloudinary keys are set for full flows beyond mocked tests.

---

## Spec / docs pointers

| Artifact | Purpose |
|---------|---------|
| [`specs/001-map-world-points/spec.md`](../specs/001-map-world-points/spec.md) | Requirements and user stories |
| [`specs/001-map-world-points/tasks.md`](../specs/001-map-world-points/tasks.md) | Implemented task checklist (US1–US4); link to deferrals |
| [`specs/002-point-engagement/tasks.md`](../specs/002-point-engagement/tasks.md) | Closed slice: detail, comments, ratings, `PointDetailPanel` |
| [`specs/003-favorites-and-polish/tasks.md`](../specs/003-favorites-and-polish/tasks.md) | Favorites + remaining US5 tests + Phase 2 polish |
| [`specs/001-map-world-points/contracts/openapi.yaml`](../specs/001-map-world-points/contracts/openapi.yaml) | API contract (aligned with served spec under `backend/`) |

---

## Checklist for reviewers

- [ ] Map and “latest five” behaviour matches **US1** and does not expose extra public pins for guests.
- [ ] Auth and webhook paths look correct for your Clerk configuration.
- [ ] Point creation, visibility, and `activeGroupId` semantics match **US4** acceptance scenarios.
- [ ] Deferred work after **001** is understood: **002** (engagement slice) vs **003** (favorites + polish) — see task files above.

---

## Copy-paste block for GitHub

Use the **Suggested PR title** above, then paste the sections **Summary** through **Checklist for reviewers** (or link to this file in the PR body for a single source of truth).
