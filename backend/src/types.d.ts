import 'fastify';
import type { KeyValueStore } from './kv';
import type { Db } from './db';

declare module 'fastify' {
  interface FastifyInstance {
    kv: KeyValueStore;
    db: Db;
  }
}

