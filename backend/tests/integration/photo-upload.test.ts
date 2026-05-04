import request from 'supertest';
import type { NextFunction } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CLERK_USER_ID = 'user_smoke_photo_upload';
const INTERNAL_USER_ID = '00000000-0000-4000-8000-000000000099';
const POINT_ID = '00000000-0000-4000-8000-0000000000aa';

vi.mock('@clerk/express', () => ({
  clerkMiddleware:
    () => (_req: unknown, _res: unknown, next: NextFunction) => next(),
  getAuth: () => ({ userId: CLERK_USER_ID }),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    point: { findFirst: vi.fn(), findUnique: vi.fn() },
  },
}));

import { createApp } from '../../src/app.js';
import { signCloudinaryParams } from '../../src/lib/cloudinaryUpload.js';
import { prisma } from '../../src/lib/prisma.js';

describe('POST /api/points/{pointId}/photo-upload (T038)', () => {
  beforeEach(() => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy_for_unit_tests');
    vi.stubEnv(
      'CLERK_PUBLISHABLE_KEY',
      'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ',
    );
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'demo-cloud');
    vi.stubEnv('CLOUDINARY_API_KEY', 'api_key_test');
    vi.stubEnv('CLOUDINARY_API_SECRET', 'api_secret_test');
    vi.stubEnv('CLOUDINARY_UPLOAD_PRESET', 'pern_test_preset');
    vi.stubEnv('CLOUDINARY_UPLOAD_FOLDER', 'pern-map-pins/points');

    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.point.findFirst).mockReset();
    vi.mocked(prisma.point.findUnique).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 200 with signed Cloudinary upload params for the point owner', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER_ID });
    vi.mocked(prisma.point.findFirst).mockResolvedValue({ id: POINT_ID });

    const res = await request(createApp()).post(
      `/api/points/${POINT_ID}/photo-upload`,
    );

    expect(res.status).toBe(200);
    expect(res.body.uploadUrl).toBe(
      'https://api.cloudinary.com/v1_1/demo-cloud/image/upload',
    );
    expect(res.body.apiKey).toBe('api_key_test');
    expect(res.body.uploadPreset).toBe('pern_test_preset');
    expect(res.body.cloudName).toBe('demo-cloud');
    expect(res.body.folder).toBe('pern-map-pins/points');
    expect(res.body.photoKey).toBe(`pern-map-pins/points/${POINT_ID}`);
    expect(typeof res.body.timestamp).toBe('number');
    expect(typeof res.body.signature).toBe('string');

    expect(
      signCloudinaryParams(
        {
          folder: res.body.folder,
          public_id: POINT_ID,
          timestamp: res.body.timestamp,
          upload_preset: res.body.uploadPreset,
        },
        'api_secret_test',
      ),
    ).toBe(res.body.signature);
  });

  it('returns 400 for invalid point UUID', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER_ID });

    const res = await request(createApp()).post('/api/points/not-a-uuid/photo-upload');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when contentType is not an allowed image type', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER_ID });

    const res = await request(createApp())
      .post(`/api/points/${POINT_ID}/photo-upload`)
      .query({ contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('allows optional contentType image/jpeg', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER_ID });
    vi.mocked(prisma.point.findFirst).mockResolvedValue({ id: POINT_ID });

    const res = await request(createApp())
      .post(`/api/points/${POINT_ID}/photo-upload`)
      .query({ contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
  });

  it('returns 404 when the point does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER_ID });
    vi.mocked(prisma.point.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.point.findUnique).mockResolvedValue(null);

    const res = await request(createApp()).post(
      `/api/points/${POINT_ID}/photo-upload`,
    );

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('returns 403 when the point is owned by another user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER_ID });
    vi.mocked(prisma.point.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.point.findUnique).mockResolvedValue({ id: POINT_ID });

    const res = await request(createApp()).post(
      `/api/points/${POINT_ID}/photo-upload`,
    );

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('returns 503 when Cloudinary is not configured', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy_for_unit_tests');
    vi.stubEnv(
      'CLERK_PUBLISHABLE_KEY',
      'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ',
    );
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', '');
    vi.stubEnv('CLOUDINARY_API_KEY', '');
    vi.stubEnv('CLOUDINARY_API_SECRET', '');
    vi.stubEnv('CLOUDINARY_UPLOAD_PRESET', '');
    vi.stubEnv('CLOUDINARY_UPLOAD_FOLDER', '');

    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER_ID });
    vi.mocked(prisma.point.findFirst).mockResolvedValue({ id: POINT_ID });

    const res = await request(createApp()).post(
      `/api/points/${POINT_ID}/photo-upload`,
    );

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('CLOUDINARY_NOT_CONFIGURED');
  });
});
