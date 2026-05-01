import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export type GroupJson = { id: string; name: string; createdAt: string };

function mapGroup(row: { id: string; name: string; createdAt: Date }): GroupJson {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createGroup(clerkUserId: string, name: string): Promise<GroupJson> {
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

  const group = await prisma.group.create({
    data: {
      name,
      members: { create: { userId: user.id } },
    },
  });

  return mapGroup(group);
}

export async function listMyGroups(clerkUserId: string): Promise<GroupJson[]> {
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

  const members = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: true },
    orderBy: { group: { name: 'asc' } },
  });

  return members.map((m) => mapGroup(m.group));
}

export async function addGroupMember(params: {
  clerkUserId: string;
  groupId: string;
  memberUserId: string;
}): Promise<void> {
  const requester = await prisma.user.findUnique({
    where: { clerkId: params.clerkUserId },
    select: { id: true },
  });

  if (!requester) {
    throw new AppError(
      'USER_NOT_PROVISIONED',
      'No local user record for this account yet; wait for sync or sign in again',
      403,
    );
  }

  const requesterMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: params.groupId, userId: requester.id },
    },
  });

  if (!requesterMembership) {
    throw new AppError('FORBIDDEN', 'Not a member of this group', 403);
  }

  const targetExists = await prisma.user.findUnique({
    where: { id: params.memberUserId },
    select: { id: true },
  });

  if (!targetExists) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  await prisma.groupMember.upsert({
    where: {
      groupId_userId: { groupId: params.groupId, userId: params.memberUserId },
    },
    create: { groupId: params.groupId, userId: params.memberUserId },
    update: {},
  });
}
