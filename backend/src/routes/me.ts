import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { getClerkAuth, requireAuth } from '../middleware/clerkAuth.js';
import { getPreferences, patchPreferences } from '../services/preferencesService.js';

/**
 * Authenticated user routes. `GET /me` is a tiny sanity probe used by the SPA
 * to confirm the Clerk session is accepted by the API.
 */
export const meRouter: IRouter = Router();

const preferencesPatchSchema = z.object({
  activeGroupId: z.string().uuid().nullable(),
});

meRouter.get('/me', requireAuth, (req, res) => {
  const auth = getClerkAuth(req);
  res.json({ authenticated: true, clerkUserId: auth.userId ?? null });
});

meRouter.get('/me/preferences', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const body = await getPreferences(clerkUserId);
    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
});

meRouter.patch('/me/preferences', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const patch = preferencesPatchSchema.parse(req.body);
    const body = await patchPreferences(clerkUserId, patch);
    res.status(200).json(body);
  } catch (err) {
    next(err);
  }
});
