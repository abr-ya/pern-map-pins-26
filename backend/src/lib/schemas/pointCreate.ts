import { z } from 'zod';

/** Request body for `POST /api/points` per contracts/openapi.yaml `PointCreate`. */
export const pointCreateBodySchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).nullable().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    folderId: z.string().uuid().nullable().optional(),
    visibility: z.enum(['public', 'group_only']).optional().default('public'),
    groupId: z.string().uuid().nullable().optional(),
    tagIds: z.array(z.string().uuid()).optional().default([]),
  })
  .transform((v) => ({
    title: v.title,
    description: v.description ?? null,
    latitude: v.latitude,
    longitude: v.longitude,
    folderId: v.folderId ?? null,
    visibility: v.visibility ?? 'public',
    groupId: v.groupId ?? null,
    tagIds: v.tagIds ?? [],
  }));

export type PointCreateBody = z.infer<typeof pointCreateBodySchema>;
