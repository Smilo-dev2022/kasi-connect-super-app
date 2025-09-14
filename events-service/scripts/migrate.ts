import { readFileSync } from 'fs';
import path from 'path';
import { Client } from 'pg';

async function main() {
  const databaseUrl = process.env.EVENTS_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('EVENTS_DATABASE_URL or DATABASE_URL must be set');
    process.exit(1);
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    await client.query(sql);
    console.log('[events-service] migrations applied');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

