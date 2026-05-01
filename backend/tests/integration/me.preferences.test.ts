import request from 'supertest';
import type { NextFunction } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CLERK_USER_ID = 'user_prefs_test';

vi.mock('@clerk/express', () => ({
  clerkMiddleware:
    () => (_req: unknown, _res: unknown, next: NextFunction) => next(),
  getAuth: () => ({ userId: CLERK_USER_ID }),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn() },
    userPreference: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

const INTERNAL_USER = '00000000-0000-4000-8000-0000000000a1';
const GROUP_A = '10000000-0000-4000-8000-000000000001';

describe('GET/PATCH /api/me/preferences (US4 / T056)', () => {
  beforeEach(() => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy_for_unit_tests');
    vi.stubEnv(
      'CLERK_PUBLISHABLE_KEY',
      'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ',
    );
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.groupMember.findUnique).mockReset();
    vi.mocked(prisma.userPreference.findUnique).mockReset();
    vi.mocked(prisma.userPreference.upsert).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('GET returns activeGroupId (null when no row)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    vi.mocked(prisma.userPreference.findUnique).mockResolvedValue(null);

    const app = createApp();
    const res = await request(app).get('/api/me/preferences');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ activeGroupId: null });
  });

  it('PATCH with activeGroupId the user is not a member of returns 403', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    vi.mocked(prisma.groupMember.findUnique).mockResolvedValue(null);

    const res = await request(createApp())
      .patch('/api/me/preferences')
      .send({ activeGroupId: GROUP_A });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
    expect(prisma.userPreference.upsert).not.toHaveBeenCalled();
  });

  it('PATCH public-only (null) upserts preference', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    vi.mocked(prisma.userPreference.upsert).mockResolvedValue({
      userId: INTERNAL_USER,
      activeGroupId: null,
    });

    const res = await request(createApp())
      .patch('/api/me/preferences')
      .send({ activeGroupId: null });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ activeGroupId: null });
    expect(prisma.userPreference.upsert).toHaveBeenCalledWith({
      where: { userId: INTERNAL_USER },
      create: { userId: INTERNAL_USER, activeGroupId: null },
      update: { activeGroupId: null },
    });
  });
});
