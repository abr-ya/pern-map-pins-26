import { PointVisibility } from '../generated/prisma/enums.js';
import { prisma } from '../lib/prisma.js';
import { mapPointToJson, type PointJson } from '../lib/schemas/point.js';

/**
 * Guest “latest five”: globally public points (not private group–scoped), newest first, max 5.
 */
export async function getLatestPublicPoints(): Promise<PointJson[]> {
  const rows = await prisma.point.findMany({
    where: {
      visibility: PointVisibility.public,
      groupId: null,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  return rows.map((row) => mapPointToJson(row));
}
