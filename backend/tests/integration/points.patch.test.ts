import request from 'supertest';
import type { NextFunction } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PointVisibility } from '../../src/generated/prisma/enums.js';
import { makePoint } from '../mocks/pointFactory.js';

const CLERK_USER_ID = 'user_patch_point';

vi.mock('@clerk/express', () => ({
  clerkMiddleware:
    () => (_req: unknown, _res: unknown, next: NextFunction) => next(),
  getAuth: () => ({ userId: CLERK_USER_ID }),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    point: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    groupMember: { findUnique: vi.fn() },
    folder: { findFirst: vi.fn() },
    tag: { findMany: vi.fn() },
  },
}));

import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

const INTERNAL_USER = '00000000-0000-4000-8000-000000000099';
const POINT_ID = '00000000-0000-4000-8000-0000000000aa';

describe('PATCH /api/points/{pointId} (US3 / T044)', () => {
  beforeEach(() => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy_for_unit_tests');
    vi.stubEnv(
      'CLERK_PUBLISHABLE_KEY',
      'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ',
    );
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'demo-cloud');
    vi.stubEnv('CLOUDINARY_API_KEY', 'k');
    vi.stubEnv('CLOUDINARY_API_SECRET', 's');
    vi.stubEnv('CLOUDINARY_UPLOAD_PRESET', 'preset');
    vi.stubEnv('CLOUDINARY_UPLOAD_FOLDER', 'pern-map-pins/points');
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.point.findFirst).mockReset();
    vi.mocked(prisma.point.findUnique).mockReset();
    vi.mocked(prisma.point.update).mockReset();
    vi.mocked(prisma.groupMember.findUnique).mockReset();
    vi.mocked(prisma.folder.findFirst).mockReset();
    vi.mocked(prisma.tag.findMany).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 200 and rejects a non-canonical photoKey (FR-004 second image path)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    vi.mocked(prisma.point.findFirst).mockResolvedValue(
      makePoint({
        id: POINT_ID,
        userId: INTERNAL_USER,
        title: 'T',
        visibility: PointVisibility.public,
        latitude: 0,
        longitude: 0,
      }),
    );

    const res = await request(createApp())
      .patch(`/api/points/${POINT_ID}`)
      .send({ photoKey: 'someone-else-folder/other-id' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(vi.mocked(prisma.point.update)).not.toHaveBeenCalled();
  });

  it('returns 200 when photoKey matches canonical public_id', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    const existing = makePoint({
      id: POINT_ID,
      userId: INTERNAL_USER,
      title: 'T',
      visibility: PointVisibility.public,
      latitude: 0,
      longitude: 0,
    });
    vi.mocked(prisma.point.findFirst).mockResolvedValue(existing);
    const updated = { ...existing, photoKey: `pern-map-pins/points/${POINT_ID}` };
    vi.mocked(prisma.point.update).mockResolvedValue(updated);

    const res = await request(createApp())
      .patch(`/api/points/${POINT_ID}`)
      .send({ photoKey: `pern-map-pins/points/${POINT_ID}` });

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.point.update)).toHaveBeenCalled();
  });
});
