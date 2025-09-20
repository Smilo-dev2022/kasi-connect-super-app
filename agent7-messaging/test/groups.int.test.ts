import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { attachWebSocketServer } from '../src/ws';
import { groupIdToGroup, messageLog, eventLog, userIdToGroups } from '../src/state';

const jwtSecret = process.env.JWT_SECRET || 'devsecret';

function tokenFor(userId: string) {
	return jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
}

describe('Groups API', () => {
	let server: http.Server;

	beforeEach(() => {
		// reset in-memory state between tests
		groupIdToGroup.clear();
		messageLog.length = 0;
		eventLog.length = 0;
		const app = createApp();
		server = http.createServer(app);
		attachWebSocketServer(server);
	});

	afterEach(async () => {
		await new Promise<void>((resolve) => server.close(() => resolve()));
	});

	it('creates a group and fetches it', async () => {
		const token = tokenFor('u_alex');
		const create = await request(server)
			.post('/groups')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Design', members: ['u_bob'] })
			.expect(200);
		expect(create.body.groupId).toBeTruthy();

		const groupId = create.body.groupId as string;
		const get = await request(server)
			.get(`/groups/${groupId}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(get.body.ownerId).toBe('u_alex');
		expect(new Set(get.body.members)).toEqual(new Set(['u_alex', 'u_bob']));
	});

	it('adds and removes members with owner auth', async () => {
		const owner = tokenFor('owner');
		const created = await request(server)
			.post('/groups')
			.set('Authorization', `Bearer ${owner}`)
			.send({ name: 'Team' })
			.expect(200);
		const gid = created.body.groupId as string;

		await request(server)
			.post(`/groups/${gid}/members`)
			.set('Authorization', `Bearer ${owner}`)
			.send({ members: ['a', 'b'] })
			.expect(200)
			.expect((r) => expect(new Set(r.body.members)).toEqual(new Set(['owner', 'a', 'b'])));

		await request(server)
			.delete(`/groups/${gid}/members/a`)
			.set('Authorization', `Bearer ${owner}`)
			.expect(200)
			.expect((r) => expect(new Set(r.body.members)).toEqual(new Set(['owner', 'b'])));
	});

	it('rejects unauthorized access', async () => {
		await request(server).post('/groups').send({ name: 'Nope' }).expect(401);
	});

	it('cleans up userIdToGroups map when user is removed from their last group', async () => {
		const ownerToken = tokenFor('owner');
		const userToRemove = 'u_test';

		// Create a group with the user as a member
		const create = await request(server)
			.post('/groups')
			.set('Authorization', `Bearer ${ownerToken}`)
			.send({ name: 'Test Group', members: [userToRemove] })
			.expect(200);

		const groupId = create.body.groupId as string;

		// Verify the user is in the reverse index map
		expect(userIdToGroups.has(userToRemove)).toBe(true);
		expect(userIdToGroups.get(userToRemove)?.has(groupId)).toBe(true);

		// Remove the user from the group
		await request(server)
			.delete(`/groups/${groupId}/members/${userToRemove}`)
			.set('Authorization', `Bearer ${ownerToken}`)
			.expect(200);

		// Verify the user is removed from the reverse index map
		expect(userIdToGroups.has(userToRemove)).toBe(false);
	});
});

