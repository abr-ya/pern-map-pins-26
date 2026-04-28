import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function assertUserCanUploadPhotoForPoint(params: {
  clerkUserId: string;
  pointId: string;
}): Promise<void> {
  const { clerkUserId, pointId } = params;

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

  const owned = await prisma.point.findFirst({
    where: { id: pointId, userId: user.id },
    select: { id: true },
  });

  if (owned) {
    return;
  }

  const exists = await prisma.point.findUnique({
    where: { id: pointId },
    select: { id: true },
  });

  if (!exists) {
    throw new AppError('NOT_FOUND', 'Point not found', 404);
  }

  throw new AppError('FORBIDDEN', 'Not allowed to modify this point', 403);
}
