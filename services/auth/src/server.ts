import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { ensureRedisConnected, quitRedis } from './redis';
import otpRouter from './routes/otp';
import authRouter from './routes/auth';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, service: 'auth', version: '1.0.0' });
});

app.use('/otp', otpRouter);
app.use('/auth', authRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

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

async function start() {
  await ensureRedisConnected().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Redis connect error:', err?.message || err);
  });

  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Auth service listening on http://localhost:${config.port}`);
  });

  process.on('SIGINT', () => {
    server.close(async () => {
      await quitRedis();
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    server.close(async () => {
      await quitRedis();
      process.exit(0);
    });
  });
}

start();

export default app;

