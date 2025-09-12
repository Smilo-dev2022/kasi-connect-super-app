import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { eventsRouter } from './routes/events';
import { rsvpsRouter } from './routes/rsvps';
import { startReminderScheduler } from './lib/reminderScheduler';

const app = express();
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

