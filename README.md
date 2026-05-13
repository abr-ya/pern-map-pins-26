# Map pins (PERN stack)

A **map-first** web app: guests browse public points on a map; signed-in users create and manage their own points, organize them, and interact with the community.

## What it does

- **Map & points** — WGS84 coordinates, title, optional description, optional photo; public visibility or sharing rules aligned with folders and groups.
- **Guests** — see recent public activity on the map (e.g. latest public points) without signing in.
- **Signed-in users** — full CRUD for points, **folders** and **tags**, **favorites** (including favorite folders), **comments**, and **ratings** (1–5).
- **Groups** — private group content with an **active group** preference so the server scopes what you see.
- **API** — Express serves a documented HTTP API (OpenAPI / Swagger UI in supported environments).

Detailed product rules, data model, and API contract live under [`specs/001-map-world-points/`](specs/001-map-world-points/).

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | Vite + React SPA (map UI, Clerk, TanStack Query) |
| `backend/` | Express API, Prisma, Clerk verification |
| `e2e/` | Playwright smoke tests |

Monorepo tooling: **pnpm** workspaces (`packageManager` in root `package.json`).

## Tech stack

**Runtime & language**

- Node.js **20+**, **TypeScript** (strict) in both apps.

**Frontend**

- React **19**, Vite, Tailwind CSS **4**
- **Leaflet** + **react-leaflet** (OpenStreetMap tiles), marker clustering where needed
- **Clerk** (`@clerk/react`) for authentication
- **TanStack Query**, **react-hook-form**, **Zod 4** for data fetching and forms

**Backend**

- **Express 5**
- **Prisma ORM 7** + PostgreSQL (e.g. **Neon**), `pg` + Prisma driver adapter
- **Clerk** (`@clerk/express`) for auth on protected routes
- **Zod 4** for request validation, **pino** for logging
- **swagger-ui-express** + OpenAPI spec under `backend/src/openapi`

**Infrastructure & integrations**

- **PostgreSQL** as source of truth
- **Cloudinary** for point photos (signed uploads; `photo_key` stores the Cloudinary public id)
- **Clerk** for identity (e.g. email/password and social providers, per your Clerk dashboard)

## External services

Third-party systems this app talks to in normal operation (configure keys and URLs via `.env` files — see [quickstart](specs/001-map-world-points/quickstart.md)).

| Service | Link | Role in this project |
|--------|------|-------------------------|
| **PostgreSQL** (hosted, e.g. [Neon](https://neon.tech)) | [Neon](https://neon.tech) · [PostgreSQL](https://www.postgresql.org/) | Primary database for users, points, folders, favorites, comments, ratings, etc. Connection string is `DATABASE_URL`; accessed through **Prisma** from the backend. |
| **[Clerk](https://clerk.com)** | [clerk.com](https://clerk.com) | Authentication and session: sign-in UI and tokens in the SPA (`@clerk/react`), verified on the API (`@clerk/express`). Optional **webhooks** (signed with `CLERK_WEBHOOK_SECRET`) can sync users into our DB. |
| **[Cloudinary](https://cloudinary.com)** | [cloudinary.com](https://cloudinary.com) | Image pipeline for point photos: signed uploads from the client, storage and delivery URLs; the backend stores Cloudinary **`public_id`** in `photo_key`. Setup: [`docs/cloudinary-setup.md`](docs/cloudinary-setup.md). |
| **[OpenStreetMap](https://www.openstreetmap.org/)** map tiles | [OSM](https://www.openstreetmap.org/) · [tile policy](https://operations.osmfoundation.org/policies/tiles/) | Basemap raster tiles for **Leaflet** (e.g. `{s}.tile.openstreetmap.org`). No API key; follow OSMF tile usage and attribution rules in production. |

## Local development

Prerequisites: **Node 20+**, **pnpm 9+**, and dev accounts for **Clerk**, **PostgreSQL** (Neon is fine), and **Cloudinary** as needed.

```bash
pnpm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill env vars (see [`specs/001-map-world-points/quickstart.md`](specs/001-map-world-points/quickstart.md) and [`docs/cloudinary-setup.md`](docs/cloudinary-setup.md)).

```bash
# Terminal 1 — API
cd backend && pnpm run dev

# Terminal 2 — SPA
cd frontend && pnpm run dev
```

Apply migrations when the schema is in place (`cd backend && pnpm run db:migrate:dev` or `db:migrate` for deploy).

From the **repo root**, `pnpm run dev` runs both packages in parallel.

## Testing

| Layer | Tooling | How to run |
|-------|---------|------------|
| **Backend** | Vitest + Supertest (integration-style HTTP tests against the Express app) | `cd backend && pnpm test` |
| **Frontend** | Vitest + Testing Library + jsdom | `cd frontend && pnpm test` |
| **Monorepo shortcut** | Runs backend and frontend test scripts | `pnpm test` (from root) |
| **E2E** | Playwright (`e2e/`) | `pnpm run test:e2e` or `pnpm run test:e2e:ui` from root |

E2E assumes the app stack is reachable per your Playwright config (URLs, env). Use `e2e` package scripts for headed or UI mode.

**Lint:** `pnpm run lint` from the repository root.

## Further reading

- Feature spec & plan: [`specs/001-map-world-points/spec.md`](specs/001-map-world-points/spec.md), [`specs/001-map-world-points/plan.md`](specs/001-map-world-points/plan.md)
- Local setup detail: [`specs/001-map-world-points/quickstart.md`](specs/001-map-world-points/quickstart.md)
- API contract: [`specs/001-map-world-points/contracts/openapi.yaml`](specs/001-map-world-points/contracts/openapi.yaml)
