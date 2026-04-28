import { type IRouter, Router } from 'express';
import { getClerkAuth, requireAuth } from '../middleware/clerkAuth.js';
import { tagCreateBodySchema } from '../lib/schemas/tagCreate.js';
import { createTag, listTags } from '../services/tagService.js';

export const tagsRouter: IRouter = Router();

tagsRouter.get('/tags', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const items = await listTags(clerkUserId);
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
});

tagsRouter.post('/tags', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const body = tagCreateBodySchema.parse(req.body);
    const tag = await createTag(clerkUserId, body);
    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
});
