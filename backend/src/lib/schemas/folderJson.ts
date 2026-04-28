import { z } from 'zod';
import type { Folder as FolderRow } from '../../generated/prisma/client.js';

export const folderJsonSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  groupId: z.string().uuid().nullable(),
  createdAt: z.string(),
});

export type FolderJson = z.infer<typeof folderJsonSchema>;

export function mapFolderToJson(row: FolderRow): FolderJson {
  return folderJsonSchema.parse({
    id: row.id,
    name: row.name,
    groupId: row.groupId,
    createdAt: row.createdAt.toISOString(),
  });
}
