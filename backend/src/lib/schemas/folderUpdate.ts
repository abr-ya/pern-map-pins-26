import { z } from 'zod';

export const folderUpdateBodySchema = z
  .object({
    name: z.string().min(1).max(200),
  })
  .strict();

export type FolderUpdateBody = z.infer<typeof folderUpdateBodySchema>;
