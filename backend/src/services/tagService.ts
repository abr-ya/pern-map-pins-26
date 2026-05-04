import { prisma } from '../lib/prisma.js';
import { mapTagToJson, type TagJson } from '../lib/schemas/tagJson.js';
import type { TagCreateBody } from '../lib/schemas/tagCreate.js';
import { AppError } from '../middleware/errorHandler.js';

async function internalUserId(clerkUserId: string): Promise<string> {
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
  return user.id;
}

/** User-defined tags plus global tags (`user_id` null). */
export async function listTags(clerkUserId: string): Promise<TagJson[]> {
  const userId = await internalUserId(clerkUserId);
  const rows = await prisma.tag.findMany({
    where: {
      OR: [{ userId }, { userId: null }],
    },
    orderBy: [{ userId: 'asc' }, { name: 'asc' }],
  });
  return rows.map(mapTagToJson);
}

export async function createTag(clerkUserId: string, body: TagCreateBody): Promise<TagJson> {
  const userId = await internalUserId(clerkUserId);
  const row = await prisma.tag.create({
    data: { name: body.name, userId },
  });
  return mapTagToJson(row);
}
