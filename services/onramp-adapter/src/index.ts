import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

import webhooksRouter from './routes/webhooks';

import payoutsRouter from './routes/payouts';
import onrampRouter from './routes/onramp';

app.use('/webhooks', webhooksRouter);
app.use('/payouts', payoutsRouter);
app.use('/onramp', onrampRouter);

app.listen(port, () => {
  console.log(`Onramp adapter listening at http://localhost:${port}`);
});
