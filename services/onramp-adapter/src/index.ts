import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { register, totalRequests, requestLatency } from './lib/metrics';
import onrampRouter from './routes/onramp';
import webhooksRouter from './routes/webhooks';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Metrics middleware
app.use((req, res, next) => {
  const end = requestLatency.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => {
    totalRequests.inc({
      method: req.method,
      route: req.path,
      status_code: res.statusCode,
    });
    end();
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/onramp', onrampRouter);
app.use('/webhooks', webhooksRouter);

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.listen(port, () => {
  console.log(`Onramp adapter listening at http://localhost:${port}`);
});
