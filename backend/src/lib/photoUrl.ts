/**
 * Public GET URL for a stored R2 `photoKey`, or `null` when there is no image
 * or `R2_PUBLIC_BASE_URL` is not configured.
 */
export function buildPhotoUrl(photoKey: string | null | undefined): string | null {
  if (!photoKey) {
    return null;
  }
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? '';
  if (!base) {
    return null;
  }
  const key = photoKey.replace(/^\//, '');
  return `${base}/${key}`;
}
