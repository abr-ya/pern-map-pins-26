import { prisma } from '../lib/prisma.js';
import {
  mapCommentToJson,
  type CommentJson,
} from '../lib/schemas/comment.js';
import { requirePointReadableForClerk } from './pointReadAccess.js';

export async function listCommentsForPoint(params: {
  clerkUserId: string;
  pointId: string;
}): Promise<CommentJson[]> {
  await requirePointReadableForClerk(params.clerkUserId, params.pointId);

  const rows = await prisma.comment.findMany({
    where: { pointId: params.pointId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { displayName: true } } },
  });

  return rows.map(mapCommentToJson);
}

export async function createCommentOnPoint(params: {
  clerkUserId: string;
  pointId: string;
  body: string;
}): Promise<CommentJson> {
  const { localUserId, point } = await requirePointReadableForClerk(
    params.clerkUserId,
    params.pointId,
  );

  const row = await prisma.comment.create({
    data: {
      pointId: point.id,
      userId: localUserId,
      body: params.body,
    },
    include: { user: { select: { displayName: true } } },
  });

  return mapCommentToJson(row);
}
