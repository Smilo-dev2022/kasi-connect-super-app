import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import client from 'prom-client';
import { config } from './config';
import authRouter from './routes/auth';
import devicesRouter from './routes/devices';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Health endpoints (both legacy /healthz and standardized /health)
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, service: 'auth', version: '1.0.0' });
});
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, service: 'auth', version: '1.0.0' });
});

// Prometheus metrics
client.collectDefaultMetrics();
app.get('/metrics', async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

app.use('/auth', authRouter);
app.use('/devices', devicesRouter);

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

function start() {
  // Guardrails for production secrets
  if (config.nodeEnv === 'production') {
    if (!process.env.JWT_SECRET || config.jwtSecret === 'dev-secret-change-me') {
      // eslint-disable-next-line no-console
      console.error('JWT_SECRET must be set in production');
      process.exit(1);
    }
    if (!process.env.OTP_PEPPER || config.otpPepper === 'dev-otp-pepper-change-me') {
      // eslint-disable-next-line no-console
      console.error('OTP_PEPPER must be set in production');
      process.exit(1);
    }
    if (!process.env.REDIS_URL) {
      // eslint-disable-next-line no-console
      console.error('REDIS_URL must be set in production');
      process.exit(1);
    }
  }
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Auth service listening on http://localhost:${config.port}`);
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}

start();

export default app;

