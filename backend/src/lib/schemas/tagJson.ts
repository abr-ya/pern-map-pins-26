import { z } from 'zod';
import type { Tag as TagRow } from '../../generated/prisma/client.js';

export const tagJsonSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export type TagJson = z.infer<typeof tagJsonSchema>;

export function mapTagToJson(row: TagRow): TagJson {
  return tagJsonSchema.parse({
    id: row.id,
    name: row.name,
  });
}
