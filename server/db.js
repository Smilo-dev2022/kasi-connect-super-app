import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "app.sqlite");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      name TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS otps (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

export function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export function getUserByPhone(phone) {
  return db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
}

export function createUser({ id, email, phone, name }) {
  const stmt = db.prepare("INSERT INTO users (id, email, phone, name) VALUES (?, ?, ?, ?)");
  stmt.run(id, email ?? null, phone ?? null, name ?? null);
  return getUserByEmail(email) || getUserByPhone(phone);
}

export function createOtp({ id, userId, purpose, code, ttlSeconds }) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const codeHash = hashCode(code);
  const stmt = db.prepare(
    "INSERT INTO otps (id, user_id, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?, ?)"
  );
  stmt.run(id, userId, purpose, codeHash, expiresAt);
  return { id, userId, purpose, expiresAt };
}

export function verifyOtp({ userId, purpose, code }) {
  const codeHash = hashCode(code);
  const now = Math.floor(Date.now() / 1000);
  const otp = db
    .prepare(
      `SELECT * FROM otps WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL AND expires_at >= ? ORDER BY created_at DESC LIMIT 1`
    )
    .get(userId, purpose, now);
  if (!otp) return { ok: false, reason: "not_found" };
  if (otp.code_hash !== codeHash) return { ok: false, reason: "mismatch" };
  db.prepare("UPDATE otps SET consumed_at = ? WHERE id = ?").run(now, otp.id);
  return { ok: true };
}

export function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function generateNumericCode(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export default db;

