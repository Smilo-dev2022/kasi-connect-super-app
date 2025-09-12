import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.MESSAGING_PORT ? parseInt(process.env.MESSAGING_PORT, 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 4002);
const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_change_me';

// DB setup
const db = new Database('data.db');
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    deviceId TEXT NOT NULL,
    identityKey TEXT NOT NULL,
    signedPreKeyId INTEGER NOT NULL,
    signedPreKey TEXT NOT NULL,
    signedPreKeySignature TEXT NOT NULL,
    registrationId INTEGER NOT NULL,
    createdAt INTEGER NOT NULL
  );
`);
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_user_device ON devices(userId, deviceId);
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS prekeys (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    deviceId TEXT NOT NULL,
    keyId INTEGER NOT NULL,
    publicKey TEXT NOT NULL,
    isUsed INTEGER NOT NULL DEFAULT 0
  );
`);
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_prekeys_user_device ON prekeys(userId, deviceId);
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    senderUserId TEXT NOT NULL,
    recipientUserId TEXT NOT NULL,
    recipientDeviceId TEXT,
    ciphertext TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );
`);

function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    (req as any).userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

const registerBody = z.object({
  deviceId: z.string().min(1),
  registrationId: z.number().int().nonnegative(),
  identityKey: z.string().min(10),
  signedPreKey: z.object({ keyId: z.number().int(), publicKey: z.string().min(10), signature: z.string().min(10) }),
  oneTimePreKeys: z.array(z.object({ keyId: z.number().int(), publicKey: z.string().min(10) })).min(1)
});

app.post('/devices/register', authenticate, (req: Request, res: Response) => {
  const parsed = registerBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });
  const userId = (req as any).userId as string;
  const { deviceId, registrationId, identityKey, signedPreKey, oneTimePreKeys } = parsed.data;

  const upsert = db.prepare(`
    INSERT INTO devices (id, userId, deviceId, identityKey, signedPreKeyId, signedPreKey, signedPreKeySignature, registrationId, createdAt)
    VALUES (@id, @userId, @deviceId, @identityKey, @signedPreKeyId, @signedPreKey, @signedPreKeySignature, @registrationId, @createdAt)
    ON CONFLICT(id) DO UPDATE SET
      identityKey=excluded.identityKey,
      signedPreKeyId=excluded.signedPreKeyId,
      signedPreKey=excluded.signedPreKey,
      signedPreKeySignature=excluded.signedPreKeySignature,
      registrationId=excluded.registrationId
  `);
  const deviceRow = {
    id: `${userId}:${deviceId}`,
    userId,
    deviceId,
    identityKey,
    signedPreKeyId: signedPreKey.keyId,
    signedPreKey: signedPreKey.publicKey,
    signedPreKeySignature: signedPreKey.signature,
    registrationId,
    createdAt: Date.now()
  };
  upsert.run(deviceRow);

  const insertPrekey = db.prepare(`
    INSERT OR REPLACE INTO prekeys (id, userId, deviceId, keyId, publicKey, isUsed)
    VALUES (@id, @userId, @deviceId, @keyId, @publicKey, COALESCE((SELECT isUsed FROM prekeys WHERE id=@id), 0))
  `);
  const tx = db.transaction((keys: { keyId: number; publicKey: string }[]) => {
    for (const k of keys) {
      insertPrekey.run({ id: `${userId}:${deviceId}:${k.keyId}`, userId, deviceId, keyId: k.keyId, publicKey: k.publicKey });
    }
  });
  tx(oneTimePreKeys);

  return res.json({ ok: true });
});

app.get('/keys/:userId', (req: Request, res: Response) => {
  const targetUserId = req.params.userId;
  const devices = db.prepare('SELECT * FROM devices WHERE userId=?').all(targetUserId) as any[];
  const selectPrekeys = db.prepare('SELECT * FROM prekeys WHERE userId=? AND deviceId=? AND isUsed=0 LIMIT 10');
  const markUsed = db.prepare('UPDATE prekeys SET isUsed=1 WHERE id=?');
  const result = devices.map((d) => {
    const prekeys = selectPrekeys.all(targetUserId, d.deviceId) as any[];
    const bundle = {
      deviceId: d.deviceId,
      registrationId: d.registrationId,
      identityKey: d.identityKey,
      signedPreKey: { keyId: d.signedPreKeyId, publicKey: d.signedPreKey, signature: d.signedPreKeySignature },
      prekeys: prekeys.map((p) => ({ keyId: p.keyId, publicKey: p.publicKey }))
    };
    for (const p of prekeys) {
      markUsed.run(`${targetUserId}:${d.deviceId}:${p.keyId}`);
    }
    return bundle;
  });
  res.json({ userId: targetUserId, devices: result });
});

const sendMessageBody = z.object({
  recipientUserId: z.string().min(1),
  recipientDeviceId: z.string().optional(),
  ciphertext: z.string().min(10)
});
app.post('/messages', authenticate, (req: Request, res: Response) => {
  const parsed = sendMessageBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });
  const senderUserId = (req as any).userId as string;
  const { recipientUserId, recipientDeviceId, ciphertext } = parsed.data;
  const id = randomUUID();
  db.prepare(`INSERT INTO messages (id, senderUserId, recipientUserId, recipientDeviceId, ciphertext, createdAt)
              VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, senderUserId, recipientUserId, recipientDeviceId || null, ciphertext, Date.now());
  res.json({ ok: true, id });
});

app.get('/messages/inbox', authenticate, (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const rows = db.prepare('SELECT * FROM messages WHERE recipientUserId=? ORDER BY createdAt ASC LIMIT 50').all(userId) as any[];
  const ids = rows.map((r) => r.id);
  if (ids.length) {
    const del = db.prepare(`DELETE FROM messages WHERE id IN (${ids.map(() => '?').join(',')})`);
    del.run(...ids);
  }
  res.json({ messages: rows });
});

app.get('/.well-known/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'messaging' });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Messaging service listening on http://localhost:${PORT}`);
});

