import 'dotenv/config';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';

const server = Fastify({ logger: true });
server.register(websocket);

server.get('/health', async () => {
  return { ok: true };
});

server.get('/ws', { websocket: true }, (connection /*, req */) => {
  connection.socket.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
  connection.socket.on('message', (raw: unknown) => {
    try {
      const message = JSON.parse(String(raw));
      auditLog.push({ ts: Date.now(), action: 'ws.message', meta: { length: String(raw).length } });
      if (auditLog.length > auditLogMax) auditLog.shift();
      // TODO: route to messaging service once implemented
      connection.socket.send(
        JSON.stringify({ type: 'echo', received: message, ts: Date.now() })
      );
    } catch {
      connection.socket.send(JSON.stringify({ type: 'error', error: 'Bad JSON' }));
    }
  });
});

// Simple in-memory audit log for session and admin events (dev only)
type AuditEvent = { ts: number; ip?: string; userId?: string; action: string; meta?: Record<string, unknown> };
const auditLog: AuditEvent[] = [];
const auditLogMax = Number(process.env.AUDIT_LOG_MAX || 1000);

// Minimal session logging middleware
server.addHook('onRequest', async (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (forwardedProto && forwardedProto !== 'https') {
    req.log.warn({ forwardedProto }, 'insecure proto via proxy');
  }
});

server.post('/_audit', async (req, res) => {
  if (process.env.ENABLE_AUDIT_ENDPOINT !== '1') return res.status(404).send();
  const ip = req.ip;
  const body = (req.body as any) || {};
  const evt: AuditEvent = { ts: Date.now(), ip, userId: body.userId, action: body.action || 'unknown', meta: body.meta };
  auditLog.push(evt);
  if (auditLog.length > auditLogMax) auditLog.shift();
  return { ok: true };
});

server.get('/_audit', async (req, res) => {
  if (process.env.ENABLE_AUDIT_ENDPOINT !== '1') return res.status(404).send();
  return { ok: true, events: auditLog };
});

async function start() {
  const port = Number(process.env.BACKEND_PORT || process.env.PORT || 4000);
  const host = process.env.BACKEND_HOST || process.env.HOST || '0.0.0.0';
  try {
    await server.listen({ port, host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
