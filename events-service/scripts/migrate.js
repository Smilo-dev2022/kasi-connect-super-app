"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
async function main() {
    const databaseUrl = process.env.EVENTS_DATABASE_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('EVENTS_DATABASE_URL or DATABASE_URL must be set');
        process.exit(1);
    }
    const client = new pg_1.Client({ connectionString: databaseUrl });
    await client.connect();
    try {
        const sqlPath = path_1.default.join(__dirname, 'schema.sql');
        const sql = (0, fs_1.readFileSync)(sqlPath, 'utf-8');
        await client.query(sql);
        console.log('[events-service] migrations applied');
    }
    finally {
        await client.end();
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map