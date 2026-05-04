import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** This file lives in `src/` (dev) or `dist/` (prod); `.env` is always the parent directory. */
const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

config({ path: path.join(backendRoot, '.env') });
