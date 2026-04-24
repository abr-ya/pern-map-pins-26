import { type IRouter, Router } from 'express';
import { getLatestPublicPoints } from '../services/publicPointsService.js';

export const publicRouter: IRouter = Router();

publicRouter.get('/public/latest', async (_req, res, next) => {
  try {
    const items = await getLatestPublicPoints();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});
