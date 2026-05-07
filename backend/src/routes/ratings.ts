import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { getClerkAuth, requireAuth } from '../middleware/clerkAuth.js';
import { AppError } from '../middleware/errorHandler.js';
import { upsertPointRating } from '../services/ratingService.js';

export const ratingsRouter: IRouter = Router();

const pointIdParamSchema = z.string().uuid();

const ratingBodySchema = z.object({
  value: z.number().int().min(1).max(5),
});

ratingsRouter.put('/points/:pointId/rating', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const parsedId = pointIdParamSchema.safeParse(req.params.pointId);
    if (!parsedId.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid point id', 400);
    }
    const body = ratingBodySchema.parse(req.body);
    const result = await upsertPointRating({
      clerkUserId,
      pointId: parsedId.data,
      value: body.value,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
