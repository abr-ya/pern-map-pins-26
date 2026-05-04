import { type IRouter, Router } from 'express';
import { verifyWebhook } from '@clerk/express/webhooks';
import { logger } from '../lib/logger.js';
import { applyClerkWebhookEvent } from '../services/userSyncService.js';

/**
 * Clerk → backend user sync webhook.
 *
 * Verifies the Svix signature using `CLERK_WEBHOOK_SECRET` and applies the
 * event via {@link applyClerkWebhookEvent}. Invalid signatures or missing
 * secret return 400 without touching the database.
 *
 * @see specs/001-map-world-points/contracts/openapi.yaml#/paths/~1webhooks~1clerk
 */
export const webhooksRouter: IRouter = Router();

webhooksRouter.post('/webhooks/clerk', async (req, res) => {
  const signingSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!signingSecret) {
    logger.warn({ requestId: req.requestId }, 'CLERK_WEBHOOK_SECRET not configured');
    res.status(500).json({ code: 'WEBHOOK_NOT_CONFIGURED', message: 'Webhook secret not configured' });
    return;
  }
  try {
    const event = await verifyWebhook(req, { signingSecret });
    const result = await applyClerkWebhookEvent(event);
    res.status(200).json({ received: true, ...result });
  } catch (err) {
    logger.warn({ err, requestId: req.requestId }, 'Clerk webhook verification failed');
    res.status(400).json({ code: 'WEBHOOK_INVALID', message: 'Invalid webhook signature or payload' });
  }
});
