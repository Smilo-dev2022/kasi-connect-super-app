import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import uploadsRouter from './routes/uploads';
import mediaRouter from './routes/media';
import thumbnailRouter from './routes/thumbnail';
import { ensureBucketExists } from './s3';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, service: 'media', version: '1.0.0' });
});

app.use('/uploads', uploadsRouter);
app.use('/media', mediaRouter);
app.use('/thumb', thumbnailRouter);

// Not found handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  if (config.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.error('Error:', err);
  }
  res.status(statusCode).json({ error: message });
});

function start() {
  ensureBucketExists().catch((err) => {
    // eslint-disable-next-line no-console
    console.warn('Bucket ensure failed (continuing):', err?.message || err);
  }).finally(() => {
    const server = app.listen(config.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Media service listening on http://localhost:${config.port}`);
    });

    process.on('SIGINT', () => {
      server.close(() => process.exit(0));
    });

    process.on('SIGTERM', () => {
      server.close(() => process.exit(0));
    });
  });
}

start();

export default app;

