import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { z } from 'zod';
import {
  listGroupWallets,
  createGroupWallet,
  getGroupWallet,
  addLedgerEntry,
  contribute,
} from './wallets';

type HttpError = { statusCode: number; message: string };

const server = Fastify({ logger: true });
server.register(websocket);
server.register(cors, { origin: true });

server.get('/health', async () => {
  return { ok: true };
});

server.get('/ws', { websocket: true }, (connection /*, req */) => {
  connection.socket.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
  connection.socket.on('message', (raw: unknown) => {
    try {
      const message = JSON.parse(String(raw));
      // TODO: route to messaging service once implemented
      connection.socket.send(
        JSON.stringify({ type: 'echo', received: message, ts: Date.now() })
      );
    } catch {
      connection.socket.send(JSON.stringify({ type: 'error', error: 'Bad JSON' }));
    }
  });
});

// Wallets API
server.get('/wallets', async () => {
  const wallets = await listGroupWallets();
  return { wallets };
});

server.post('/wallets', async (req: FastifyRequest, reply: FastifyReply) => {
  const bodySchema = z.object({ name: z.string().min(1), members: z.array(z.string()).optional() });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
  }
  const wallet = await createGroupWallet({ name: parsed.data.name, members: parsed.data.members });
  return reply.code(201).send({ wallet });
});

server.get('/wallets/:id', async (req: FastifyRequest, reply: FastifyReply) => {
  const params = z.object({ id: z.string().min(1) }).parse((req as any).params);
  const result = await getGroupWallet(params.id);
  if (!result) return reply.code(404).send({ error: 'wallet_not_found' });
  return result;
});

server.get('/wallets/:id/ledger', async (req: FastifyRequest, reply: FastifyReply) => {
  const params = z.object({ id: z.string().min(1) }).parse((req as any).params);
  const result = await getGroupWallet(params.id);
  if (!result) return reply.code(404).send({ error: 'wallet_not_found' });
  return { ledger: result.ledger };
});

server.post('/wallets/:id/ledger', async (req: FastifyRequest, reply: FastifyReply) => {
  const params = z.object({ id: z.string().min(1) }).parse((req as any).params);
  const bodySchema = z.object({
    type: z.enum(['contribution', 'payout', 'expense', 'adjustment', 'transfer']),
    amount: z.number(),
    member: z.string().optional(),
    note: z.string().optional(),
  });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
  try {
    const result = await addLedgerEntry(params.id, parsed.data);
    if (!result) return reply.code(404).send({ error: 'wallet_not_found' });
    return reply.code(201).send(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error';
    return reply.code(400).send({ error: msg });
  }
});

server.post('/wallets/:id/contribute', async (req: FastifyRequest, reply: FastifyReply) => {
  const params = z.object({ id: z.string().min(1) }).parse((req as any).params);
  const bodySchema = z.object({ amount: z.number(), member: z.string(), note: z.string().optional() });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'invalid_body', details: parsed.error.flatten() });
  try {
    const result = await contribute(params.id, parsed.data);
    if (!result) return reply.code(404).send({ error: 'wallet_not_found' });
    return reply.code(201).send(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error';
    return reply.code(400).send({ error: msg });
  }
});

// KYC Sandbox stubs
type KycStatus = 'created' | 'pending' | 'verified' | 'rejected';
type KycSession = { id: string; status: KycStatus; createdAt: number };
const kycSessions = new Map<string, KycSession>();

server.get('/kyc/providers', async () => {
  return { providers: [{ id: 'sandbox', name: 'Sandbox KYC', methods: ['id_number', 'selfie'] }] };
});

server.post('/kyc/session', async () => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sess: KycSession = { id, status: 'created', createdAt: Date.now() };
  kycSessions.set(id, sess);
  return { sessionId: id, redirectUrl: `https://kyc-sandbox.local/session/${id}` };
});

server.get('/kyc/status/:id', async (req: FastifyRequest, reply: FastifyReply) => {
  const params = z.object({ id: z.string().min(1) }).parse((req as any).params);
  const sess = kycSessions.get(params.id);
  if (!sess) return reply.code(404).send({ error: 'not_found' });
  return { sessionId: sess.id, status: sess.status };
});

server.post('/kyc/session/:id/complete', async (req: FastifyRequest, reply: FastifyReply) => {
  const params = z.object({ id: z.string().min(1) }).parse((req as any).params);
  const query = z.object({ status: z.enum(['verified', 'rejected']).default('verified') }).parse((req as any).query);
  const sess = kycSessions.get(params.id);
  if (!sess) return reply.code(404).send({ error: 'not_found' });
  sess.status = query.status;
  kycSessions.set(sess.id, sess);
  return { ok: true, sessionId: sess.id, status: sess.status };
});

async function start() {
  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || '0.0.0.0';
  try {
    await server.listen({ port, host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
