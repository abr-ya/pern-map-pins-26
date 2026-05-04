import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { getClerkAuth, requireAuth } from '../middleware/clerkAuth.js';
import { AppError } from '../middleware/errorHandler.js';
import { addGroupMember, createGroup, listMyGroups } from '../services/groupService.js';

export const groupsRouter: IRouter = Router();

const groupIdParamSchema = z.string().uuid();
const groupCreateBodySchema = z.object({
  name: z.string().min(1).max(200),
});

const memberAddBodySchema = z.object({
  userId: z.string().uuid(),
});

groupsRouter.get('/groups', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const items = await listMyGroups(clerkUserId);
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
});

groupsRouter.post('/groups', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const body = groupCreateBodySchema.parse(req.body);
    const group = await createGroup(clerkUserId, body.name);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
});

groupsRouter.post('/groups/:groupId/members', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const parsedId = groupIdParamSchema.safeParse(req.params.groupId);
    if (!parsedId.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid group id', 400);
    }
    const body = memberAddBodySchema.parse(req.body);
    await addGroupMember({
      clerkUserId,
      groupId: parsedId.data,
      memberUserId: body.userId,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
