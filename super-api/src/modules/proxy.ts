import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

// Lightweight reverse proxy module to unify downstream services behind Super API
// Routes:
// - /api/wallet -> wallet-service
// - /api/media  -> media service
// - /api/search -> search service
// - /api/mod    -> moderation service
// - /api/msg    -> agent7-messaging (temporary until folded)
// - /api/events -> events service (python)

const DEFAULTS = {
  wallet: process.env.WALLET_URL || 'http://wallet:3000',
  media: process.env.MEDIA_URL || 'http://media:4008',
  search: process.env.SEARCH_URL || 'http://search:4009',
  moderation: process.env.MODERATION_URL || 'http://moderation:8002',
  messaging: process.env.MESSAGING_URL || 'http://agent7-messaging:8080',
  events: process.env.EVENTS_URL || 'http://events_py:8001',
};

export default fp(async function proxyModule(app: FastifyInstance) {
  const httpProxy = (await import('@fastify/http-proxy')).default as any;

  // Wallet API
  await app.register(httpProxy, {
    upstream: DEFAULTS.wallet,
    prefix: '/api/wallet',
    rewritePrefix: '/api',
  });

  // Media API
  await app.register(httpProxy, {
    upstream: DEFAULTS.media,
    prefix: '/api/media',
    rewritePrefix: '/',
  });

  // Search API
  await app.register(httpProxy, {
    upstream: DEFAULTS.search,
    prefix: '/api/search',
    rewritePrefix: '/',
  });

  // Moderation API
  await app.register(httpProxy, {
    upstream: DEFAULTS.moderation,
    prefix: '/api/mod',
    rewritePrefix: '/api',
  });

  // Messaging API (temporary passthrough)
  await app.register(httpProxy, {
    upstream: DEFAULTS.messaging,
    prefix: '/api/msg',
    rewritePrefix: '/',
  });

  // Events API (python service)
  await app.register(httpProxy, {
    upstream: DEFAULTS.events,
    prefix: '/api/events',
    rewritePrefix: '/api',
  });
});
