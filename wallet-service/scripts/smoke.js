"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const axios_1 = __importDefault(require("axios"));
async function main() {
    const base = process.env.WALLET_BASE || 'http://localhost:3000';
    const adminToken = process.env.ADMIN_TOKEN;
    const auth = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
    console.log('1) /health');
    const health = await axios_1.default.get(`${base}/health`);
    console.log(health.data);
    console.log('2) /api/config');
    const conf = await axios_1.default.get(`${base}/api/config`);
    console.log(conf.data);
    console.log('3) Create account');
    const account = await axios_1.default.post(`${base}/api/accounts`, { userId: `smoke-${Date.now()}`, currency: 'ZAR' });
    console.log(account.data);
    console.log('4) Create onramp order');
    const order = await axios_1.default.post(`${base}/api/onramp/orders`, {
        side: 'BUY',
        fiatCurrency: 'ZAR',
        cryptoAsset: 'USDC',
        fiatAmountCents: 10000,
        cryptoAmountBaseUnits: 1000000,
    }, { headers: { ...auth, 'Content-Type': 'application/json' } });
    console.log(order.data);
    console.log('5) Settle order');
    const settle = await axios_1.default.post(`${base}/api/onramp/orders/${order.data.id}/settle`, {
        accountId: account.data.id,
        creditAmount: 100,
        description: 'Smoke settle',
    }, { headers: { ...auth, 'Content-Type': 'application/json' } });
    console.log(settle.data);
    console.log('6) Receipt');
    const receipt = await axios_1.default.get(`${base}/api/onramp/orders/${order.data.id}/receipt`, { headers: { ...auth } });
    console.log(receipt.data);
    console.log('OK');
}
main().catch((err) => {
    console.error(err.response?.data || err.message);
    process.exit(1);
});
//# sourceMappingURL=smoke.js.map