import type { Point } from '../generated/prisma/client.js';
import { PointVisibility } from '../generated/prisma/enums.js';
import { prisma } from '../lib/prisma.js';

/** Map / public-detail visibility context for a viewer (guest or signed-in). */
export type ViewerReadContext = {
  localUserId: string | null;
  activeGroupId: string | null;
  memberOfActiveGroup: boolean;
};

/**
 * Resolve active group + membership for map-aligned read rules (FR-007 / FR-014).
 * When `clerkUserId` is null or unknown in `users`, `localUserId` is null.
 */
export async function resolveViewerReadContext(
  clerkUserId: string | null,
): Promise<ViewerReadContext> {
  if (!clerkUserId) {
    return { localUserId: null, activeGroupId: null, memberOfActiveGroup: false };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!user) {
    return { localUserId: null, activeGroupId: null, memberOfActiveGroup: false };
  }

  const pref = await prisma.userPreference.findUnique({
    where: { userId: user.id },
    select: { activeGroupId: true },
  });
  const activeGroupId = pref?.activeGroupId ?? null;
  let memberOfActiveGroup = false;
  if (activeGroupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: activeGroupId, userId: user.id } },
    });
    memberOfActiveGroup = Boolean(membership);
  }

  return {
    localUserId: user.id,
    activeGroupId,
    memberOfActiveGroup,
  };
}

export function isPointVisibleToViewer(
  point: Pick<Point, 'visibility' | 'groupId'>,
  ctx: ViewerReadContext,
): boolean {
  const isWorldPublic =
    point.visibility === PointVisibility.public && point.groupId === null;
  const isGroupOnlyForActiveGroup =
    point.visibility === PointVisibility.group_only &&
    point.groupId != null &&
    ctx.memberOfActiveGroup &&
    ctx.activeGroupId === point.groupId;
  return isWorldPublic || isGroupOnlyForActiveGroup;
}
