import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';

const jwtSecret = process.env.JWT_SECRET || 'devsecret';

function tokenFor(userId: string, name?: string) {
	return jwt.sign({ userId, name }, jwtSecret, { expiresIn: '1h' });
}

describe('dark launch allowlist gate', () => {
	let app: ReturnType<typeof createApp>;
	beforeAll(() => {
		process.env.FEATURE_FLAGS = 'dark_launch';
		process.env.ALLOWLIST_USERS = 'user-allowed';
		process.env.ALLOWLIST_WARDS = 'Ward 48,Ward 50';
		app = createApp();
	});

	it('denies non-allowlisted user without ward', async () => {
		const res = await request(app)
			.get('/groups/non-existent')
			.set('Authorization', `Bearer ${tokenFor('user-denied')}`);
		expect(res.status).toBe(403);
		expect(res.body.error).toBe('not_in_allowlist');
	});

	it('allows allowlisted user', async () => {
		const res = await request(app)
			.get('/health');
		expect(res.status).toBe(200);
		const res2 = await request(app)
			.get('/groups/non-existent')
			.set('Authorization', `Bearer ${tokenFor('user-allowed')}`);
		// 404 for missing group, but gate passed
		expect([403,404]).toContain(res2.status);
		if (res2.status === 403) {
			throw new Error('expected gate to allow allowlisted user');
		}
	});

	it('allows ward via x-ward header', async () => {
		const res = await request(app)
			.get('/groups/non-existent')
			.set('Authorization', `Bearer ${tokenFor('user-denied')}`)
			.set('x-ward', 'Ward 48');
		expect(res.status).toBe(404);
	});
});

