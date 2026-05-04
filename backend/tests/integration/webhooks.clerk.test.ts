import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const verifyWebhookMock = vi.fn();
const upsertMock = vi.fn();
const deleteManyMock = vi.fn();

vi.mock('@clerk/express/webhooks', () => ({
  verifyWebhook: (...args: unknown[]) => verifyWebhookMock(...args),
}));

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: {
      upsert: (...args: unknown[]) => upsertMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
    },
    point: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

/**
 * T035 — Clerk webhook endpoint upserts internal users on valid signatures
 * and refuses anything that does not pass `verifyWebhook` (mocked here so
 * we don't need real Svix headers in unit tests).
 */
describe('POST /api/webhooks/clerk (T035)', () => {
  beforeEach(() => {
    verifyWebhookMock.mockReset();
    upsertMock.mockReset();
    deleteManyMock.mockReset();
    vi.stubEnv('CLERK_WEBHOOK_SECRET', 'whsec_dummy_for_tests');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('upserts a user on user.created and returns 200', async () => {
    verifyWebhookMock.mockResolvedValue({
      type: 'user.created',
      data: {
        id: 'user_clerk_123',
        first_name: 'Ada',
        last_name: 'Lovelace',
        email_addresses: [{ email_address: 'ada@example.com' }],
      },
    });
    upsertMock.mockResolvedValue({});
    const { createApp } = await import('../../src/app.js');
    const res = await request(createApp())
      .post('/api/webhooks/clerk')
      .send({ ignored: 'payload-replaced-by-mock' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ received: true, type: 'user.created', clerkId: 'user_clerk_123' });
    expect(upsertMock).toHaveBeenCalledWith({
      where: { clerkId: 'user_clerk_123' },
      create: { clerkId: 'user_clerk_123', displayName: 'Ada Lovelace' },
      update: { displayName: 'Ada Lovelace' },
    });
  });

  it('updates an existing user on user.updated', async () => {
    verifyWebhookMock.mockResolvedValue({
      type: 'user.updated',
      data: { id: 'user_clerk_123', first_name: 'Ada-Renamed' },
    });
    upsertMock.mockResolvedValue({});
    const { createApp } = await import('../../src/app.js');
    const res = await request(createApp()).post('/api/webhooks/clerk').send({});
    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });

  it('deletes a user on user.deleted', async () => {
    verifyWebhookMock.mockResolvedValue({ type: 'user.deleted', data: { id: 'user_clerk_123' } });
    deleteManyMock.mockResolvedValue({ count: 1 });
    const { createApp } = await import('../../src/app.js');
    const res = await request(createApp()).post('/api/webhooks/clerk').send({});
    expect(res.status).toBe(200);
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { clerkId: 'user_clerk_123' } });
  });

  it('returns 400 when verifyWebhook throws (invalid signature) and does not write to DB', async () => {
    verifyWebhookMock.mockRejectedValue(new Error('Invalid signature'));
    const { createApp } = await import('../../src/app.js');
    const res = await request(createApp())
      .post('/api/webhooks/clerk')
      .set('svix-signature', 'bad')
      .send({ type: 'user.created', data: { id: 'x' } });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('WEBHOOK_INVALID');
    expect(upsertMock).not.toHaveBeenCalled();
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it('returns 500 if CLERK_WEBHOOK_SECRET is missing', async () => {
    vi.unstubAllEnvs();
    const { createApp } = await import('../../src/app.js');
    const res = await request(createApp()).post('/api/webhooks/clerk').send({});
    expect(res.status).toBe(500);
    expect(res.body.code).toBe('WEBHOOK_NOT_CONFIGURED');
    expect(verifyWebhookMock).not.toHaveBeenCalled();
  });

  it('ignores unknown event types with 200', async () => {
    verifyWebhookMock.mockResolvedValue({ type: 'session.created', data: { id: 'sess_1' } });
    const { createApp } = await import('../../src/app.js');
    const res = await request(createApp()).post('/api/webhooks/clerk').send({});
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ received: true, ignored: true, type: 'session.created' });
    expect(upsertMock).not.toHaveBeenCalled();
    expect(deleteManyMock).not.toHaveBeenCalled();
  });
});
