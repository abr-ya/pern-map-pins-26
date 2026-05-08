import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { getClerkAuth, requireAuth } from '../middleware/clerkAuth.js';
import { commentCreateBodySchema } from '../lib/schemas/comment.js';
import { AppError } from '../middleware/errorHandler.js';
import { createCommentOnPoint, listCommentsForPoint } from '../services/commentService.js';

export const commentsRouter: IRouter = Router();

const pointIdParamSchema = z.string().uuid();

commentsRouter.get('/points/:pointId/comments', requireAuth, async (req, res, next) => {
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
    const items = await listCommentsForPoint({
      clerkUserId,
      pointId: parsedId.data,
    });
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
});

commentsRouter.post('/points/:pointId/comments', requireAuth, async (req, res, next) => {
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
    const body = commentCreateBodySchema.parse(req.body);
    const created = await createCommentOnPoint({
      clerkUserId,
      pointId: parsedId.data,
      body: body.body,
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});
