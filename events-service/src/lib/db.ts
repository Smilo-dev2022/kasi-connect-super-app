import { Pool } from 'pg';

const connStr = process.env.EVENTS_DATABASE_URL || process.env.DATABASE_URL;
export const pool: Pool | null = connStr ? new Pool({ connectionString: connStr }) : null;

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  if (!pool) throw new Error('No database configured');
  const res = await pool.query<T>(text, params);
  return { rows: res.rows };
}

