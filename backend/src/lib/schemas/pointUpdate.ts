import { z } from 'zod';

/** Partial update for `PATCH /api/points/{pointId}` (Phase 5 / US3). */
export const pointUpdateBodySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    folderId: z.string().uuid().nullable().optional(),
    visibility: z.enum(['public', 'group_only']).optional(),
    groupId: z.string().uuid().nullable().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    photoKey: z.string().min(1).max(2048).nullable().optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: 'At least one field is required',
  });

export type PointUpdateBody = z.infer<typeof pointUpdateBodySchema>;
