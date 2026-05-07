import request from 'supertest';
import type { NextFunction } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PointVisibility } from '../../src/generated/prisma/enums.js';
import { makePoint } from '../mocks/pointFactory.js';

const CLERK_USER_ID = 'user_smoke_comments';

vi.mock('@clerk/express', () => ({
  clerkMiddleware:
    () => (_req: unknown, _res: unknown, next: NextFunction) => next(),
  getAuth: () => ({ userId: CLERK_USER_ID }),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userPreference: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn() },
    point: { findUnique: vi.fn() },
    comment: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

describe('GET/POST /api/points/:pointId/comments (T060)', () => {
  const pointId = '00000000-0000-4000-8000-0000000000bb';
  const localUserId = '00000000-0000-4000-8000-000000000099';

  beforeEach(() => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy_for_unit_tests');
    vi.stubEnv(
      'CLERK_PUBLISHABLE_KEY',
      'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ',
    );
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.userPreference.findUnique).mockReset();
    vi.mocked(prisma.groupMember.findUnique).mockReset();
    vi.mocked(prisma.point.findUnique).mockReset();
    vi.mocked(prisma.comment.findMany).mockReset();
    vi.mocked(prisma.comment.create).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function mockWorldPublicPoint() {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: localUserId });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.point.findUnique).mockResolvedValue(
      makePoint({ id: pointId, userId: localUserId }),
    );
  }

  it('GET returns 200 with items for a readable world-public point', async () => {
    mockWorldPublicPoint();
    const createdAt = new Date('2024-01-02T12:00:00.000Z');
    vi.mocked(prisma.comment.findMany).mockResolvedValue([
      {
        id: '00000000-0000-4000-8000-0000000000cc',
        pointId,
        userId: localUserId,
        body: 'Nice spot',
        createdAt,
        user: { displayName: 'Tester' },
      },
    ]);

    const res = await request(createApp()).get(`/api/points/${pointId}/comments`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      id: '00000000-0000-4000-8000-0000000000cc',
      body: 'Nice spot',
      authorId: localUserId,
      displayName: 'Tester',
      createdAt: createdAt.toISOString(),
    });
  });

  it('GET returns 404 for hidden point', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: localUserId });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.point.findUnique).mockResolvedValue(
      makePoint({
        id: pointId,
        visibility: PointVisibility.group_only,
        groupId: '00000000-0000-4000-8000-0000000000dd',
      }),
    );

    const res = await request(createApp()).get(`/api/points/${pointId}/comments`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(prisma.comment.findMany).not.toHaveBeenCalled();
  });

  it('GET returns 403 when user is not provisioned locally', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await request(createApp()).get(`/api/points/${pointId}/comments`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('USER_NOT_PROVISIONED');
  });

  it('POST returns 201 with created comment', async () => {
    mockWorldPublicPoint();
    const createdAt = new Date('2024-03-01T08:00:00.000Z');
    vi.mocked(prisma.comment.create).mockResolvedValue({
      id: '00000000-0000-4000-8000-0000000000ee',
      pointId,
      userId: localUserId,
      body: 'Hello',
      createdAt,
      user: { displayName: 'Tester' },
    });

    const res = await request(createApp())
      .post(`/api/points/${pointId}/comments`)
      .send({ body: 'Hello' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: '00000000-0000-4000-8000-0000000000ee',
      body: 'Hello',
      authorId: localUserId,
      displayName: 'Tester',
    });
  });

  it('POST returns 400 for empty body string (Zod)', async () => {
    mockWorldPublicPoint();

    const res = await request(createApp())
      .post(`/api/points/${pointId}/comments`)
      .send({ body: '' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });
});
