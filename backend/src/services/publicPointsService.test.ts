import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PointVisibility } from '../generated/prisma/enums.js';
import { prisma } from '../lib/prisma.js';
import { getLatestPublicPoints } from './publicPointsService.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    point: { findMany: vi.fn() },
  },
}));

describe('getLatestPublicPoints', () => {
  beforeEach(() => {
    vi.mocked(prisma.point.findMany).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('selects the latest five public, non–group points', async () => {
    vi.mocked(prisma.point.findMany).mockResolvedValue([]);
    await getLatestPublicPoints();
    expect(prisma.point.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { visibility: PointVisibility.public, groupId: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    );
  });
});
