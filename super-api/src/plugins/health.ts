import { FastifyPluginAsync } from 'fastify';

const health: FastifyPluginAsync = async (f) => {
  f.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));
  // Expose metrics here so we avoid duplicate route registration
  f.get('/metrics', async (_req, res) => {
    res.header('Content-Type', 'text/plain');
    // rely on metrics plugin decorating the instance
    // @ts-ignore
    return f.metrics.registry.metrics();
  });
};
export default health;
