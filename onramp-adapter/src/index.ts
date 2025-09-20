import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { requestDuration, getMetrics, collectDefaultMetrics } from './metrics';

dotenv.config();

const app = express();
const port = process.env.PORT || 4015;

// Add request ID
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});

morgan.token('id', (req) => req.id);
app.use(morgan('[:date[clf]] :id :method :url :status :response-time ms - :res[content-length]'));

app.use(cors());
app.use(express.json());

// Metrics middleware
app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    end({ route: req.path, code: res.statusCode, method: req.method });
  });
  next();
});


import onrampRouter from './routes/onramp';

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'onramp-adapter' });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', collectDefaultMetrics);
  res.end(await getMetrics());
});

// Mount the onramp routes
app.use('/onramp', onrampRouter);

app.listen(port, () => {
  console.log(`Onramp adapter service listening on port ${port}`);
});

// Add type definition for request ID
declare global {
  namespace Express {
    export interface Request {
      id: string;
    }
  }
}
