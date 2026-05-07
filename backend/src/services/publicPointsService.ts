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

/**
 * Single-point detail for `GET /api/public/points/:pointId`.
 * Visibility matches the signed-in map (FR-007 / FR-014): world-public rows
 * (`visibility === public` and `groupId === null`) for everyone, plus
 * `group_only` pins for the viewer’s **active** group when they are a member.
 * No comment payload — only {@link PointJson} fields.
 */
export async function getPublicPointById(
  pointId: string,
  clerkUserId: string | null,
): Promise<PointJson | null> {
  const point = await prisma.point.findUnique({ where: { id: pointId } });
  if (!point) {
    return null;
  }

  let internalUserId: string | null = null;
  let activeGroupId: string | null = null;
  let memberOfActiveGroup = false;

  if (clerkUserId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });
    if (user) {
      internalUserId = user.id;
      const pref = await prisma.userPreference.findUnique({
        where: { userId: user.id },
        select: { activeGroupId: true },
      });
      activeGroupId = pref?.activeGroupId ?? null;
      if (activeGroupId) {
        const membership = await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId: activeGroupId, userId: user.id } },
        });
        memberOfActiveGroup = Boolean(membership);
      }
    }
  }

  const isWorldPublic =
    point.visibility === PointVisibility.public && point.groupId === null;
  const isGroupOnlyForActiveGroup =
    point.visibility === PointVisibility.group_only &&
    point.groupId != null &&
    memberOfActiveGroup &&
    activeGroupId === point.groupId;

  if (!isWorldPublic && !isGroupOnlyForActiveGroup) {
    return null;
  }

  const [avgResult, myRatingRow] = await Promise.all([
    prisma.rating.aggregate({
      where: { pointId: point.id },
      _avg: { value: true },
    }),
    internalUserId
      ? prisma.rating.findUnique({
          where: {
            userId_pointId: { userId: internalUserId, pointId: point.id },
          },
        })
      : Promise.resolve(null),
  ]);

  const averageRating =
    avgResult._avg.value != null ? Number(avgResult._avg.value) : null;
  const myRating = myRatingRow?.value ?? null;

  return mapPointToJson(point, { averageRating, myRating });
}
