import type { Request, RequestHandler } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';

/**
 * Mount once at app level. Reads `Authorization: Bearer <clerk session JWT>`
 * (or Clerk session cookie) and attaches a Clerk auth state to the request.
 * Subsequent route handlers use {@link requireAuth} to enforce authentication
 * and {@link getClerkAuth} to read the Clerk user id.
 *
 * Requires `CLERK_SECRET_KEY` (and `CLERK_PUBLISHABLE_KEY`) in the
 * environment. We intentionally fail fast in production if the secret is
 * missing; in tests, `vi.stubEnv` can supply dummy values.
 */
export function clerkAuthMiddleware(): RequestHandler {
  if (!process.env.CLERK_SECRET_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CLERK_SECRET_KEY is required to mount Clerk middleware in production');
    }
  }
  return clerkMiddleware();
}

/**
 * 401 unauthorized when the request is unauthenticated. Use after
 * {@link clerkAuthMiddleware} is mounted on the app. Unlike Clerk's
 * deprecated `requireAuth()` (which redirects), this stays API-friendly:
 * a JSON body matching the `Error` schema in
 * `specs/001-map-world-points/contracts/openapi.yaml`.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }
  next();
};

/** Read the Clerk auth payload (`userId` is the Clerk user id, not internal users.id). */
export function getClerkAuth(req: Request): ReturnType<typeof getAuth> {
  return getAuth(req);
}

/** Same env gate as `app.ts` uses before mounting `clerkMiddleware`. */
export function isClerkAuthEnabled(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY?.trim()) && Boolean(process.env.CLERK_PUBLISHABLE_KEY?.trim());
}

/**
 * Clerk user id when middleware is mounted and the request has a session; otherwise `null`.
 * Call only when {@link isClerkAuthEnabled} is true — matches app boot order.
 */
export function getOptionalClerkUserId(req: Request): string | null {
  if (!isClerkAuthEnabled()) {
    return null;
  }
  const auth = getAuth(req);
  return auth.userId ?? null;
}
