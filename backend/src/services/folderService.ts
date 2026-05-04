import { prisma } from '../lib/prisma.js';
import { mapFolderToJson, type FolderJson } from '../lib/schemas/folderJson.js';
import type { FolderCreateBody } from '../lib/schemas/folderCreate.js';
import type { FolderUpdateBody } from '../lib/schemas/folderUpdate.js';
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

export async function listFolders(clerkUserId: string): Promise<FolderJson[]> {
  const userId = await internalUserId(clerkUserId);
  const rows = await prisma.folder.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(mapFolderToJson);
}

export async function createFolder(
  clerkUserId: string,
  body: FolderCreateBody,
): Promise<FolderJson> {
  const userId = await internalUserId(clerkUserId);

  if (body.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: body.groupId, userId } },
    });
    if (!membership) {
      throw new AppError('FORBIDDEN', 'Not a member of this group', 403);
    }
  }

  const row = await prisma.folder.create({
    data: {
      userId,
      name: body.name,
      groupId: body.groupId,
    },
  });
  return mapFolderToJson(row);
}

export async function updateFolder(
  clerkUserId: string,
  folderId: string,
  body: FolderUpdateBody,
): Promise<FolderJson> {
  const userId = await internalUserId(clerkUserId);

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
  });
  if (!folder) {
    throw new AppError('NOT_FOUND', 'Folder not found', 404);
  }

  const row = await prisma.folder.update({
    where: { id: folderId },
    data: { name: body.name },
  });
  return mapFolderToJson(row);
}

export async function deleteFolder(clerkUserId: string, folderId: string): Promise<void> {
  const userId = await internalUserId(clerkUserId);

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
  });
  if (!folder) {
    throw new AppError('NOT_FOUND', 'Folder not found', 404);
  }

  await prisma.folder.delete({ where: { id: folderId } });
}
