import 'dotenv/config';
import { createApp } from './app.js';
import { logger } from './lib/logger.js';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const app = createApp();

app.listen(port, () => {
  logger.info({ port }, 'API listening');
});
