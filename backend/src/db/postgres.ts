import { Pool, PoolConfig } from 'pg';

export const createPostgresPool = (connectionString: string): Pool => {
  const config: PoolConfig = {
    connectionString,
    max: 10,
  };
  const pool = new Pool(config);
  return pool;
};

export const probePostgres = async (pool: Pool): Promise<boolean> => {
  try {
    await pool.query('select 1');
    return true;
  } catch {
    return false;
  }
};

