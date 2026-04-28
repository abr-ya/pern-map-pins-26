import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { getClerkAuth, requireAuth } from '../middleware/clerkAuth.js';
import { folderCreateBodySchema } from '../lib/schemas/folderCreate.js';
import { folderUpdateBodySchema } from '../lib/schemas/folderUpdate.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  createFolder,
  deleteFolder,
  listFolders,
  updateFolder,
} from '../services/folderService.js';

export const foldersRouter: IRouter = Router();
const folderIdParamSchema = z.string().uuid();

foldersRouter.get('/folders', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const items = await listFolders(clerkUserId);
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
});

foldersRouter.post('/folders', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const body = folderCreateBodySchema.parse(req.body);
    const folder = await createFolder(clerkUserId, body);
    res.status(201).json(folder);
  } catch (err) {
    next(err);
  }
});

foldersRouter.patch('/folders/:folderId', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const parsedId = folderIdParamSchema.safeParse(req.params.folderId);
    if (!parsedId.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid folder id', 400);
    }
    const body = folderUpdateBodySchema.parse(req.body);
    const folder = await updateFolder(clerkUserId, parsedId.data, body);
    res.status(200).json(folder);
  } catch (err) {
    next(err);
  }
});

foldersRouter.delete('/folders/:folderId', requireAuth, async (req, res, next) => {
  try {
    const auth = getClerkAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }
    const parsedId = folderIdParamSchema.safeParse(req.params.folderId);
    if (!parsedId.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid folder id', 400);
    }
    await deleteFolder(clerkUserId, parsedId.data);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
