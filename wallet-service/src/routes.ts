import { Express } from 'express';
import { accountsRouter } from './routes/accounts.js';
import { transactionsRouter } from './routes/transactions.js';
import { sseRouter } from './routes/sse.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

export function registerRoutes(app: Express): void {
  app.use('/api/accounts', accountsRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/stream', sseRouter);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

