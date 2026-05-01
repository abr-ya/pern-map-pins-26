import cors from 'cors';
import express from 'express';
import { clerkAuthMiddleware } from './middleware/clerkAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { createDocsRouter } from './routes/docs.js';
import { foldersRouter } from './routes/folders.js';
import { groupsRouter } from './routes/groups.js';
import { healthRouter } from './routes/health.js';
import { mapRouter } from './routes/map.js';
import { meRouter } from './routes/me.js';
import { pointsRouter } from './routes/points.js';
import { publicRouter } from './routes/public.js';
import { tagsRouter } from './routes/tags.js';
import { webhooksRouter } from './routes/webhooks.js';

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  app.use(requestId);
  app.use(
    cors({
      origin: frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(requestLogger);
  if (process.env.CLERK_SECRET_KEY) {
    app.use(clerkAuthMiddleware());
  }
  app.use('/api', healthRouter);
  app.use('/api', publicRouter);
  app.use('/api', webhooksRouter);
  app.use('/api', meRouter);
  app.use('/api', groupsRouter);
  app.use('/api', mapRouter);
  app.use('/api', foldersRouter);
  app.use('/api', tagsRouter);
  app.use('/api', pointsRouter);

  const docs = createDocsRouter();
  if (docs) {
    app.use('/api/docs', docs);
  }

  app.use((_req, res) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Not found' });
  });
  app.use(errorHandler);
  return app;
}
