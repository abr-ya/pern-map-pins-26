import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';

/** Contract-shaped error body per specs/001-map-world-points/contracts/openapi.yaml */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      code: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: { issues: err.issues },
    });
    return;
  }

  logger.error({ err, requestId: req.requestId }, 'unhandled error');
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}
