import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { userIdToVerifiedWard } from './state';

export const adminRouter = Router();

const VerifyWardBody = z.object({ userId: z.string().min(1), ward: z.string().min(1) });
const RevokeBody = z.object({ userId: z.string().min(1) });

adminRouter.post('/verify-ward', (req: Request, res: Response) => {
	const parsed = VerifyWardBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	userIdToVerifiedWard.set(parsed.data.userId, parsed.data.ward);
	return res.json({ ok: true, userId: parsed.data.userId, ward: parsed.data.ward });
});

adminRouter.post('/revoke-ward', (req: Request, res: Response) => {
	const parsed = RevokeBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	userIdToVerifiedWard.delete(parsed.data.userId);
	return res.json({ ok: true, userId: parsed.data.userId });
});

adminRouter.get('/verifications', (_req: Request, res: Response) => {
	const entries = Array.from(userIdToVerifiedWard.entries()).map(([userId, ward]) => ({ userId, ward }));
	return res.json({ entries });
});

