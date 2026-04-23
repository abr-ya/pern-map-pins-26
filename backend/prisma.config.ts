/**
 * Prisma ORM 7: connection URL for `migrate`, `db push`, `studio` — not in schema.prisma.
 * @see https://pris.ly/d/config-datasource
 */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
