import request from 'supertest';
import type { NextFunction } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PointVisibility } from '../../src/generated/prisma/enums.js';
import { makePoint } from '../mocks/pointFactory.js';

const CLERK_USER_ID = 'user_smoke_ratings';

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
    rating: { upsert: vi.fn(), aggregate: vi.fn() },
  },
}));

import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

describe('PUT /api/points/:pointId/rating (T061)', () => {
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
    vi.mocked(prisma.rating.upsert).mockReset();
    vi.mocked(prisma.rating.aggregate).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function mockReadablePoint() {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: localUserId });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.point.findUnique).mockResolvedValue(makePoint({ id: pointId, userId: localUserId }));
  }

  it('returns 200 with myRating and averageRating', async () => {
    mockReadablePoint();
    vi.mocked(prisma.rating.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.rating.aggregate).mockResolvedValue({
      _avg: { value: 4 },
    } as Awaited<ReturnType<typeof prisma.rating.aggregate>>);

    const res = await request(createApp())
      .put(`/api/points/${pointId}/rating`)
      .send({ value: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ myRating: 5, averageRating: 4 });
  });

  it('returns 404 for non-visible point', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: localUserId });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.point.findUnique).mockResolvedValue(
      makePoint({
        id: pointId,
        visibility: PointVisibility.group_only,
        groupId: '00000000-0000-4000-8000-0000000000dd',
      }),
    );

    const res = await request(createApp())
      .put(`/api/points/${pointId}/rating`)
      .send({ value: 4 });

    expect(res.status).toBe(404);
    expect(prisma.rating.upsert).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid value', async () => {
    mockReadablePoint();

    const res = await request(createApp())
      .put(`/api/points/${pointId}/rating`)
      .send({ value: 6 });

    expect(res.status).toBe(400);
    expect(prisma.rating.upsert).not.toHaveBeenCalled();
  });
});
