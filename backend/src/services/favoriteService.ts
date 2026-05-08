import { prisma } from '../lib/prisma.js';
import {
  mapFavoriteFolderToJson,
  mapFavoriteToJson,
  type FavoriteFolderJson,
  type FavoriteJson,
} from '../lib/schemas/favorite.js';
import { AppError } from '../middleware/errorHandler.js';
import { requirePointReadableForClerk } from './pointReadAccess.js';

async function internalUserId(clerkUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!user) {
    throw new AppError(
      'USER_NOT_PROVISIONED',
      'No local user record for this account yet; wait for sync or sign in again',
      403,
    );
  }
  return user.id;
}

async function ensureFavoriteFolderOwnedByUser(userId: string, folderId: string): Promise<void> {
  const folder = await prisma.favoriteFolder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  });
  if (!folder) {
    throw new AppError('NOT_FOUND', 'Favorite folder not found', 404);
  }
}

export async function listFavorites(clerkUserId: string): Promise<FavoriteJson[]> {
  const userId = await internalUserId(clerkUserId);
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { pointId: 'asc' },
  });
  return rows.map(mapFavoriteToJson);
}

export async function addFavorite(params: {
  clerkUserId: string;
  pointId: string;
  favoriteFolderId: string | null;
}): Promise<FavoriteJson> {
  const { localUserId, point } = await requirePointReadableForClerk(
    params.clerkUserId,
    params.pointId,
  );
  if (params.favoriteFolderId) {
    await ensureFavoriteFolderOwnedByUser(localUserId, params.favoriteFolderId);
  }

  const row = await prisma.favorite.upsert({
    where: {
      userId_pointId: {
        userId: localUserId,
        pointId: point.id,
      },
    },
    create: {
      userId: localUserId,
      pointId: point.id,
      favoriteFolderId: params.favoriteFolderId,
    },
    update: {
      favoriteFolderId: params.favoriteFolderId,
    },
  });
  return mapFavoriteToJson(row);
}

export async function moveFavoriteToFolder(params: {
  clerkUserId: string;
  pointId: string;
  favoriteFolderId: string | null;
}): Promise<FavoriteJson> {
  const userId = await internalUserId(params.clerkUserId);
  if (params.favoriteFolderId) {
    await ensureFavoriteFolderOwnedByUser(userId, params.favoriteFolderId);
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_pointId: { userId, pointId: params.pointId } },
  });
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Favorite not found', 404);
  }

  const row = await prisma.favorite.update({
    where: { userId_pointId: { userId, pointId: params.pointId } },
    data: { favoriteFolderId: params.favoriteFolderId },
  });
  return mapFavoriteToJson(row);
}

export async function removeFavorite(clerkUserId: string, pointId: string): Promise<void> {
  const userId = await internalUserId(clerkUserId);
  const existing = await prisma.favorite.findUnique({
    where: { userId_pointId: { userId, pointId } },
    select: { pointId: true },
  });
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Favorite not found', 404);
  }

  await prisma.favorite.delete({
    where: { userId_pointId: { userId, pointId } },
  });
}

export async function listFavoriteFolders(clerkUserId: string): Promise<FavoriteFolderJson[]> {
  const userId = await internalUserId(clerkUserId);
  const rows = await prisma.favoriteFolder.findMany({
    where: { userId },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  });
  return rows.map(mapFavoriteFolderToJson);
}

export async function createFavoriteFolder(params: {
  clerkUserId: string;
  name: string;
  parentId: string | null;
}): Promise<FavoriteFolderJson> {
  const userId = await internalUserId(params.clerkUserId);
  if (params.parentId) {
    await ensureFavoriteFolderOwnedByUser(userId, params.parentId);
  }

  const row = await prisma.favoriteFolder.create({
    data: {
      userId,
      name: params.name,
      parentId: params.parentId,
    },
  });
  return mapFavoriteFolderToJson(row);
}

export async function updateFavoriteFolder(params: {
  clerkUserId: string;
  favoriteFolderId: string;
  name: string;
  parentId: string | null;
}): Promise<FavoriteFolderJson> {
  const userId = await internalUserId(params.clerkUserId);
  const existing = await prisma.favoriteFolder.findFirst({
    where: { id: params.favoriteFolderId, userId },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Favorite folder not found', 404);
  }

  if (params.parentId) {
    if (params.parentId === params.favoriteFolderId) {
      throw new AppError('VALIDATION_ERROR', 'Favorite folder cannot be its own parent', 400);
    }
    await ensureFavoriteFolderOwnedByUser(userId, params.parentId);
  }

  const row = await prisma.favoriteFolder.update({
    where: { id: params.favoriteFolderId },
    data: {
      name: params.name,
      parentId: params.parentId,
    },
  });
  return mapFavoriteFolderToJson(row);
}

export async function deleteFavoriteFolder(
  clerkUserId: string,
  favoriteFolderId: string,
): Promise<void> {
  const userId = await internalUserId(clerkUserId);
  const existing = await prisma.favoriteFolder.findFirst({
    where: { id: favoriteFolderId, userId },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Favorite folder not found', 404);
  }

  await prisma.favoriteFolder.delete({
    where: { id: favoriteFolderId },
  });
}
