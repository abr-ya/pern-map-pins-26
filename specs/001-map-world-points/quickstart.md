# Quickstart: local development

> Paths below assume the monorepo layout at repository root (`frontend/`, `backend/`, `e2e/`).

## Prerequisites

- **Node.js 20** LTS
- **pnpm** 9+ (recommended) or npm
- Accounts: **Clerk** (dev instance), **Neon** (free DB), **Cloudinary** (free tier for photos; see `docs/cloudinary-setup.md`). *Cloudflare R2 is not used.*

## 1. Clone and install

```bash
git clone <repo-url>
cd <repo-root>
pnpm install
```

## 2. Environment variables

Create local env files (never commit `.env`):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### `backend/.env`

- `NODE_ENV=development`
- `DATABASE_URL=` — remote PostgreSQL connection string (e.g. **Neon** from the dashboard: pooled or direct; `?sslmode=require` is typical)
- `CLERK_SECRET_KEY=`
- `CLERK_PUBLISHABLE_KEY=` (for any server-side use)
- `CLERK_WEBHOOK_SECRET=` — if using webhooks to sync `users`
- `FRONTEND_URL=http://localhost:5173`
- **Cloudinary** (photos): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET`, `CLOUDINARY_UPLOAD_FOLDER` — see [`docs/cloudinary-setup.md`](../../docs/cloudinary-setup.md). *We evaluated **Cloudflare R2** but do not use it in this repo.*

### `frontend/.env`

- `VITE_CLERK_PUBLISHABLE_KEY=`
- `VITE_CLOUDINARY_CLOUD_NAME=` (same as backend cloud name; used to build image URLs in the SPA)
- `VITE_API_URL=http://localhost:3000` (or your API origin; no trailing slash)

## 3. Database

**Prisma ORM 7**: the DB URL for **CLI** (migrate, db push, studio) is set in **`backend/prisma.config.ts`** from `DATABASE_URL`. Put `DATABASE_URL` in **`backend/.env`** (Neon pooled string is fine). The **runtime** app uses `PrismaClient` with **`@prisma/adapter-pg`** — see `backend/src/lib/prisma.ts`.

```bash
cd backend
pnpm run db:generate  # prisma generate (uses prisma.config.ts)
# After models exist (Phase 2): create/apply migrations with DATABASE_URL set
pnpm run db:migrate:dev   # local: prisma migrate dev
# pnpm run db:migrate     # CI/prod: prisma migrate deploy
```

## 4. Run

Two terminals:

```bash
# API
cd backend && pnpm run dev
```

```bash
# SPA
cd frontend && pnpm run dev
```

- API: e.g. `http://localhost:3000` — **Swagger** at `/api/docs` (when implemented).
- SPA: e.g. `http://localhost:5173` — **CORS** must allow this origin in Express.

## 5. Health check

```bash
curl -s http://localhost:3000/api/health
```

## 6. Test

```bash
pnpm -r test
```

## 7. Groups, active layer, and map viewport (US4)

Authenticated routes use Clerk: send **`Authorization: Bearer <jwt>`** where `<jwt>` is a valid session token from the **same Clerk instance** as `CLERK_SECRET_KEY` on the API. Locally you can grab a token from browser devtools (Network tab when the SPA calls the API) or from `getToken()` in the Clerk-loaded app.

Ensure each account has a row in **`users`** (via Clerk webhook **`user.created`** / user sync), or `/api/me/preferences` and `/api/groups` respond with provisioning errors (`USER_NOT_PROVISIONED`).

### Create a group

The creator is added as the first member.

```bash
export API=http://localhost:3000
export TOKEN='<paste-jwt>'
curl -sS -X POST "$API/api/groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Study trip"}'
# Note the returned group id (UUID).
```

### Add another member (`userId`)

**v1 onboarding:** existing members invite by **internal** Postgres id from `users.id` (not Clerk id). Lookup the teammate after they have signed up and synced:

```bash
cd backend && pnpm exec prisma studio   # browse users table
```

```bash
export GROUP='<group-uuid>'
export MEMBER_USERS_ID='<uuid from users.id>'
curl -sS -X POST "$API/api/groups/$GROUP/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$MEMBER_USERS_ID\"}"
```

The caller must already be in that group. There is **no invite code** endpoint in this slice; widen later if needed (see `specs/001-map-world-points/research.md`).

### List my groups

```bash
curl -sS "$API/api/groups" -H "Authorization: Bearer $TOKEN"
```

### Active group preference

The SPA **Active group for private map layer** control PATCHes this preference. Manually:

```bash
curl -sS -X PATCH "$API/api/me/preferences" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"activeGroupId":null}'
# Or set activeGroupId to a group UUID where you are a member; non-membership returns 403.
```

### Signed-in map: points in viewport

`GET /api/map/public` returns **public** points in the bbox, plus **`group_only`** pins for **`activeGroupId`** only when you are still a member of that group.

Query parameters (**all required** unless `limit`):

- `southWestLat`, `southWestLng`, `northEastLat`, `northEastLng` (WGS84)
- Optional `limit` (default **500**, max **2000`)

Example (rough world-scale box):

```bash
curl -sS "$API/api/map/public?southWestLat=-85&southWestLng=-180&northEastLat=85&northEastLng=180&limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

Swagger for these paths (with other routes) lives at **`GET /api/docs`** when docs are enabled in dev.

## 8. End-to-end tests (Playwright)

E2E tests live in the `e2e/` workspace. They target the **frontend dev server** and mock backend responses with `page.route(...)`, so they do **not** require a running API or database.

First-time setup (downloads Chromium into `~/.cache/ms-playwright/`):

```bash
pnpm install
pnpm --filter e2e exec playwright install --with-deps chromium
```

Run:

```bash
pnpm test:e2e          # headless, list reporter
pnpm test:e2e:ui       # Playwright UI mode
pnpm --filter e2e exec playwright show-report   # open HTML report after a run
```

Notes:

- Playwright auto-starts `pnpm --filter frontend dev` via `webServer` in `e2e/playwright.config.ts`. If `pnpm dev` is already running locally, it is reused (`reuseExistingServer: true` outside CI).
- Override the target URL with `E2E_FRONTEND_URL=…` (e.g. against a preview deploy).
- In CI, retries are enabled and reporters are `github` + `html`; the report path is `e2e/playwright-report/`.

