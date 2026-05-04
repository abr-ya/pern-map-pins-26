import type { Prisma } from '../generated/prisma/client.js';
import { PointVisibility } from '../generated/prisma/enums.js';
import { prisma } from '../lib/prisma.js';
import { mapPointToJson, type PointJson } from '../lib/schemas/point.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Points visible on the signed-in exploration map (FR-007 / FR-014): all world-public pins
 * in the bbox, plus `group_only` pins for the user's active group (if any) when they are a member.
 */
export async function listPointsInMapViewport(params: {
  clerkUserId: string;
  southWestLat: number;
  southWestLng: number;
  northEastLat: number;
  northEastLng: number;
  limit: number;
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

  const pref = await prisma.userPreference.findUnique({
    where: { userId: user.id },
    select: { activeGroupId: true },
  });
  const activeGroupId = pref?.activeGroupId ?? null;

  let memberActiveGroup: string | null = null;
  if (activeGroupId) {
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: activeGroupId, userId: user.id },
      },
    });
    if (membership) {
      memberActiveGroup = activeGroupId;
    }
  }

  const latMin = Math.min(params.southWestLat, params.northEastLat);
  const latMax = Math.max(params.southWestLat, params.northEastLat);
  const lngMin = Math.min(params.southWestLng, params.northEastLng);
  const lngMax = Math.max(params.southWestLng, params.northEastLng);

  const publicClause: Prisma.PointWhereInput = {
    visibility: PointVisibility.public,
    groupId: null,
    latitude: { gte: latMin, lte: latMax },
    longitude: { gte: lngMin, lte: lngMax },
  };

  const or: Prisma.PointWhereInput[] = [publicClause];
  if (memberActiveGroup) {
    or.push({
      visibility: PointVisibility.group_only,
      groupId: memberActiveGroup,
      latitude: { gte: latMin, lte: latMax },
      longitude: { gte: lngMin, lte: lngMax },
    });
  }

  const rows = await prisma.point.findMany({
    where: { OR: or },
    orderBy: { createdAt: 'desc' },
    take: params.limit,
  });

  return rows.map((row) => mapPointToJson(row));
}
