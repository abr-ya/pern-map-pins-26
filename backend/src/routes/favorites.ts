import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { getClerkAuth, requireAuth } from '../middleware/clerkAuth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  addFavorite,
  createFavoriteFolder,
  deleteFavoriteFolder,
  listFavoriteFolders,
  listFavorites,
  moveFavoriteToFolder,
  removeFavorite,
  updateFavoriteFolder,
} from '../services/favoriteService.js';

export const favoritesRouter: IRouter = Router();

const pointIdParamSchema = z.string().uuid();
const favoriteFolderIdParamSchema = z.string().uuid();

const upsertFavoriteBodySchema = z.object({
  pointId: z.string().uuid(),
  favoriteFolderId: z.string().uuid().nullable().optional(),
});

const moveFavoriteBodySchema = z.object({
  favoriteFolderId: z.string().uuid().nullable(),
});

const favoriteFolderCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  parentId: z.string().uuid().nullable().optional(),
});

const favoriteFolderUpdateBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  parentId: z.string().uuid().nullable().optional(),
});

function requireClerkUserId(req: Parameters<typeof getClerkAuth>[0]): string | null {
  const auth = getClerkAuth(req);
  return auth.userId;
}

favoritesRouter.get('/favorites', requireAuth, async (req, res, next) => {
  try {
    const clerkUserId = requireClerkUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }

    const items = await listFavorites(clerkUserId);
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
});

favoritesRouter.post('/favorites', requireAuth, async (req, res, next) => {
  try {
    const clerkUserId = requireClerkUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }

    const body = upsertFavoriteBodySchema.parse(req.body);
    const favorite = await addFavorite({
      clerkUserId,
      pointId: body.pointId,
      favoriteFolderId: body.favoriteFolderId ?? null,
    });
    res.status(201).json(favorite);
  } catch (err) {
    next(err);
  }
});

favoritesRouter.patch('/favorites/:pointId', requireAuth, async (req, res, next) => {
  try {
    const clerkUserId = requireClerkUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }

    const parsedId = pointIdParamSchema.safeParse(req.params.pointId);
    if (!parsedId.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid point id', 400);
    }

    const body = moveFavoriteBodySchema.parse(req.body);
    const favorite = await moveFavoriteToFolder({
      clerkUserId,
      pointId: parsedId.data,
      favoriteFolderId: body.favoriteFolderId,
    });
    res.status(200).json(favorite);
  } catch (err) {
    next(err);
  }
});

favoritesRouter.delete('/favorites/:pointId', requireAuth, async (req, res, next) => {
  try {
    const clerkUserId = requireClerkUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }

    const parsedId = pointIdParamSchema.safeParse(req.params.pointId);
    if (!parsedId.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid point id', 400);
    }

    await removeFavorite(clerkUserId, parsedId.data);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

favoritesRouter.get('/favorite-folders', requireAuth, async (req, res, next) => {
  try {
    const clerkUserId = requireClerkUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }

    const items = await listFavoriteFolders(clerkUserId);
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
});

favoritesRouter.post('/favorite-folders', requireAuth, async (req, res, next) => {
  try {
    const clerkUserId = requireClerkUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }

    const body = favoriteFolderCreateBodySchema.parse(req.body);
    const folder = await createFavoriteFolder({
      clerkUserId,
      name: body.name,
      parentId: body.parentId ?? null,
    });
    res.status(201).json(folder);
  } catch (err) {
    next(err);
  }
});

favoritesRouter.patch('/favorite-folders/:favoriteFolderId', requireAuth, async (req, res, next) => {
  try {
    const clerkUserId = requireClerkUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }

    const parsedId = favoriteFolderIdParamSchema.safeParse(req.params.favoriteFolderId);
    if (!parsedId.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid favorite folder id', 400);
    }

    const body = favoriteFolderUpdateBodySchema.parse(req.body);
    const folder = await updateFavoriteFolder({
      clerkUserId,
      favoriteFolderId: parsedId.data,
      name: body.name,
      parentId: body.parentId ?? null,
    });
    res.status(200).json(folder);
  } catch (err) {
    next(err);
  }
});

favoritesRouter.delete('/favorite-folders/:favoriteFolderId', requireAuth, async (req, res, next) => {
  try {
    const clerkUserId = requireClerkUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
      return;
    }

    const parsedId = favoriteFolderIdParamSchema.safeParse(req.params.favoriteFolderId);
    if (!parsedId.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid favorite folder id', 400);
    }

    await deleteFavoriteFolder(clerkUserId, parsedId.data);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
