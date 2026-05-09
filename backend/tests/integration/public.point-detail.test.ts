import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { PointVisibility } from '../../src/generated/prisma/enums.js';
import { pointJsonSchema } from '../../src/lib/schemas/point.js';
import { makePoint } from '../mocks/pointFactory.js';

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    point: { findUnique: vi.fn() },
    rating: { aggregate: vi.fn(), findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    userPreference: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn() },
  },
}));

import { prisma } from '../../src/lib/prisma.js';

describe('GET /api/public/points/:pointId', () => {
  const pointId = '00000000-0000-4000-8000-000000000099';

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(prisma.point.findUnique).mockReset();
    vi.mocked(prisma.rating.aggregate).mockReset();
    vi.mocked(prisma.rating.findUnique).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.userPreference.findUnique).mockReset();
    vi.mocked(prisma.groupMember.findUnique).mockReset();
  });

  it('returns 404 for invalid uuid', async () => {
    const res = await request(createApp()).get('/api/public/points/not-a-uuid');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(prisma.point.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 when point does not exist', async () => {
    vi.mocked(prisma.point.findUnique).mockResolvedValue(null);
    const res = await request(createApp()).get(`/api/public/points/${pointId}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('returns 200 with Point JSON for world-public point; guest has null myRating; no comment payload', async () => {
    const row = makePoint({ id: pointId });
    vi.mocked(prisma.point.findUnique).mockResolvedValue(row);
    vi.mocked(prisma.rating.aggregate).mockResolvedValue({
      _avg: { value: 4 },
    } as Awaited<ReturnType<typeof prisma.rating.aggregate>>);
    vi.mocked(prisma.rating.findUnique).mockResolvedValue(null);
    const res = await request(createApp()).get(`/api/public/points/${pointId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(pointId);
    expect(res.body.title).toBe('Test point');
    expect(res.body.visibility).toBe(PointVisibility.public);
    expect(res.body.averageRating).toBe(4);
    expect(res.body.myRating).toBeNull();
    /** OpenAPI Point only — rejects e.g. `comments` embedded in detail (thread is a separate route). */
    expect(pointJsonSchema.strict().safeParse(res.body).success).toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 for group_only point when unauthenticated (guest)', async () => {
    const row = makePoint({
      id: pointId,
      visibility: PointVisibility.group_only,
      groupId: '00000000-0000-4000-8000-0000000000aa',
    });
    vi.mocked(prisma.point.findUnique).mockResolvedValue(row);
    const res = await request(createApp()).get(`/api/public/points/${pointId}`);
    expect(res.status).toBe(404);
    expect(prisma.rating.aggregate).not.toHaveBeenCalled();
  });

  it('returns 404 for public visibility with non-null groupId (not world-public)', async () => {
    const row = makePoint({
      id: pointId,
      visibility: PointVisibility.public,
      groupId: '00000000-0000-4000-8000-0000000000aa',
    });
    vi.mocked(prisma.point.findUnique).mockResolvedValue(row);
    const res = await request(createApp()).get(`/api/public/points/${pointId}`);
    expect(res.status).toBe(404);
  });
});
