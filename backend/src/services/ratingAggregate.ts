import { prisma } from '../lib/prisma.js';

export async function averageRatingForPoint(
  pointId: string,
): Promise<number | null> {
  const avg = await prisma.rating.aggregate({
    where: { pointId },
    _avg: { value: true },
  });
  return avg._avg.value != null ? Number(avg._avg.value) : null;
}
