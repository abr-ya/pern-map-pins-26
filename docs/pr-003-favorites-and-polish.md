# PR: Favorites APIs, `FavoritesPanel`, and frontend tests (`003-favorites-and-polish`)

**Suggested PR title**: `feat: favorites and favorite-folder API, FavoritesPanel, and frontend test coverage`

---

## Summary

This PR delivers the **favorites** slice of User Story 5 (**FR-009**): signed-in users can persist **favorite points** and organize them under **favorite folders** via new REST endpoints, and manage them from the **`FavoritesPanel`** embedded in **`PointDetailPanel`**. Contracts are documented in **`specs/001-map-world-points/contracts/openapi.yaml`** and **`backend/src/openapi/openapi.yaml`**.

Frontend **Testing Library** coverage was added for **`FavoritesPanel`** and expanded **`PointDetailPanel`** tests with **signed-in** flows (**T068**).

**Deferred** backend integration (**T066–T067**) and **Phase 2** polish (**T069–T074**) were split for reviewability — follow **[`004`](../specs/004-tests-and-polish/tasks.md)** (integration tests delivered there) then **[`005`](../specs/005-cross-cutting/tasks.md)** (polish/E2E). This document reflects the **`003`** merge-time split.

---

## What ships in this PR

| Area | Behaviour |
|------|-----------|
| **Favorites API** | `GET`/`POST` `/api/favorites`, `PATCH`/`DELETE` `/api/favorites/:pointId` — auth required; add/remove/move favorites; visibility aligned with readable points (`requirePointReadableForClerk` on add). |
| **Favorite folders API** | `GET`/`POST` `/api/favorite-folders`, `PATCH`/`DELETE` `/api/favorite-folders/:favoriteFolderId` — CRUD scoped to current user. |
| **OpenAPI** | Paths and schemas for favorites and favorite-folder operations in contract + mirrored `backend` OpenAPI. |
| **Frontend** | **`FavoritesPanel`** — list favorites, folder moves, remove, create folder; wired into **`PointDetailPanel`** for signed-in users. |
| **Frontend tests** | **`FavoritesPanel.test.tsx`**; **`PointDetailPanel.test.tsx`** extended with Clerk/auth hoisting and signed-in assertions (including **`PUT`** rating). |

Related design: [data-model.md](../specs/001-map-world-points/data-model.md) (`favorites`, `favorite_folders`), [spec.md](../specs/001-map-world-points/spec.md) **FR-009**.

---

## Out of scope (follow-up slices)

| Track | Tasks | Tracking |
|-------|-------|----------|
| **Backend integration (US5)** | **T066**, **T067** | Delivered via **[PR `004`](./pr-004-backend-integration-tests.md)** / **`specs/004-tests-and-polish/tasks.md`**. |
| **Polish / cross-cutting** | **T069–T074** | **`specs/005-cross-cutting/tasks.md`**. |

Optional UI follow-up (**`?pointId=`** deep link for detail, originally **T065**) may land in **005** or a small separate task — see **`005`** notes.

---

## How to test locally

From repo root (env per **[`specs/001-map-world-points/quickstart.md`](../specs/001-map-world-points/quickstart.md)**):

- **Backend**: `pnpm --filter backend test` *(run locally; Vitest integration tests can be heavy in sandboxes)*  
- **Frontend**: `pnpm --filter frontend test`  
- **Manual**: run API + Vite; sign in → open a point from the sidebar or map → use **Favorites** (add, move folder, remove); verify **`/api/webhooks/clerk`** has provisioned **`users`** if protected routes complain about **`USER_NOT_PROVISIONED`**.

---

## Spec / docs pointers

| Artifact | Purpose |
|----------|---------|
| [`specs/003-favorites-and-polish/tasks.md`](../specs/003-favorites-and-polish/tasks.md) | Closed checklist for this slice (**status: delivered**) |
| [`specs/004-tests-and-polish/tasks.md`](../specs/004-tests-and-polish/tasks.md) | Backend integration remainder (**T066–T067**), delivered slice |
| [`specs/005-cross-cutting/tasks.md`](../specs/005-cross-cutting/tasks.md) | Polish + E2E CI (**T069–T074**) |
| [`specs/001-map-world-points/contracts/openapi.yaml`](../specs/001-map-world-points/contracts/openapi.yaml) | API contract |

---

## Checklist for reviewers

- [ ] Favorites mutations require auth; guests do not see favorites UI in **`PointDetailPanel`** (guest path unchanged aside from intentional sign-in prompts elsewhere).
- [ ] Favorite folder IDs in requests belong to the current user (**404**/safe behaviour on misuse).
- [ ] **`POST /api/favorites`** only allows points the user can **read** (same rules as comments/ratings visibility).
- [ ] OpenAPI contract matches implemented routes and response shapes.
- [ ] Deferred scope is clear: integration **004** (**T066–T067**) and polish **005** (**T069–T074**), not this PR.

---

## Copy-paste block for GitHub

Use the **Suggested PR title** above; paste **Summary** through **Checklist for reviewers**, or link to this file as the single source of truth.
