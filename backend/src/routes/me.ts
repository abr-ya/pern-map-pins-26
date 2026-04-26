import { type IRouter, Router } from 'express';
import { getClerkAuth, requireAuth } from '../middleware/clerkAuth.js';

/**
 * Authenticated user routes. `GET /me` is a tiny sanity probe used by the SPA
 * to confirm the Clerk session is accepted by the API; full preferences API
 * (active group, etc.) lands in T049 (Phase 6).
 */
export const meRouter: IRouter = Router();

meRouter.get('/me', requireAuth, (req, res) => {
  const auth = getClerkAuth(req);
  res.json({ authenticated: true, clerkUserId: auth.userId ?? null });
});
