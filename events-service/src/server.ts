import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { eventsRouter } from './routes/events';
import { rsvpsRouter } from './routes/rsvps';
import { startReminderScheduler } from './lib/reminderScheduler';

const app = express();
// Trust reverse proxy (so req.secure works with X-Forwarded-Proto)
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Enforce HTTPS in production if enabled
const enforceHttps = (process.env.ENFORCE_HTTPS || 'false').toLowerCase() === 'true';
if (enforceHttps) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
    // Preserve host from proxy
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
    return res.redirect(308, `https://${host}${req.originalUrl}`);
  });
}
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/events', eventsRouter);
app.use('/api/rsvps', rsvpsRouter);

app.use(express.static(path.join(__dirname, '..', 'public')));

// Simple error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Events service listening on http://localhost:${PORT}`);
  startReminderScheduler();
});

