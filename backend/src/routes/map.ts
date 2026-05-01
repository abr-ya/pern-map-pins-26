import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { getClerkAuth, requireAuth } from '../middleware/clerkAuth.js';
import { listPointsInMapViewport } from '../services/mapPointsService.js';

export const mapRouter: IRouter = Router();

const mapPublicQuerySchema = z.object({
  southWestLat: z.coerce.number().min(-90).max(90),
  southWestLng: z.coerce.number().min(-180).max(180),
  northEastLat: z.coerce.number().min(-90).max(90),
  northEastLng: z.coerce.number().min(-180).max(180),
  limit: z.coerce.number().int().min(1).max(2000).optional().default(500),
});

mapRouter.get('/map/public', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const q = mapPublicQuerySchema.parse(req.query);
    const items = await listPointsInMapViewport({
      clerkUserId,
      southWestLat: q.southWestLat,
      southWestLng: q.southWestLng,
      northEastLat: q.northEastLat,
      northEastLng: q.northEastLng,
      limit: q.limit,
    });
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
});
