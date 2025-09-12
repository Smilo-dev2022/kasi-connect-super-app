import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

type User = {
  id: string;
  phone: string;
  createdAt: number;
};

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.AUTH_PORT ? parseInt(process.env.AUTH_PORT, 10) : (process.env.PORT ? parseInt(process.env.PORT, 10) : 4001);
const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'dev_secret_change_me';

// In-memory stores for dev
const phoneToOtp = new Map<string, { code: string; expiresAt: number }>();
const phoneToUser = new Map<string, User>();

const requestOtpBody = z.object({ phone: z.string().min(6).max(20) });
app.post('/otp/request', (req: Request, res: Response) => {
  const parsed = requestOtpBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid phone' });
  }
  const { phone } = parsed.data;
  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  phoneToOtp.set(phone, { code, expiresAt });
  return res.json({ ok: true, devCode: code });
});

const verifyOtpBody = z.object({ phone: z.string().min(6).max(20), code: z.string().length(6) });
app.post('/otp/verify', (req: Request, res: Response) => {
  const parsed = verifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const { phone, code } = parsed.data;
  const record = phoneToOtp.get(phone);
  if (!record || record.code !== code || record.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Invalid or expired code' });
  }
  phoneToOtp.delete(phone);

  let user = phoneToUser.get(phone);
  if (!user) {
    user = { id: randomUUID(), phone, createdAt: Date.now() };
    phoneToUser.set(phone, user);
  }
  const token = jwt.sign({ sub: user.id, phone: user.phone }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
  return res.json({ token, user });
});

app.get('/.well-known/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'auth' });
});

// Basic error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Auth service listening on http://localhost:${PORT}`);
});

