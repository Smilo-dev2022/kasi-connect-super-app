import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient, TransactionType } from '@prisma/client';
import { z } from 'zod';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const prisma = new PrismaClient();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8081;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed'), false as any);
  },
  credentials: true,
}));
app.use(helmet());
app.use(express.json());
app.use(morgan(process.env.LOG_LEVEL || 'dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// --- Events compatibility routes ---
app.get('/api/events', async (_req, res) => {
  const events = await prisma.event.findMany({ orderBy: { startsAt: 'asc' } });
  res.json({ ok: true, events });
});

app.get('/api/events/:slug', async (req, res) => {
  const event = await prisma.event.findUnique({ where: { slug: req.params.slug } });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const rsvpCount = await prisma.rsvp.count({ where: { eventId: event.id } });
  res.json({ ok: true, event: { ...event, rsvp_count: rsvpCount } });
});

app.post('/api/events/:slug/rsvp', async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(1), email: z.string().email() }).parse(req.body);
    const event = await prisma.event.findUnique({ where: { slug: req.params.slug } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const existing = await prisma.rsvp.findFirst({ where: { eventId: event.id, email: body.email } });
    if (existing) {
      const ticket = await prisma.ticket.findFirst({ where: { rsvpId: existing.id } });
      return res.json({ ok: true, rsvp_id: existing.id, ticket_id: ticket?.id ?? null, token: ticket?.token ?? null });
    }
    const rsvp = await prisma.rsvp.create({ data: { eventId: event.id, name: body.name, email: body.email } });
    const ticket = await prisma.ticket.create({ data: { rsvpId: rsvp.id, token: crypto.randomUUID() } });
    res.status(201).json({ ok: true, rsvp_id: rsvp.id, ticket_id: ticket.id, token: ticket.token });
  } catch (err) {
    next(err);
  }
});

app.get('/api/tickets/:ticketId', async (req, res) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.ticketId } });
  if (!ticket) return res.status(404).json({ ok: false, error: 'ticket_not_found' });
  const rsvp = await prisma.rsvp.findUnique({ where: { id: ticket.rsvpId } });
  const event = rsvp ? await prisma.event.findUnique({ where: { id: rsvp.eventId } }) : null;
  res.json({ ok: true, ticket, rsvp, event });
});

app.get('/checkin/verify', async (req, res) => {
  const token = (req.query.token as string) || '';
  const ticket = await prisma.ticket.findFirst({ where: { token } });
  if (!ticket) return res.status(404).json({ ok: false, error: 'ticket_not_found' });
  const rsvp = await prisma.rsvp.findUnique({ where: { id: ticket.rsvpId } });
  const event = rsvp ? await prisma.event.findUnique({ where: { id: rsvp.eventId } }) : null;
  res.json({ ok: true, ticket, rsvp, event });
});

app.post('/checkin', async (req, res) => {
  const token = (req.body?.token as string) || (req.query.token as string) || '';
  const ticket = await prisma.ticket.findFirst({ where: { token } });
  if (!ticket) return res.status(404).json({ ok: false, error: 'ticket_not_found' });
  if (ticket.checkedInAt) return res.json({ ok: true, ticketId: ticket.id, already: true, checkedInAt: ticket.checkedInAt });
  const updated = await prisma.ticket.update({ where: { id: ticket.id }, data: { checkedInAt: new Date(), status: 'used' } });
  res.json({ ok: true, ticketId: updated.id, already: false, checkedInAt: updated.checkedInAt });
});

// --- Wallet: balances and CSV endpoints ---
app.get('/api/mobile/balance/:userId', async (req, res) => {
  const userId = req.params.userId;
  const account = await prisma.account.findFirst({ where: { userId } });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.json({ balance: account.balance, currency: account.currency, accountId: account.id });
});

app.get('/api/wallet/:accountId/transactions.csv', async (req, res) => {
  const accountId = req.params.accountId;
  const txs = await prisma.transaction.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' } });
  const header = 'id,amount,type,description,balance_after,created_at';
  const lines = txs.map(t => [t.id, t.amount, t.type, (t.description || '').replace(/,/g, ' '), t.balanceAfter, t.createdAt.toISOString()].join(','));
  const csv = [header, ...lines].join('\n') + '\n';
  res.type('text/csv').send(csv);
});

app.post('/api/transactions', async (req, res, next) => {
  try {
    const body = z.object({ accountId: z.string(), amount: z.number(), type: z.enum(['CREDIT', 'DEBIT']), description: z.string().optional() }).parse(req.body);
    const account = await prisma.account.findUnique({ where: { id: body.accountId } });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (body.type === 'DEBIT' && account.balance < body.amount) return res.status(400).json({ error: 'Insufficient funds' });
    const newBalance = body.type === 'CREDIT' ? account.balance + body.amount : account.balance - body.amount;
    const tx = await prisma.transaction.create({ data: { accountId: body.accountId, amount: body.amount, type: body.type as TransactionType, description: body.description, balanceAfter: newBalance } });
    await prisma.account.update({ where: { id: body.accountId }, data: { balance: newBalance } });
    io.emit('wallet:transaction', { accountId: body.accountId, tx });
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
});

io.on('connection', (socket) => {
  socket.on('join:account', (accountId: string) => {
    socket.join(`acct:${accountId}`);
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`super-api listening on http://localhost:${PORT}`);
});
