import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import promBundle from 'express-prom-bundle';
import { randomUUID } from 'crypto';
import helmet from 'helmet';
import { config } from './config';
import uploadsRouter from './routes/uploads';
import mediaRouter from './routes/media';
import thumbnailRouter from './routes/thumbnail';
import { ensureBucketExists } from './s3';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: false }));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
// Metrics
const metricsMiddleware = promBundle({ includeMethod: true, includePath: true, includeStatusCode: true, promClient: { collectDefaultMetrics: {} } });
app.use(metricsMiddleware);

// Structured JSON access logs
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const rid = req.header('x-request-id') || randomUUID();
  res.setHeader('x-request-id', rid);
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      time: new Date().toISOString(),
      level: 'info',
      service: 'media',
      request_id: rid,
      route: req.originalUrl,
      status: res.statusCode,
      latency_ms: duration
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(log));
  });
  next();
});

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

// Enforce HTTPS when behind a proxy in production
if (config.nodeEnv === 'production') {
  app.enable('trust proxy');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const proto = req.header('x-forwarded-proto');
    if (proto && proto !== 'https') {
      const host = req.header('x-forwarded-host') || req.header('host');
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    return next();
  });
}

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

