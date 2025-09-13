import { Pool } from 'pg';

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL || 'postgres://app:app@localhost:5432/messaging';
    pool = new Pool({ connectionString: url, max: 10, idleTimeoutMillis: 30_000 });
  }
  return pool;
}

export async function withTransaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    throw e;
  } finally {
    client.release();
  }
}

