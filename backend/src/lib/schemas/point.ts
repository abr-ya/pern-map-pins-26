import { z } from 'zod';
import type { Point as PointRow } from '../../generated/prisma/client.js';
import { buildPhotoUrl } from '../photoUrl.js';

/** JSON `Point` per specs/001-map-world-points/contracts/openapi.yaml */
export const pointJsonSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  createdAt: z.string(),
  authorId: z.string().uuid(),
  visibility: z.union([z.literal('public'), z.literal('group_only')]),
  groupId: z.string().uuid().nullable(),
  folderId: z.string().uuid().nullable(),
  averageRating: z.number().nullable(),
  myRating: z.number().int().min(1).max(5).nullable(),
});

export type PointJson = z.infer<typeof pointJsonSchema>;

export function mapPointToJson(
  row: PointRow,
  options?: { averageRating?: number | null; myRating?: number | null },
): PointJson {
  const out = {
    id: row.id,
    title: row.title,
    description: row.description,
    photoUrl: buildPhotoUrl(row.photoKey),
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.createdAt.toISOString(),
    authorId: row.userId,
    visibility: row.visibility,
    groupId: row.groupId,
    folderId: row.folderId,
    averageRating: options?.averageRating ?? null,
    myRating: options?.myRating ?? null,
  };
  return pointJsonSchema.parse(out);
}
