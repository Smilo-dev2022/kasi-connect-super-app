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
