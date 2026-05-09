# PR: Backend integration coverage for public detail & engagement (`004-tests-and-polish`)

**Suggested PR title**: `test: Supertest coverage for public point detail (T066) and engagement APIs (T067)`

---

## Summary

This PR closes **Phase 1** of **[`specs/004-tests-and-polish/tasks.md`](../specs/004-tests-and-polish/tasks.md)**: strengthens **guest** **`GET /api/public/points/{id}`** expectations (aggregate rating + **no** embedded comment payload; hidden points remain **404**) and adds **`backend/tests/integration/engagement.test.ts`** for engagement routes — **comments**, **rating**, **favorites**, and **favorite folders** — including **401** when unauthenticated and **favorites** add/remove/move behaviour aligned with **`Favorite`** JSON schema.

A small frontend test fix uses an exact **`Comments`** heading match so **`getByText(/Comments/i)`** does not collide with **“No comments yet.”**

**Deferred**: **T069–T074** moved to **[`specs/005-cross-cutting/tasks.md`](../specs/005-cross-cutting/tasks.md)** so this PR stays review-sized.

---

## What ships

| Area | Change |
|------|--------|
| **Public point detail tests** (**T066**) | `backend/tests/integration/public.point-detail.test.ts` — **`pointJsonSchema.strict()`** on **200** response (no stray keys / comment thread). Existing **404** cases for non–world-public points unchanged in intent. |
| **Engagement tests** (**T067**) | `backend/tests/integration/engagement.test.ts` — Supertest against **`createApp()`**; mocked Clerk **`getAuth`** + Prisma mocks consistent with **`comments`** / **`ratings`** suites. |
| **Frontend** | **`PointDetailPanel.test.tsx`** — **`/^Comments$/i`** matcher to avoid **`TestingLibraryElementError`** (multiple **`Comments`** matches). |
| **Specs** | **004** tasks marked delivered; **005** checklist created for **T069–T074**. |

---

## Follow-up (005)

| Previously in 004 Phase 2 | Now |
|---------------------------|-----|
| **T069–T074** | **[`specs/005-cross-cutting/tasks.md`](../specs/005-cross-cutting/tasks.md)** |

---

## How to verify locally

From repo root (env per **[`specs/001-map-world-points/quickstart.md`](../specs/001-map-world-points/quickstart.md)** when running the full stack):

- **Backend**: `pnpm --filter backend exec vitest run tests/integration/public.point-detail.test.ts tests/integration/engagement.test.ts`
- **Frontend**: `pnpm --filter frontend exec vitest run src/features/points/PointDetailPanel.test.tsx`

*(Vitest integration runs locally; sandbox limits may apply to agents.)*

---

## Spec / docs pointers

| Artifact | Purpose |
|----------|---------|
| [`specs/004-tests-and-polish/tasks.md`](../specs/004-tests-and-polish/tasks.md) | **004** checklist — Phase 1 delivered |
| [`specs/005-cross-cutting/tasks.md`](../specs/005-cross-cutting/tasks.md) | **005** — operability, docs, Playwright, e2e CI |
| [`specs/001-map-world-points/checklists/requirements.md`](../specs/001-map-world-points/checklists/requirements.md) | Guest detail: no inline comment thread (**FR-012** alignment for public detail endpoint) |

---

## Checklist for reviewers

- [ ] Public **`GET /api/public/points/{id}`** still returns only **`Point`**-shaped JSON (no **`comments`** / thread).
- [ ] **`engagement.test.ts`** auth-off cases hit **`requireAuth`** (**401**) before handlers; mocked-auth cases mirror **`favoriteService`** rules (folder ownership **404**, move/delete semantics).
- [ ] Frontend **`PointDetailPanel`** assertion is intentionally strict on the **Comments** section label only.
- [ ] Out of scope for this PR: **005** (**T069–T074**) — README, Swagger posture, Playwright/GitHub Actions, etc.

---

## Copy-paste for GitHub

Use the suggested title; paste **Summary** through **Checklist**, or link to this file.
