import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import fs from 'node:fs';
import path from 'node:path';

function createServer() {
  const enableHttps = process.env.DEV_SSL === '1';
  const defaultKey = path.resolve(process.cwd(), 'certs/localhost-key.pem');
  const defaultCert = path.resolve(process.cwd(), 'certs/localhost.pem');
  const keyPath = process.env.DEV_SSL_KEY || defaultKey;
  const certPath = process.env.DEV_SSL_CERT || defaultCert;

  const httpsOptions =
    enableHttps && fs.existsSync(keyPath) && fs.existsSync(certPath)
      ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
      : undefined;

  return Fastify({ logger: true, ...(httpsOptions ? { https: httpsOptions } : {}) });
}

const server = createServer();
server.register(websocket);

server.get('/health', async () => {
  return { ok: true };
});

server.get('/ws', { websocket: true } as any, (connection: any /*, req */) => {
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
