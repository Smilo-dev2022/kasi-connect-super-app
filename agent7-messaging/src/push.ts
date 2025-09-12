import { Router, Request, Response } from 'express';
import webpush, { PushSubscription } from 'web-push';
import { UserId } from './state';

const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
let publicKey = process.env.VAPID_PUBLIC_KEY;
let privateKey = process.env.VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
	const generated = webpush.generateVAPIDKeys();
	publicKey = generated.publicKey;
	privateKey = generated.privateKey;
	// eslint-disable-next-line no-console
	console.log('[push] Generated dev VAPID keys. Provide VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY env for production.');
}

webpush.setVapidDetails(subject, publicKey!, privateKey!);

const userIdToSubs = new Map<UserId, PushSubscription[]>();

export const pushRouter = Router();

pushRouter.get('/vapidPublicKey', (_req: Request, res: Response) => {
	return res.json({ key: publicKey });
});

pushRouter.post('/subscribe', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const sub: PushSubscription | undefined = req.body?.subscription;
	if (!sub || !sub.endpoint) return res.status(400).json({ error: 'invalid_subscription' });
	const list = userIdToSubs.get(req.user.userId) || [];
	if (!list.find((s) => s.endpoint === sub.endpoint)) list.push(sub);
	userIdToSubs.set(req.user.userId, list);
	return res.json({ ok: true, count: list.length });
});

pushRouter.delete('/subscribe', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const endpoint: string | undefined = req.body?.endpoint;
	if (!endpoint) return res.status(400).json({ error: 'missing_endpoint' });
	const list = userIdToSubs.get(req.user.userId) || [];
	const next = list.filter((s) => s.endpoint !== endpoint);
	userIdToSubs.set(req.user.userId, next);
	return res.json({ ok: true, count: next.length });
});

export async function sendPushToUser(userId: UserId, payload: Record<string, unknown>): Promise<void> {
	const subs = userIdToSubs.get(userId) || [];
	await Promise.all(
		subs.map(async (sub) => {
			try {
				await webpush.sendNotification(sub, JSON.stringify(payload));
			} catch (err: any) {
				if (err?.statusCode === 410 || err?.statusCode === 404) {
					// expired subscription
					const list = userIdToSubs.get(userId) || [];
					userIdToSubs.set(userId, list.filter((s) => s.endpoint !== sub.endpoint));
				}
			}
		})
	);
}

