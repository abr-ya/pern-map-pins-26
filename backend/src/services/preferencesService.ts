import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getPreferences(clerkUserId: string): Promise<{ activeGroupId: string | null }> {
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

  const pref = await prisma.userPreference.findUnique({
    where: { userId: user.id },
    select: { activeGroupId: true },
  });

  return { activeGroupId: pref?.activeGroupId ?? null };
}

export async function patchPreferences(
  clerkUserId: string,
  body: { activeGroupId: string | null },
): Promise<{ activeGroupId: string | null }> {
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

  if (body.activeGroupId !== null) {
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: body.activeGroupId, userId: user.id },
      },
    });
    if (!membership) {
      throw new AppError('FORBIDDEN', 'Not a member of this group', 403);
    }
  }

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, activeGroupId: body.activeGroupId },
    update: { activeGroupId: body.activeGroupId },
  });

  return { activeGroupId: body.activeGroupId };
}
