import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { PointVisibility } from '../../src/generated/prisma/enums.js';
import { makePoint } from '../mocks/pointFactory.js';

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    point: { findMany: vi.fn() },
  },
}));

import { prisma } from '../../src/lib/prisma.js';

describe('GET /api/public/latest', () => {
  beforeEach(() => {
    vi.mocked(prisma.point.findMany).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 200 with at most 5 items in newest-first order from the service', async () => {
    const older = makePoint({
      id: '00000000-0000-4000-8000-000000000001',
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
    });
    const newer = makePoint({
      id: '00000000-0000-4000-8000-00000000000a',
      createdAt: new Date('2020-02-01T00:00:00.000Z'),
    });
    vi.mocked(prisma.point.findMany).mockResolvedValue([newer, older]);
    const res = await request(createApp()).get('/api/public/latest');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
    expect(res.body.items[0].id).toBe(newer.id);
    expect(res.body.items[0].title).toBe('Test point');
    expect(res.body.items[0].createdAt).toBe(newer.createdAt.toISOString());
    expect(res.body.items[0].visibility).toBe(PointVisibility.public);
  });

  it('requests public, non–group points only, limit 5, ordered by createdAt desc', async () => {
    vi.mocked(prisma.point.findMany).mockResolvedValue([]);
    await request(createApp()).get('/api/public/latest');
    expect(prisma.point.findMany).toHaveBeenCalledWith({
      where: { visibility: PointVisibility.public, groupId: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  });

  it('builds photoUrl when CLOUDINARY_CLOUD_NAME is set', async () => {
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'demo-cloud');
    const row = makePoint({ photoKey: 'pern-map-pins/points/abc123' });
    vi.mocked(prisma.point.findMany).mockResolvedValue([row]);
    const res = await request(createApp()).get('/api/public/latest');
    expect(res.body.items[0].photoUrl).toBe(
      'https://res.cloudinary.com/demo-cloud/image/upload/f_auto,q_auto/pern-map-pins/points/abc123',
    );
  });
});
