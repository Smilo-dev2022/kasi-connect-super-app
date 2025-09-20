import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import prom from 'prom-client';

import vendorsRouter from './routes/vendors';
import ordersRouter from './routes/orders';

const app = express();
const port = process.env.PORT || 3004;

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

app.use('/vendors', vendorsRouter);
app.use('/orders', ordersRouter);

app.listen(port, () => {
  console.log(`Business hub service listening at http://localhost:${port}`);
});
