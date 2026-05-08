import { z } from 'zod';
import type { Favorite, FavoriteFolder } from '../../generated/prisma/client.js';

export const favoriteJsonSchema = z.object({
  pointId: z.string().uuid(),
  favoriteFolderId: z.string().uuid().nullable(),
});

export type FavoriteJson = z.infer<typeof favoriteJsonSchema>;

export function mapFavoriteToJson(row: Favorite): FavoriteJson {
  return favoriteJsonSchema.parse({
    pointId: row.pointId,
    favoriteFolderId: row.favoriteFolderId,
  });
}

export const favoriteFolderJsonSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  parentId: z.string().uuid().nullable(),
});

export type FavoriteFolderJson = z.infer<typeof favoriteFolderJsonSchema>;

export function mapFavoriteFolderToJson(row: FavoriteFolder): FavoriteFolderJson {
  return favoriteFolderJsonSchema.parse({
    id: row.id,
    name: row.name,
    parentId: row.parentId,
  });
}
