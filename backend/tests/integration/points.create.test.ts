import request from 'supertest';
import type { NextFunction } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PointVisibility } from '../../src/generated/prisma/enums.js';
import { makePoint } from '../mocks/pointFactory.js';

const CLERK_USER_ID = 'user_smoke_points_create';

vi.mock('@clerk/express', () => ({
  clerkMiddleware:
    () => (_req: unknown, _res: unknown, next: NextFunction) => next(),
  getAuth: () => ({ userId: CLERK_USER_ID }),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn() },
    folder: { findFirst: vi.fn() },
    tag: { findMany: vi.fn() },
    point: { create: vi.fn() },
  },
}));

import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

describe('POST /api/points (US3 / T037)', () => {
  beforeEach(() => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy_for_unit_tests');
    vi.stubEnv(
      'CLERK_PUBLISHABLE_KEY',
      'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ',
    );
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.groupMember.findUnique).mockReset();
    vi.mocked(prisma.folder.findFirst).mockReset();
    vi.mocked(prisma.tag.findMany).mockReset();
    vi.mocked(prisma.point.create).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 201 with a Point JSON body', async () => {
    const internalUserId = '00000000-0000-4000-8000-000000000099';
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: internalUserId });
    vi.mocked(prisma.tag.findMany).mockResolvedValue([]);
    const created = makePoint({
      id: '00000000-0000-4000-8000-0000000000aa',
      userId: internalUserId,
      title: 'New pin',
      latitude: 48.8584,
      longitude: 2.2945,
    });
    vi.mocked(prisma.point.create).mockResolvedValue(created);

    const res = await request(createApp())
      .post('/api/points')
      .send({
        title: 'New pin',
        latitude: 48.8584,
        longitude: 2.2945,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(created.id);
    expect(res.body.title).toBe('New pin');
    expect(res.body.authorId).toBe(internalUserId);
    expect(res.body.visibility).toBe(PointVisibility.public);
  });

  it('returns 400 when latitude is out of WGS84 range (Zod)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000099',
    });

    const res = await request(createApp())
      .post('/api/points')
      .send({
        title: 'Bad',
        latitude: 91,
        longitude: 0,
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for public visibility with groupId', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000099',
    });

    const res = await request(createApp())
      .post('/api/points')
      .send({
        title: 'X',
        latitude: 0,
        longitude: 0,
        visibility: 'public',
        groupId: '00000000-0000-4000-8000-000000000088',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for group_only without groupId', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000099',
    });

    const res = await request(createApp())
      .post('/api/points')
      .send({
        title: 'X',
        latitude: 0,
        longitude: 0,
        visibility: 'group_only',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 when no internal user row exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await request(createApp())
      .post('/api/points')
      .send({ title: 'Lonely', latitude: 0, longitude: 0 });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('USER_NOT_PROVISIONED');
  });

  it('returns 403 when user is not a member of the target group', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000099',
    });
    vi.mocked(prisma.groupMember.findUnique).mockResolvedValue(null);

    const res = await request(createApp())
      .post('/api/points')
      .send({
        title: 'G',
        latitude: 0,
        longitude: 0,
        visibility: 'group_only',
        groupId: '00000000-0000-4000-8000-000000000077',
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
