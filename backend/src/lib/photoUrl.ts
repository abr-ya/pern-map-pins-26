/**
 * Public delivery URL for a stored Cloudinary `public_id` in `points.photo_key`.
 *
 * Uses `CLOUDINARY_CLOUD_NAME` and `f_auto,q_auto` in the delivery URL (no file
 * extension required on the stored key). If `CLOUDINARY_CLOUD_NAME` is unset,
 * returns `null` (see `docs/object-storage-alternatives.md` — R2 was evaluated
 * but not adopted for this repo).
 */
export function buildPhotoUrl(photoKey: string | null | undefined): string | null {
  if (!photoKey) {
    return null;
  }
  const key = photoKey.replace(/^\//, '');

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.replace(/\/$/, '') ?? '';
  if (cloudName) {
    const encoded = key.split('/').map(encodeURIComponent).join('/');
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${encoded}`;
  }

  return null;
}
