import { createHash } from 'node:crypto';
import { AppError } from '../middleware/errorHandler.js';

/** Response shape for `POST /api/points/{pointId}/photo-upload` (OpenAPI `PhotoUpload`). */
export type PhotoUploadPayload = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  uploadPreset: string;
  cloudName: string;
  folder: string;
  photoKey: string;
};

function sha1Hex(input: string): string {
  return createHash('sha1').update(input).digest('hex');
}

/** Cloudinary upload signing: SHA-1 hex of sorted `k=v&…` + api_secret. */
export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return sha1Hex(toSign + apiSecret);
}

function readCloudinaryEnv(): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
  uploadFolder: string;
} {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? '';
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() ?? '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() ?? '';
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() ?? '';
  const uploadFolder =
    process.env.CLOUDINARY_UPLOAD_FOLDER?.trim().replace(/\/+$/, '') ?? '';

  if (!cloudName || !apiKey || !apiSecret || !uploadPreset || !uploadFolder) {
    throw new AppError(
      'CLOUDINARY_NOT_CONFIGURED',
      'Photo uploads are not configured on this server',
      503,
    );
  }

  return { cloudName, apiKey, apiSecret, uploadPreset, uploadFolder };
}

/**
 * Build signed direct-upload fields for one point image.
 * Uses `folder` = `CLOUDINARY_UPLOAD_FOLDER` and `public_id` = point UUID so
 * the stored `photo_key` is `{folder}/{pointId}` (Cloudinary `public_id`).
 */
export function buildSignedPointPhotoUpload(pointId: string): PhotoUploadPayload {
  const { cloudName, apiKey, apiSecret, uploadPreset, uploadFolder } = readCloudinaryEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = uploadFolder;
  const public_id = pointId;

  const paramsToSign: Record<string, string | number> = {
    folder,
    public_id,
    timestamp,
    upload_preset: uploadPreset,
  };

  const signature = signCloudinaryParams(paramsToSign, apiSecret);
  const photoKey = `${folder}/${public_id}`;

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    apiKey,
    timestamp,
    signature,
    uploadPreset,
    cloudName,
    folder,
    photoKey,
  };
}
