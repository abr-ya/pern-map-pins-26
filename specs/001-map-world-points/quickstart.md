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

### `backend/.env`

- `NODE_ENV=development`
- `DATABASE_URL=` — Neon connection string (pooled)
- `CLERK_SECRET_KEY=`
- `CLERK_PUBLISHABLE_KEY=` (for any server-side use)
- `CLERK_WEBHOOK_SECRET=` — if using webhooks to sync `users`
- `FRONTEND_URL=http://localhost:5173`
- `R2_ACCOUNT_ID=`, `R2_ACCESS_KEY_ID=`, `R2_SECRET_ACCESS_KEY=`, `R2_BUCKET_NAME=`, `R2_PUBLIC_BASE_URL=`

### `frontend/.env`

- `VITE_CLERK_PUBLISHABLE_KEY=`
- `VITE_API_URL=http://localhost:3000` (or your API port)

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

> Until `_implement` is done, this file is a **contract** for the tasks phase.
