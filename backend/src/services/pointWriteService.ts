import { PointVisibility } from '../generated/prisma/enums.js';
import type { Point } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { mapPointToJson, type PointJson } from '../lib/schemas/point.js';
import type { PointCreateBody } from '../lib/schemas/pointCreate.js';
import type { PointUpdateBody } from '../lib/schemas/pointUpdate.js';
import { assertPhotoKeyMatchesPoint } from '../lib/cloudinaryUpload.js';
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

export async function updatePoint(params: {
  clerkUserId: string;
  pointId: string;
  body: PointUpdateBody;
}): Promise<PointJson> {
  const { clerkUserId, pointId, body } = params;

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

  const existing = await prisma.point.findFirst({
    where: { id: pointId, userId },
  });

  if (!existing) {
    const any = await prisma.point.findUnique({ where: { id: pointId }, select: { id: true } });
    if (!any) {
      throw new AppError('NOT_FOUND', 'Point not found', 404);
    }
    throw new AppError('FORBIDDEN', 'Not allowed to modify this point', 403);
  }

  const nextVisibility =
    body.visibility !== undefined ? body.visibility : existing.visibility;
  const nextGroupIdRaw =
    body.groupId !== undefined ? body.groupId : existing.groupId;

  if (nextVisibility === PointVisibility.public && nextGroupIdRaw !== null) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Public points cannot be scoped to a group; omit groupId or use visibility group_only',
      400,
    );
  }

  if (nextVisibility === PointVisibility.group_only && nextGroupIdRaw === null) {
    throw new AppError(
      'VALIDATION_ERROR',
      'group_only visibility requires groupId',
      400,
    );
  }

  const effectiveGroupId =
    nextVisibility === PointVisibility.public ? null : nextGroupIdRaw;

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

  const resolvedFolderId = await resolveFolderIdForPointUpdate({
    userId,
    existing,
    effectiveGroupId,
    bodyFolderId: body.folderId,
  });

  if (body.tagIds !== undefined && body.tagIds.length > 0) {
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

  if (body.photoKey !== undefined) {
    assertPhotoKeyMatchesPoint(pointId, body.photoKey);
  }

  const data = buildPointUpdateData(body, {
    effectiveGroupId,
    resolvedFolderId,
  });

  const row = await prisma.point.update({
    where: { id: pointId },
    data,
  });

  return mapPointToJson(row);
}

async function resolveFolderIdForPointUpdate(params: {
  userId: string;
  existing: Point;
  effectiveGroupId: string | null;
  bodyFolderId: string | null | undefined;
}): Promise<string | null> {
  const { userId, existing, effectiveGroupId, bodyFolderId } = params;

  if (bodyFolderId !== undefined) {
    if (bodyFolderId === null) {
      return null;
    }
    const folder = await prisma.folder.findFirst({
      where: { id: bodyFolderId, userId },
    });
    if (!folder) {
      throw new AppError('NOT_FOUND', 'Folder not found', 404);
    }
    if (folder.groupId !== effectiveGroupId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Folder does not match the point group scope',
        400,
      );
    }
    return bodyFolderId;
  }

  if (existing.folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: existing.folderId, userId },
    });
    if (folder && folder.groupId !== effectiveGroupId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Update folder or visibility: current folder does not match the point group scope',
        400,
      );
    }
  }

  return existing.folderId;
}

function buildPointUpdateData(
  body: PointUpdateBody,
  resolved: {
    effectiveGroupId: string | null;
    resolvedFolderId: string | null;
  },
) {
  const data: {
    title?: string;
    description?: string | null;
    visibility?: PointVisibility;
    groupId?: string | null;
    folderId?: string | null;
    photoKey?: string | null;
    pointTags?: { deleteMany: Record<string, never>; create: { tagId: string }[] };
  } = {};

  if (body.title !== undefined) {
    data.title = body.title;
  }
  if (body.description !== undefined) {
    data.description = body.description;
  }
  if (body.visibility !== undefined) {
    data.visibility = body.visibility;
  }
  if (body.groupId !== undefined || body.visibility !== undefined) {
    data.groupId = resolved.effectiveGroupId;
  }
  if (body.folderId !== undefined) {
    data.folderId = resolved.resolvedFolderId;
  }
  if (body.photoKey !== undefined) {
    data.photoKey = body.photoKey;
  }
  if (body.tagIds !== undefined) {
    data.pointTags = {
      deleteMany: {},
      create: body.tagIds.map((tagId) => ({ tagId })),
    };
  }

  return data;
}
