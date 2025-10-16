"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../src/app");
const ws_1 = require("../src/ws");
const state_1 = require("../src/state");
const jwtSecret = process.env.JWT_SECRET || 'devsecret';
function tokenFor(userId) {
    return jsonwebtoken_1.default.sign({ userId }, jwtSecret, { expiresIn: '1h' });
}
describe('Groups API', () => {
    let server;
    beforeEach(() => {
        // reset in-memory state between tests
        state_1.groupIdToGroup.clear();
        state_1.messageLog.length = 0;
        state_1.eventLog.length = 0;
        const app = (0, app_1.createApp)();
        server = http_1.default.createServer(app);
        (0, ws_1.attachWebSocketServer)(server);
    });
    afterEach(async () => {
        await new Promise((resolve) => server.close(() => resolve()));
    });
    it('creates a group and fetches it', async () => {
        const token = tokenFor('u_alex');
        const create = await (0, supertest_1.default)(server)
            .post('/groups')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Design', members: ['u_bob'] })
            .expect(200);
        expect(create.body.groupId).toBeTruthy();
        const groupId = create.body.groupId;
        const get = await (0, supertest_1.default)(server)
            .get(`/groups/${groupId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(get.body.ownerId).toBe('u_alex');
        expect(new Set(get.body.members)).toEqual(new Set(['u_alex', 'u_bob']));
    });
    it('adds and removes members with owner auth', async () => {
        const owner = tokenFor('owner');
        const created = await (0, supertest_1.default)(server)
            .post('/groups')
            .set('Authorization', `Bearer ${owner}`)
            .send({ name: 'Team' })
            .expect(200);
        const gid = created.body.groupId;
        await (0, supertest_1.default)(server)
            .post(`/groups/${gid}/members`)
            .set('Authorization', `Bearer ${owner}`)
            .send({ members: ['a', 'b'] })
            .expect(200)
            .expect((r) => expect(new Set(r.body.members)).toEqual(new Set(['owner', 'a', 'b'])));
        await (0, supertest_1.default)(server)
            .delete(`/groups/${gid}/members/a`)
            .set('Authorization', `Bearer ${owner}`)
            .expect(200)
            .expect((r) => expect(new Set(r.body.members)).toEqual(new Set(['owner', 'b'])));
    });
    it('rejects unauthorized access', async () => {
        await (0, supertest_1.default)(server).post('/groups').send({ name: 'Nope' }).expect(401);
    });
});
