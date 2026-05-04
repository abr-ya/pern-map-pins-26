import request from 'supertest';
import type { NextFunction } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PointVisibility } from '../../src/generated/prisma/enums.js';

const CLERK_USER_ID = 'user_map_public';

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
    point: { findMany: vi.fn() },
  },
}));

import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

const INTERNAL_USER = '00000000-0000-4000-8000-0000000000b1';
const GROUP_A = '10000000-0000-4000-8000-0000000000a1';
const GROUP_B = '10000000-0000-4000-8000-0000000000b2';

function makePointRow(params: {
  id: string;
  visibility: typeof PointVisibility.public | typeof PointVisibility.group_only;
  groupId: string | null;
  title?: string;
  lat?: number;
  lng?: number;
}) {
  const now = new Date('2024-06-01T12:00:00.000Z');
  return {
    id: params.id,
    userId: INTERNAL_USER,
    folderId: null,
    groupId: params.groupId,
    visibility: params.visibility,
    title: params.title ?? 'P',
    description: null,
    photoKey: null,
    latitude: params.lat ?? 5,
    longitude: params.lng ?? 5,
    createdAt: now,
    updatedAt: now,
  };
}

const BBOX =
  '?southWestLat=0&southWestLng=0&northEastLat=10&northEastLng=10';

describe('GET /api/map/public (US4 / T057)', () => {
  beforeEach(() => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy_for_unit_tests');
    vi.stubEnv(
      'CLERK_PUBLISHABLE_KEY',
      'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ',
    );
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.userPreference.findUnique).mockReset();
    vi.mocked(prisma.groupMember.findUnique).mockReset();
    vi.mocked(prisma.point.findMany).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns public points in bbox', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue({ activeGroupId: null });
    vi.mocked(prisma.point.findMany).mockResolvedValue([
      makePointRow({
        id: '20000000-0000-4000-8000-000000000001',
        visibility: PointVisibility.public,
        groupId: null,
        title: 'Pub',
      }),
    ]);

    const res = await request(createApp()).get(`/api/map/public${BBOX}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe('Pub');
    expect(res.body.items[0].visibility).toBe('public');

    const call = vi.mocked(prisma.point.findMany).mock.calls[0]?.[0];
    expect(call?.where).toEqual({
      OR: [
        {
          visibility: PointVisibility.public,
          groupId: null,
          latitude: { gte: 0, lte: 10 },
          longitude: { gte: 0, lte: 10 },
        },
      ],
    });
  });

  it('adds group_only slice for active group when user is a member', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue({ activeGroupId: GROUP_A });
    vi.mocked(prisma.groupMember.findUnique).mockResolvedValue({
      groupId: GROUP_A,
      userId: INTERNAL_USER,
    });
    vi.mocked(prisma.point.findMany).mockResolvedValue([
      makePointRow({
        id: '20000000-0000-4000-8000-000000000002',
        visibility: PointVisibility.group_only,
        groupId: GROUP_A,
        title: 'Secret A',
      }),
    ]);

    const res = await request(createApp()).get(`/api/map/public${BBOX}`);

    expect(res.status).toBe(200);
    expect(res.body.items[0].visibility).toBe('group_only');

    const call = vi.mocked(prisma.point.findMany).mock.calls[0]?.[0];
    expect(call?.where).toEqual({
      OR: [
        {
          visibility: PointVisibility.public,
          groupId: null,
          latitude: { gte: 0, lte: 10 },
          longitude: { gte: 0, lte: 10 },
        },
        {
          visibility: PointVisibility.group_only,
          groupId: GROUP_A,
          latitude: { gte: 0, lte: 10 },
          longitude: { gte: 0, lte: 10 },
        },
      ],
    });
  });

  it('does not add group_only for a different active group than the one in preferences when user lost membership', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue({ activeGroupId: GROUP_B });
    vi.mocked(prisma.groupMember.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.point.findMany).mockResolvedValue([]);

    await request(createApp()).get(`/api/map/public${BBOX}`);

    const call = vi.mocked(prisma.point.findMany).mock.calls[0]?.[0];
    expect(call?.where).toEqual({
      OR: [
        {
          visibility: PointVisibility.public,
          groupId: null,
          latitude: { gte: 0, lte: 10 },
          longitude: { gte: 0, lte: 10 },
        },
      ],
    });
  });
});
