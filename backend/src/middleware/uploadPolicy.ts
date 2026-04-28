import type { Request } from 'express';
import { AppError } from './errorHandler.js';

const ALLOWED_PHOTO_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Optional `?contentType=` query on photo-upload: when present, restrict to
 * image types we intend to allow (preset on Cloudinary should match).
 */
export function assertAllowedPhotoContentType(req: Request): void {
  const raw = req.query.contentType;
  if (raw === undefined || raw === '') {
    return;
  }
  const value = Array.isArray(raw) ? raw[0] : raw;
  const ct = String(value).toLowerCase().trim();
  if (!ALLOWED_PHOTO_CONTENT_TYPES.has(ct)) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Unsupported content type for photo upload; allowed: ${[...ALLOWED_PHOTO_CONTENT_TYPES].join(', ')}`,
      400,
    );
  }
}
