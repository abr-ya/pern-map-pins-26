import { z } from 'zod';
import type { Comment as CommentRow } from '../../generated/prisma/client.js';

export const commentJsonSchema = z.object({
  id: z.string().uuid(),
  body: z.string(),
  authorId: z.string().uuid(),
  displayName: z.string(),
  createdAt: z.string(),
});

export type CommentJson = z.infer<typeof commentJsonSchema>;

export const commentCreateBodySchema = z.object({
  body: z.string().min(1).max(4000),
});

export type CommentCreateBody = z.infer<typeof commentCreateBodySchema>;

export function mapCommentToJson(
  row: CommentRow & { user: { displayName: string } },
): CommentJson {
  const out = {
    id: row.id,
    body: row.body,
    authorId: row.userId,
    displayName: row.user.displayName,
    createdAt: row.createdAt.toISOString(),
  };
  return commentJsonSchema.parse(out);
}
