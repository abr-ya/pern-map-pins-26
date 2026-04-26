import type { WebhookEvent } from '@clerk/backend/webhooks';
import { prisma } from '../lib/prisma.js';

/**
 * Build a human display name from a Clerk `user.created` / `user.updated`
 * event payload, falling back to email local-part or `User <id>`.
 */
export function deriveDisplayName(data: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email_addresses?: Array<{ email_address?: string }>;
  id: string;
}): string {
  const first = data.first_name?.trim() ?? '';
  const last = data.last_name?.trim() ?? '';
  const composed = [first, last].filter(Boolean).join(' ').trim();
  if (composed) return composed;
  if (data.username && data.username.trim()) return data.username.trim();
  const email = data.email_addresses?.[0]?.email_address;
  if (email) {
    const local = email.split('@')[0];
    if (local) return local;
  }
  return `User ${data.id.slice(-8)}`;
}

export interface UpsertResult {
  ignored: boolean;
  type: WebhookEvent['type'];
  clerkId?: string;
}

/**
 * Apply a verified Clerk webhook event to internal `users`.
 * Handles `user.created` / `user.updated` (upsert) and `user.deleted` (delete).
 * Other event types are intentionally ignored (returned as `ignored: true`).
 */
export async function applyClerkWebhookEvent(evt: WebhookEvent): Promise<UpsertResult> {
  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const data = evt.data as {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      username?: string | null;
      email_addresses?: Array<{ email_address?: string }>;
    };
    const displayName = deriveDisplayName(data);
    await prisma.user.upsert({
      where: { clerkId: data.id },
      create: { clerkId: data.id, displayName },
      update: { displayName },
    });
    return { ignored: false, type: evt.type, clerkId: data.id };
  }

  if (evt.type === 'user.deleted') {
    const data = evt.data as { id?: string };
    if (data.id) {
      await prisma.user.deleteMany({ where: { clerkId: data.id } });
      return { ignored: false, type: evt.type, clerkId: data.id };
    }
  }

  return { ignored: true, type: evt.type };
}
