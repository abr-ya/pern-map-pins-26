import { prisma } from '../lib/prisma.js';
import { requirePointReadableForClerk } from './pointReadAccess.js';
import { averageRatingForPoint } from './ratingAggregate.js';

export async function upsertPointRating(params: {
  clerkUserId: string;
  pointId: string;
  value: number;
}): Promise<{ myRating: number; averageRating: number | null }> {
  const { localUserId } = await requirePointReadableForClerk(
    params.clerkUserId,
    params.pointId,
  );

  await prisma.rating.upsert({
    where: {
      userId_pointId: { userId: localUserId, pointId: params.pointId },
    },
    create: {
      userId: localUserId,
      pointId: params.pointId,
      value: params.value,
    },
    update: { value: params.value },
  });

  const averageRating = await averageRatingForPoint(params.pointId);

  return { myRating: params.value, averageRating };
}
