import { prisma } from '../lib/prisma.js';
import { mapPointToJson, type PointJson } from '../lib/schemas/point.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listMyPoints(params: {
  clerkUserId: string;
  folderId?: string;
}): Promise<PointJson[]> {
  const user = await prisma.user.findUnique({
    where: { clerkId: params.clerkUserId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(
      'USER_NOT_PROVISIONED',
      'No local user record for this account yet; wait for sync or sign in again',
      403,
    );
  }

  const where =
    params.folderId !== undefined
      ? { userId: user.id, folderId: params.folderId }
      : { userId: user.id };

  const rows = await prisma.point.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((row) => mapPointToJson(row));
}
