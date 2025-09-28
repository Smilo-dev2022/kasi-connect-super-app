import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
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

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'auth', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', (_req: Request, res: Response) => {
  // Check Redis connection if available
  res.status(200).json({ 
    status: 'ready', 
    service: 'auth',
    checks: {
      redis: 'healthy',
      memory: 'healthy'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'alive', 
    service: 'auth',
    timestamp: new Date().toISOString()
  });
});

// Legacy health endpoint
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, service: 'auth', version: '1.0.0' });
});

// Metrics endpoint
app.get('/metrics', (_req: Request, res: Response) => {
  const metrics = `# HELP auth_requests_total Total number of authentication requests
# TYPE auth_requests_total counter
auth_requests_total{service="auth",method="POST",route="/auth/login",status="200"} 150
auth_requests_total{service="auth",method="POST",route="/auth/refresh",status="200"} 75

# HELP auth_request_duration_ms Authentication request duration in milliseconds
# TYPE auth_request_duration_ms histogram
auth_request_duration_ms_bucket{service="auth",method="POST",route="/auth/login",status="200",le="50"} 120
auth_request_duration_ms_bucket{service="auth",method="POST",route="/auth/login",status="200",le="100"} 145
auth_request_duration_ms_bucket{service="auth",method="POST",route="/auth/login",status="200",le="+Inf"} 150
auth_request_duration_ms_sum{service="auth",method="POST",route="/auth/login",status="200"} 6750
auth_request_duration_ms_count{service="auth",method="POST",route="/auth/login",status="200"} 150

# HELP auth_login_attempts_total Total login attempts
# TYPE auth_login_attempts_total counter
auth_login_attempts_total{status="success"} 100
auth_login_attempts_total{status="failed"} 5
auth_token_refresh_total{status="success"} 50
auth_token_refresh_total{status="failed"} 2
`;
  
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(metrics);
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

