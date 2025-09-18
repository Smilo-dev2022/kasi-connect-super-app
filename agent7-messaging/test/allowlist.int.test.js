"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../src/app");
const jwtSecret = process.env.JWT_SECRET || 'devsecret';
function tokenFor(userId, name) {
    return jsonwebtoken_1.default.sign({ userId, name }, jwtSecret, { expiresIn: '1h' });
}
(0, vitest_1.describe)('dark launch allowlist gate', () => {
    let app;
    (0, vitest_1.beforeAll)(() => {
        process.env.FEATURE_FLAGS = 'dark_launch';
        process.env.ALLOWLIST_USERS = 'user-allowed';
        process.env.ALLOWLIST_WARDS = 'Ward 48,Ward 50';
        app = (0, app_1.createApp)();
    });
    (0, vitest_1.it)('denies non-allowlisted user without ward', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/groups/non-existent')
            .set('Authorization', `Bearer ${tokenFor('user-denied')}`);
        (0, vitest_1.expect)(res.status).toBe(403);
        (0, vitest_1.expect)(res.body.error).toBe('not_in_allowlist');
    });
    (0, vitest_1.it)('allows allowlisted user', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/health');
        (0, vitest_1.expect)(res.status).toBe(200);
        const res2 = await (0, supertest_1.default)(app)
            .get('/groups/non-existent')
            .set('Authorization', `Bearer ${tokenFor('user-allowed')}`);
        // 404 for missing group, but gate passed
        (0, vitest_1.expect)([403, 404]).toContain(res2.status);
        if (res2.status === 403) {
            throw new Error('expected gate to allow allowlisted user');
        }
    });
    (0, vitest_1.it)('allows ward via x-ward header', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/groups/non-existent')
            .set('Authorization', `Bearer ${tokenFor('user-denied')}`)
            .set('x-ward', 'Ward 48');
        (0, vitest_1.expect)(res.status).toBe(404);
    });
});
