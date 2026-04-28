# Clerk Webhook Setup (Local Development)

Goal: obtain `CLERK_WEBHOOK_SECRET` and verify that Clerk can reach the
local backend so it can sync users into the `users` table (Neon) via
`POST /api/webhooks/clerk`.

When this is needed: as soon as we start manually testing sign-in (US2)
and creating points / comments (US3+). Until then the webhook is
optional — the guest map works without it.

---

## 1. Start the environment

All commands are run from the repository root.

### 1.1. Backend + frontend

```bash
npm run dev
```

This starts both workspaces via `pnpm -r --parallel run dev`:

- backend → http://localhost:3000 (Express, `tsx watch`)
- frontend → http://localhost:5173 (Vite)

### 1.2. ngrok tunnel to the backend

In a **separate** terminal:

```bash
npx ngrok http 3000
```

Healthy signs:

- The output contains `Session Status   online`.
- A `Forwarding   https://<random>.ngrok-free.app -> http://localhost:3000`
  line is shown.
- http://127.0.0.1:4040 opens the local ngrok web UI (it also exposes
  the full public URL and a request inspector).

> The URL printed in the terminal is often truncated by the window
> width. Pick the full hostname from the web UI at `127.0.0.1:4040`
> or widen the terminal.

### 1.3. Verify the tunnel

In a browser, open:

- `https://<your-ngrok>.ngrok-free.app/api/health` — must return JSON
  with status `ok`.
- `https://<your-ngrok>.ngrok-free.app/` — returns `{"code":"NOT_FOUND"}`.
  This is **expected**: the API has no root route.
- `/api/webhooks/clerk` cannot be opened with a browser GET — the route
  is `POST` only. That is also normal.

> On the free plan ngrok shows a warning interstitial with a "Visit
> Site" button on the first browser request. Click it once. Server-to-
> server requests from Clerk are not affected by this page.

---

## 2. Obtain `CLERK_WEBHOOK_SECRET`

### 2.1. Create the endpoint in Clerk

1. Open Clerk Dashboard → the right instance → **Webhooks** section.
2. **Add Endpoint**:
   - **Endpoint URL**: `https://<your-ngrok>.ngrok-free.app/api/webhooks/clerk`
   - **Subscribe to events**: `user.created`, `user.updated`, `user.deleted`
3. Save.

### 2.2. Copy the Signing Secret

On the new endpoint's page find **Signing Secret** — a string that
starts with `whsec_...`. That is your `CLERK_WEBHOOK_SECRET`.

### 2.3. Put it into `backend/.env`

In `backend/.env` uncomment and fill the line:

```env
CLERK_WEBHOOK_SECRET=whsec_...
```

### 2.4. Restart the backend

`tsx watch` does **not** re-read `.env` automatically — env vars are
loaded only at process start. Stop `npm run dev` (Ctrl+C) and start
it again.

---

## 3. Verify the webhook

1. On the endpoint page in Clerk Dashboard → **Testing** → pick
   `user.created` → **Send Example**.
2. Clerk should report `200 OK` with body `{"received": true, ...}`.
3. http://127.0.0.1:4040 (ngrok inspector) shows the actual HTTP
   request and the response.
4. A test row appears in (or is updated in) the `users` table in Neon —
   that's `applyClerkWebhookEvent`
   (`backend/src/services/userSyncService.ts`) doing its job.

### If you get 400 `WEBHOOK_INVALID`

The Svix signature did not match. Most common causes:
- `backend/.env` has the secret of a **different** endpoint (recreating
  the endpoint in Clerk rotates the secret).
- The backend was not restarted after editing `.env`.
- Some middleware between ngrok and the route mutates the request body.
  We don't have any — `webhooksRouter` uses `verifyWebhook` from
  `@clerk/express/webhooks`, which reads the raw body itself.

### If you get 500 `WEBHOOK_NOT_CONFIGURED`

`CLERK_WEBHOOK_SECRET` is not picked up: confirm the line is not
commented out, has no stray spaces or quotes, and that the backend was
restarted.

---

## 4. Notes

- The ngrok URL **changes on every restart** (free plan). After
  restarting ngrok, update the **Endpoint URL** in Clerk Dashboard.
  The signing secret itself does **not** change — no need to touch
  `CLERK_WEBHOOK_SECRET` in `.env`.
- In production the backend is reached via its real deployed URL
  (Railway / Fly / Render); the secret lives in the host's env vars,
  not in a local `.env`.
- Never commit `backend/.env` (it's in `.gitignore`).

---

## 5. Checklist (tick as you go)

- [x] Backend is up: `npm run dev` prints `API listening port: 3000`
- [x] ngrok is up: `npx ngrok http 3000` shows `Session Status: online`
- [x] Full public ngrok URL captured (via `127.0.0.1:4040` or the terminal)
- [x] `https://<ngrok>/api/health` returns `200` with JSON
- [x] Webhook endpoint created in Clerk Dashboard at `https://<ngrok>/api/webhooks/clerk`
- [x] Subscribed to `user.created`, `user.updated`, `user.deleted`
- [x] `Signing Secret` (`whsec_...`) copied
- [x] `CLERK_WEBHOOK_SECRET=whsec_...` uncommented and filled in `backend/.env`
- [x] Backend restarted after editing `.env`
- [x] Clerk → **Send Example** for `user.created` returned `200 received: true`
- [ ] A row for the test user appeared/updated in the `users` table in Neon
- [ ] (Optional) End-to-end check: signing up via the frontend UI auto-creates a row in `users`
