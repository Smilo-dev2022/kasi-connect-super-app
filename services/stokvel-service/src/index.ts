import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import prom from 'prom-client';

import groupsRouter from './routes/groups';
import contributionsRouter from './routes/contributions';
import payoutsRouter from './routes/payouts';

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Prometheus metrics
const register = new prom.Registry();
prom.collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/groups', groupsRouter);
app.use('/contributions', contributionsRouter);
app.use('/payouts', payoutsRouter);

app.listen(port, () => {
  console.log(`Stokvel service listening at http://localhost:${port}`);
});
