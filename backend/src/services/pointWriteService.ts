import { PointVisibility } from '../generated/prisma/enums.js';
import { prisma } from '../lib/prisma.js';
import { mapPointToJson, type PointJson } from '../lib/schemas/point.js';
import type { PointCreateBody } from '../lib/schemas/pointCreate.js';
import { isValidWgs84Point } from '../lib/geo.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createPoint(params: {
  clerkUserId: string;
  body: PointCreateBody;
}): Promise<PointJson> {
  const { clerkUserId, body } = params;

  if (!isValidWgs84Point(body.latitude, body.longitude)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid coordinates', 400);
  }

  if (body.visibility === PointVisibility.public && body.groupId !== null) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Public points cannot be scoped to a group; omit groupId or use visibility group_only',
      400,
    );
  }

  if (body.visibility === PointVisibility.group_only && body.groupId === null) {
    throw new AppError(
      'VALIDATION_ERROR',
      'group_only visibility requires groupId',
      400,
    );
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(
      'USER_NOT_PROVISIONED',
      'No local user record for this account yet; wait for sync or sign in again',
      403,
    );
  }

  const userId = user.id;
  const effectiveGroupId = body.visibility === PointVisibility.public ? null : body.groupId;

  if (effectiveGroupId) {
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: effectiveGroupId, userId },
      },
    });
    if (!membership) {
      throw new AppError('FORBIDDEN', 'Not a member of this group', 403);
    }
  }

  let folderGroupId: string | null = null;
  if (body.folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: body.folderId, userId },
    });
    if (!folder) {
      throw new AppError('NOT_FOUND', 'Folder not found', 404);
    }
    folderGroupId = folder.groupId;
    if (folderGroupId !== effectiveGroupId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Folder does not match the point group scope',
        400,
      );
    }
  }

  if (body.tagIds.length > 0) {
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: body.tagIds },
        OR: [{ userId }, { userId: null }],
      },
      select: { id: true },
    });
    if (tags.length !== body.tagIds.length) {
      throw new AppError('VALIDATION_ERROR', 'One or more tags are invalid', 400);
    }
  }

  const row = await prisma.point.create({
    data: {
      userId,
      title: body.title,
      description: body.description,
      latitude: body.latitude,
      longitude: body.longitude,
      visibility: body.visibility,
      groupId: effectiveGroupId,
      folderId: body.folderId,
      pointTags:
        body.tagIds.length > 0
          ? {
              create: body.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
    },
  });

  return mapPointToJson(row);
}
