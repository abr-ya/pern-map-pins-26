/**
 * Cloudinary smoke test.
 *
 * Verifies that the credentials and upload preset configured in
 * `backend/.env` are valid by performing a real signed upload of a
 * 1x1 transparent PNG, then deleting the uploaded resource so we
 * don't leave litter in the Media Library.
 *
 * Run from the repo root:
 *
 *     pnpm --filter backend exec tsx scripts/cloudinary-smoke.ts
 *
 * No external dependencies beyond what is already in
 * `backend/package.json` (`dotenv`).
 */

import 'dotenv/config';
import { createHash } from 'node:crypto';

type RequiredEnv =
  | 'CLOUDINARY_CLOUD_NAME'
  | 'CLOUDINARY_API_KEY'
  | 'CLOUDINARY_API_SECRET'
  | 'CLOUDINARY_UPLOAD_PRESET'
  | 'CLOUDINARY_UPLOAD_FOLDER';

const requiredVars: RequiredEnv[] = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CLOUDINARY_UPLOAD_PRESET',
  'CLOUDINARY_UPLOAD_FOLDER',
];

function readEnv(): Record<RequiredEnv, string> {
  const out = {} as Record<RequiredEnv, string>;
  const missing: string[] = [];
  for (const key of requiredVars) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else {
      out[key] = value;
    }
  }
  if (missing.length > 0) {
    console.error(
      `[FAIL] Missing env vars in backend/.env: ${missing.join(', ')}`,
    );
    process.exit(1);
  }
  return out;
}

function sha1Hex(input: string): string {
  return createHash('sha1').update(input).digest('hex');
}

/** Cloudinary signing: sha1 of alphabetically-sorted "k=v&k=v" + api_secret. */
function signParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return sha1Hex(toSign + apiSecret);
}

/** Minimal 1x1 transparent PNG (67 bytes). Public-domain test fixture. */
const ONE_PIXEL_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function uploadOnePixel(env: Record<RequiredEnv, string>): Promise<{
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
  folder: string | null;
}> {
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadFolder = env.CLOUDINARY_UPLOAD_FOLDER;
  // Signed uploads must include optional parameters in the signature.
  // Without a signed `folder`, Cloudinary may ignore the preset's asset folder
  // and land uploads at the cloud root (observed 2026-04-28).
  const paramsToSign: Record<string, string | number> = {
    folder: uploadFolder,
    timestamp,
    upload_preset: env.CLOUDINARY_UPLOAD_PRESET,
  };
  const signature = signParams(paramsToSign, env.CLOUDINARY_API_SECRET);

  const fileBuffer = Buffer.from(ONE_PIXEL_PNG_B64, 'base64');
  const fileBlob = new Blob([fileBuffer], { type: 'image/png' });

  const form = new FormData();
  form.append('file', fileBlob, 'smoke-1x1.png');
  form.append('api_key', env.CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('upload_preset', env.CLOUDINARY_UPLOAD_PRESET);
  form.append('folder', uploadFolder);

  const url = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  const res = await fetch(url, { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('[FAIL] Cloudinary upload rejected:');
    console.error(`  HTTP ${res.status} ${res.statusText}`);
    console.error(`  body:`, body);
    process.exit(1);
  }

  const publicId = (body as { public_id?: string }).public_id;
  const secureUrl = (body as { secure_url?: string }).secure_url;
  const bytes = (body as { bytes?: number }).bytes ?? 0;
  const format = (body as { format?: string }).format ?? '';
  const responseFolder = (body as { folder?: string }).folder ?? null;

  if (!publicId || !secureUrl) {
    console.error('[FAIL] Upload returned no public_id / secure_url:', body);
    process.exit(1);
  }

  const expectedPrefix = `${uploadFolder}/`;
  if (responseFolder !== uploadFolder && !publicId.startsWith(expectedPrefix)) {
    console.error('[FAIL] Upload did not land in CLOUDINARY_UPLOAD_FOLDER:');
    console.error(`  expected folder or public_id prefix: ${uploadFolder + '/'}`);
    console.error(`  response folder: ${responseFolder ?? '(none)'}`);
    console.error(`  public_id:       ${publicId}`);
    process.exit(1);
  }

  return { publicId, secureUrl, bytes, format, folder: responseFolder };
}

async function destroyResource(
  env: Record<RequiredEnv, string>,
  publicId: string,
): Promise<boolean> {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { public_id: publicId, timestamp };
  const signature = signParams(paramsToSign, env.CLOUDINARY_API_SECRET);

  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', env.CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);

  const url = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`;
  const res = await fetch(url, { method: 'POST', body: form });
  const body = (await res.json().catch(() => ({}))) as { result?: string };
  return res.ok && body.result === 'ok';
}

async function main(): Promise<void> {
  console.log('[1/4] Reading Cloudinary env vars from backend/.env');
  const env = readEnv();
  console.log(`      cloud_name      = ${env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`      api_key         = ${env.CLOUDINARY_API_KEY}`);
  console.log(
    `      api_secret      = ${env.CLOUDINARY_API_SECRET.slice(0, 4)}…${env.CLOUDINARY_API_SECRET.slice(-2)} (masked)`,
  );
  console.log(`      upload_preset   = ${env.CLOUDINARY_UPLOAD_PRESET}`);
  console.log(`      upload_folder   = ${env.CLOUDINARY_UPLOAD_FOLDER}`);

  console.log('\n[2/4] Uploading a 1x1 transparent PNG (signed)');
  const uploaded = await uploadOnePixel(env);
  console.log(`      public_id       = ${uploaded.publicId}`);
  console.log(`      folder          = ${uploaded.folder ?? '(none)'}`);
  console.log(`      format          = ${uploaded.format}`);
  console.log(`      bytes           = ${uploaded.bytes}`);
  console.log(`      secure_url      = ${uploaded.secureUrl}`);

  console.log(
    '\n[3/4] Verifying that the file is reachable via the public URL',
  );
  const head = await fetch(uploaded.secureUrl, { method: 'HEAD' });
  if (!head.ok) {
    console.error(
      `      [WARN] HEAD ${uploaded.secureUrl} returned ${head.status}`,
    );
  } else {
    console.log(
      `      HEAD ${head.status} ${head.statusText} — public delivery OK`,
    );
  }

  console.log('\n[4/4] Cleaning up: deleting the test resource');
  const destroyed = await destroyResource(env, uploaded.publicId);
  if (destroyed) {
    console.log('      destroy result = ok');
  } else {
    console.warn(
      '      [WARN] destroy did not confirm "ok"; check Media Library manually',
    );
  }

  console.log('\n[PASS] Cloudinary credentials and upload preset are working.');
}

main().catch((err) => {
  console.error('[FAIL] Smoke test threw an unexpected error:');
  console.error(err);
  process.exit(1);
});
