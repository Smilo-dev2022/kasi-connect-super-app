import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

type JwtUser = { userId: string; name?: string };

declare global {
	namespace Express {
		interface Request {
			user?: JwtUser;
		}
	}
}

const jwtSecret = process.env.JWT_SECRET || 'devsecret';

export function requireJwt(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.header('authorization') || req.header('Authorization');
	const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined) || (req.query.token as string | undefined);
	if (!token) return res.status(401).json({ error: 'missing token' });
	try {
		const payload = jwt.verify(token, jwtSecret) as JwtUser;
		if (!payload || !payload.userId) return res.status(401).json({ error: 'invalid token' });
		req.user = { userId: payload.userId, name: payload.name };
		return next();
	} catch (err) {
		return res.status(401).json({ error: 'invalid token' });
	}
}

export const authRouter = Router();

const DevTokenBody = z.object({ userId: z.string().min(1), name: z.string().optional() });

authRouter.post('/dev-token', (req: Request, res: Response) => {
	const parsed = DevTokenBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const token = jwt.sign(parsed.data, jwtSecret, { expiresIn: '7d' });
	res.json({ token });
});