import { z } from 'zod';

export const folderCreateBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    groupId: z.string().uuid().nullable().optional(),
  })
  .transform((v) => ({
    name: v.name,
    groupId: v.groupId ?? null,
  }));

export type FolderCreateBody = z.infer<typeof folderCreateBodySchema>;
