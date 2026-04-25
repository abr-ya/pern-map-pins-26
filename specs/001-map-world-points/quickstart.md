# Quickstart: local development (target)

> This describes the **intended** setup once the repository is scaffolded. Adjust paths if the monorepo layout differs.

## Prerequisites

- **Node.js 20** LTS
- **pnpm** 9+ (recommended) or npm
- Accounts: **Clerk** (dev instance), **Neon** (free DB), **Cloudflare** (R2 bucket optional for local—can mock in dev)

## 1. Clone and install

```bash
git clone <repo-url>
cd react-express-map-pins
pnpm install
```

(Or `npm install` in `frontend/` and `backend/` once created.)

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
- `R2_ACCOUNT_ID=`, `R2_ACCESS_KEY_ID=`, `R2_SECRET_ACCESS_KEY=`, `R2_BUCKET_NAME=`, `R2_PUBLIC_BASE_URL=`

### `frontend/.env`

- `VITE_CLERK_PUBLISHABLE_KEY=`
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

## 7. End-to-end tests (Playwright)

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

> Until `_implement` is done, this file is a **contract** for the tasks phase.
