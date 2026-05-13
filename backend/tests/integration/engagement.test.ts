import request from 'supertest';
import type { NextFunction } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { favoriteJsonSchema } from '../../src/lib/schemas/favorite.js';
import { makePoint } from '../mocks/pointFactory.js';

const CLERK_USER_ID = 'user_smoke_engagement';

const getAuthMock = vi.hoisted(() =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  vi.fn((_req: unknown) => ({ userId: CLERK_USER_ID as string | undefined })),
);

vi.mock('@clerk/express', () => ({
  clerkMiddleware:
    () => (_req: unknown, _res: unknown, next: NextFunction) => next(),
  getAuth: (req: unknown) =>
    getAuthMock(req) as ReturnType<(typeof import('@clerk/express'))['getAuth']>,
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userPreference: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn() },
    point: { findUnique: vi.fn() },
    rating: { upsert: vi.fn(), aggregate: vi.fn(), findUnique: vi.fn() },
    favoriteFolder: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    favorite: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    comment: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

const pointId = '00000000-0000-4000-8000-0000000000bb';
const localUserId = '00000000-0000-4000-8000-000000000099';
const folderIdA = '00000000-0000-4000-8000-0000000000a1';
const folderIdB = '00000000-0000-4000-8000-0000000000a2';

const prismaUserRow = {
  id: localUserId,
  clerkId: 'clerk_engagement_test',
  displayName: 'Engagement Test',
  createdAt: new Date('2020-01-01T00:00:00.000Z'),
};

function favoriteFolderRow(id: string) {
  return {
    id,
    userId: localUserId,
    name: 'Test folder',
    parentId: null as string | null,
  };
}

function favoriteRow(folderId: string | null) {
  return { userId: localUserId, pointId, favoriteFolderId: folderId };
}

function stubClerkEnv() {
  vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy_for_unit_tests');
  vi.stubEnv(
    'CLERK_PUBLISHABLE_KEY',
    'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ',
  );
}

describe('Engagement APIs require auth when unauthenticated (T067)', () => {
  beforeEach(() => {
    stubClerkEnv();
    getAuthMock.mockImplementation(() => ({ userId: undefined }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function expect401Unauthenticated(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, body?: object) {
    const app = createApp();
    let req = request(app)[method](path);
    req = req.type('application/json');
    const res =
      body !== undefined && ['post', 'put', 'patch'].includes(method)
        ? await req.send(body)
        : await req.send();
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  }

  it('GET comments returns 401', async () => {
    await expect401Unauthenticated('get', `/api/points/${pointId}/comments`);
  });

  it('POST comments returns 401', async () => {
    await expect401Unauthenticated('post', `/api/points/${pointId}/comments`, { body: 'hi' });
  });

  it('PUT rating returns 401', async () => {
    await expect401Unauthenticated('put', `/api/points/${pointId}/rating`, { value: 4 });
  });

  it('GET favorites returns 401', async () => {
    await expect401Unauthenticated('get', '/api/favorites');
  });

  it('POST favorites returns 401', async () => {
    await expect401Unauthenticated('post', '/api/favorites', { pointId });
  });

  it('PATCH favorite (move folder) returns 401', async () => {
    await expect401Unauthenticated('patch', `/api/favorites/${pointId}`, {
      favoriteFolderId: folderIdA,
    });
  });

  it('DELETE favorite returns 401', async () => {
    await expect401Unauthenticated('delete', `/api/favorites/${pointId}`);
  });

  it('GET favorite folders returns 401', async () => {
    await expect401Unauthenticated('get', '/api/favorite-folders');
  });
});

describe('Engagement APIs — favorites with auth (T067)', () => {
  beforeEach(() => {
    stubClerkEnv();
    getAuthMock.mockImplementation(() => ({ userId: CLERK_USER_ID }));
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.userPreference.findUnique).mockReset();
    vi.mocked(prisma.groupMember.findUnique).mockReset();
    vi.mocked(prisma.point.findUnique).mockReset();
    vi.mocked(prisma.favoriteFolder.findFirst).mockReset();
    vi.mocked(prisma.favorite.upsert).mockReset();
    vi.mocked(prisma.favorite.findUnique).mockReset();
    vi.mocked(prisma.favorite.update).mockReset();
    vi.mocked(prisma.favorite.delete).mockReset();
    vi.mocked(prisma.comment.findMany).mockReset();
    vi.mocked(prisma.comment.create).mockReset();
    vi.mocked(prisma.rating.upsert).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function mockReadableWorldPublicPoint() {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(prismaUserRow);
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.point.findUnique).mockResolvedValue(
      makePoint({ id: pointId, userId: localUserId }),
    );
  }

  it('POST /api/favorites adds favorite into a folder', async () => {
    mockReadableWorldPublicPoint();
    vi.mocked(prisma.favoriteFolder.findFirst).mockResolvedValue(
      favoriteFolderRow(folderIdA),
    );

    vi.mocked(prisma.favorite.upsert).mockResolvedValue(
      favoriteRow(folderIdA),
    );

    const res = await request(createApp())
      .post('/api/favorites')
      .send({ pointId, favoriteFolderId: folderIdA });

    expect(res.status).toBe(201);
    expect(favoriteJsonSchema.strict().safeParse(res.body).success).toBe(true);
    expect(res.body).toEqual({
      pointId,
      favoriteFolderId: folderIdA,
    });
    expect(prisma.favorite.upsert).toHaveBeenCalledTimes(1);
  });

  it('POST /api/favorites returns 404 when folder is not owned by viewer', async () => {
    mockReadableWorldPublicPoint();
    vi.mocked(prisma.favoriteFolder.findFirst).mockResolvedValue(null);

    const res = await request(createApp()).post('/api/favorites').send({
      pointId,
      favoriteFolderId: folderIdA,
    });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(prisma.favorite.upsert).not.toHaveBeenCalled();
  });

  it('PATCH /api/favorites/:pointId moves favorite to another folder', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(prismaUserRow);
    vi.mocked(prisma.favoriteFolder.findFirst).mockResolvedValue(
      favoriteFolderRow(folderIdB),
    );
    vi.mocked(prisma.favorite.findUnique).mockResolvedValue(
      favoriteRow(folderIdA),
    );
    vi.mocked(prisma.favorite.update).mockResolvedValue(
      favoriteRow(folderIdB),
    );

    const res = await request(createApp())
      .patch(`/api/favorites/${pointId}`)
      .send({ favoriteFolderId: folderIdB });

    expect(res.status).toBe(200);
    expect(favoriteJsonSchema.strict().safeParse(res.body).success).toBe(true);
    expect(res.body).toEqual({ pointId, favoriteFolderId: folderIdB });
    expect(prisma.favorite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_pointId: { userId: localUserId, pointId },
        },
        data: { favoriteFolderId: folderIdB },
      }),
    );
  });

  it('PATCH /api/favorites/:pointId returns 404 when favorite does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(prismaUserRow);
    vi.mocked(prisma.favoriteFolder.findFirst).mockResolvedValue(
      favoriteFolderRow(folderIdB),
    );
    vi.mocked(prisma.favorite.findUnique).mockResolvedValue(null);

    const res = await request(createApp())
      .patch(`/api/favorites/${pointId}`)
      .send({ favoriteFolderId: folderIdB });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(prisma.favorite.update).not.toHaveBeenCalled();
  });

  it('DELETE /api/favorites/:pointId removes favorite', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(prismaUserRow);
    vi.mocked(prisma.favorite.findUnique).mockResolvedValue(
      favoriteRow(folderIdA),
    );
    vi.mocked(prisma.favorite.delete).mockResolvedValue(undefined as never);

    const res = await request(createApp()).delete(`/api/favorites/${pointId}`);

    expect(res.status).toBe(204);
    expect(prisma.favorite.delete).toHaveBeenCalledWith({
      where: { userId_pointId: { userId: localUserId, pointId } },
    });
  });

  it('DELETE /api/favorites/:pointId returns 404 when not favorited', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(prismaUserRow);
    vi.mocked(prisma.favorite.findUnique).mockResolvedValue(null);

    const res = await request(createApp()).delete(`/api/favorites/${pointId}`);

    expect(res.status).toBe(404);
    expect(prisma.favorite.delete).not.toHaveBeenCalled();
  });
});
