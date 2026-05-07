import { prisma } from '../lib/prisma.js';
import {
  mapCommentToJson,
  type CommentJson,
} from '../lib/schemas/comment.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  isPointVisibleToViewer,
  resolveViewerReadContext,
} from './pointReadAccess.js';

async function requireReadablePointForClerk(
  clerkUserId: string,
  pointId: string,
) {
  const ctx = await resolveViewerReadContext(clerkUserId);
  if (!ctx.localUserId) {
    throw new AppError(
      'USER_NOT_PROVISIONED',
      'No local user record for this account yet; wait for sync or sign in again',
      403,
    );
  }

  const point = await prisma.point.findUnique({ where: { id: pointId } });
  if (!point || !isPointVisibleToViewer(point, ctx)) {
    throw new AppError('NOT_FOUND', 'Point not found', 404);
  }

  return { point, localUserId: ctx.localUserId };
}

export async function listCommentsForPoint(params: {
  clerkUserId: string;
  pointId: string;
}): Promise<CommentJson[]> {
  await requireReadablePointForClerk(params.clerkUserId, params.pointId);

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
  const { localUserId, point } = await requireReadablePointForClerk(
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
