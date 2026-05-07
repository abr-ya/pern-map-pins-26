import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { getOptionalClerkUserId } from '../middleware/clerkAuth.js';
import { getLatestPublicPoints, getPublicPointById } from '../services/publicPointsService.js';

export const publicRouter: IRouter = Router();

const pointIdParam = z.string().uuid();

publicRouter.get('/public/latest', async (_req, res, next) => {
  try {
    const items = await getLatestPublicPoints();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/public/points/:pointId', async (req, res, next) => {
  try {
    const parsed = pointIdParam.safeParse(req.params.pointId);
    if (!parsed.success) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Not found' });
      return;
    }
    const clerkUserId = getOptionalClerkUserId(req);
    const point = await getPublicPointById(parsed.data, clerkUserId);
    if (!point) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Not found' });
      return;
    }
    res.json(point);
  } catch (err) {
    next(err);
  }
});
