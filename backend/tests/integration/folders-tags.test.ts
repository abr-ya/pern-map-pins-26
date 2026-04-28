import request from 'supertest';
import type { NextFunction } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CLERK_USER_ID = 'user_folders_tags';

vi.mock('@clerk/express', () => ({
  clerkMiddleware:
    () => (_req: unknown, _res: unknown, next: NextFunction) => next(),
  getAuth: () => ({ userId: CLERK_USER_ID }),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    groupMember: { findUnique: vi.fn() },
    folder: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    tag: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

const INTERNAL_USER = '00000000-0000-4000-8000-000000000099';

describe('Folders & tags API (US3 / T039–T040 / T047)', () => {
  beforeEach(() => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_dummy_for_unit_tests');
    vi.stubEnv(
      'CLERK_PUBLISHABLE_KEY',
      'pk_test_ZXhhbXBsZS5jbGVyay5leGFtcGxlLmRldiQ',
    );
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.groupMember.findUnique).mockReset();
    vi.mocked(prisma.folder.findMany).mockReset();
    vi.mocked(prisma.folder.create).mockReset();
    vi.mocked(prisma.folder.findFirst).mockReset();
    vi.mocked(prisma.folder.update).mockReset();
    vi.mocked(prisma.folder.delete).mockReset();
    vi.mocked(prisma.tag.findMany).mockReset();
    vi.mocked(prisma.tag.create).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('GET /api/folders returns items for the signed-in user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    vi.mocked(prisma.folder.findMany).mockResolvedValue([
      {
        id: '00000000-0000-4000-8000-000000000011',
        userId: INTERNAL_USER,
        groupId: null,
        name: 'Trips',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    const res = await request(createApp()).get('/api/folders');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].name).toBe('Trips');
  });

  it('POST /api/folders creates a folder', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    vi.mocked(prisma.folder.create).mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000022',
      userId: INTERNAL_USER,
      groupId: null,
      name: 'Work',
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
    });

    const res = await request(createApp()).post('/api/folders').send({ name: 'Work' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Work');
  });

  it('GET /api/tags returns items', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: INTERNAL_USER });
    vi.mocked(prisma.tag.findMany).mockResolvedValue([
      { id: '00000000-0000-4000-8000-000000000033', name: 'cafe', userId: null },
    ]);

    const res = await request(createApp()).get('/api/tags');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].name).toBe('cafe');
  });
});
