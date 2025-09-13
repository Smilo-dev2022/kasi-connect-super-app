import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { registerRoutes } from './routes.js';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

registerRoutes(app);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`wallet service listening on :${port}`);
});

