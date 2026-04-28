import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { getClerkAuth, requireAuth } from '../middleware/clerkAuth.js';
import { pointCreateBodySchema } from '../lib/schemas/pointCreate.js';
import { buildSignedPointPhotoUpload } from '../lib/cloudinaryUpload.js';
import { assertAllowedPhotoContentType } from '../middleware/uploadPolicy.js';
import { AppError } from '../middleware/errorHandler.js';
import { assertUserCanUploadPhotoForPoint } from '../services/pointPhotoUploadService.js';
import { createPoint } from '../services/pointWriteService.js';

export const pointsRouter: IRouter = Router();

const pointIdParamSchema = z.string().uuid();

pointsRouter.post('/points', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const body = pointCreateBodySchema.parse(req.body);
    const point = await createPoint({ clerkUserId, body });
    res.status(201).json(point);
  } catch (err) {
    next(err);
  }
});

pointsRouter.post('/points/:pointId/photo-upload', requireAuth, async (req, res, next) => {
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

    assertAllowedPhotoContentType(req);
    await assertUserCanUploadPhotoForPoint({
      clerkUserId,
      pointId: parsedId.data,
    });

    const payload = buildSignedPointPhotoUpload(parsedId.data);
    res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
});
