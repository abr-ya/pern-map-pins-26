import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * T034 — protected routes return 401 without a valid Clerk session.
 *
 * We do not need a real Clerk backend: setting `CLERK_SECRET_KEY` to a
 * dummy value before importing the app is enough to mount the middleware,
 * and `requireAuth()` rejects any request that lacks a verifiable session
 * (which is the case for missing / garbage Authorization headers).
 */
describe('Clerk-protected routes (T034)', () => {
  beforeEach(() => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy_for_unit_tests');
    // Clerk's authenticateRequest also asserts the publishable key shape;
    // a base64 of `example.clerk.example.dev$` matches the expected pattern.
    vi.stubEnv(
      'CLERK_PUBLISHABLE_KEY',
      'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ',
    );
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns 401 for GET /api/me without Authorization header', async () => {
    const { createApp } = await import('../../src/app.js');
    const res = await request(createApp()).get('/api/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for GET /api/me with a malformed Bearer token', async () => {
    const { createApp } = await import('../../src/app.js');
    const res = await request(createApp())
      .get('/api/me')
      .set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
  });

  it('keeps the public route accessible without auth', async () => {
    vi.doMock('../../src/lib/prisma.js', () => ({
      prisma: { point: { findMany: vi.fn().mockResolvedValue([]) } },
    }));
    const { createApp } = await import('../../src/app.js');
    const res = await request(createApp()).get('/api/public/latest');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [] });
    vi.doUnmock('../../src/lib/prisma.js');
  });
});
