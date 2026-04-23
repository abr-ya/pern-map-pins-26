import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** OpenAPI YAML next to this file: `src/openapi/openapi.yaml` (copied to `dist/openapi` on build). */
function loadOpenApiSpec(): object {
  const specPath = path.join(__dirname, '..', 'openapi', 'openapi.yaml');
  const raw = readFileSync(specPath, 'utf8');
  return YAML.parse(raw) as object;
}

export function createDocsRouter(): Router | null {
  const enabled =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true';
  if (!enabled) {
    return null;
  }

  const spec = loadOpenApiSpec();
  const router = Router();
  router.use(swaggerUi.serve);
  router.get('/', swaggerUi.setup(spec));
  return router;
}
