import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { config } from './config';

export type DeviceRow = {
  id: string;
  user_id: string;
  platform: 'ios' | 'android' | 'web';
  token: string;
  last_seen_at: string | null;
  created_at: string;
};

export type Db = {
  sql: Database.Database;
  registerDevice(userId: string, platform: DeviceRow['platform'], token: string): DeviceRow;
  deleteDevice(userId: string, deviceId: string): boolean;
  getDeviceById(userId: string, deviceId: string): DeviceRow | undefined;
};

function loadSchema(sql: Database.Database) {
  const schemaPath = path.resolve(process.cwd(), '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  sql.exec(schema);
}

export function createDb(): Db {
  const dbFile = path.resolve(process.cwd(), config.dbPath);
  const sql = new Database(dbFile);
  sql.pragma('journal_mode = WAL');
  sql.pragma('foreign_keys = ON');
  loadSchema(sql);

  const insertDevice = sql.prepare(
    `INSERT OR IGNORE INTO devices (id, user_id, platform, token, last_seen_at) VALUES (@id, @user_id, @platform, @token, @last_seen_at)`
  );
  const updateDeviceSeen = sql.prepare(
    `UPDATE devices SET last_seen_at = @last_seen_at WHERE user_id = @user_id AND token = @token`
  );
  const selectDeviceByToken = sql.prepare<[{ user_id: string; token: string }], DeviceRow>(
    `SELECT * FROM devices WHERE user_id = @user_id AND token = @token`
  );
  const selectDeviceById = sql.prepare<[{ user_id: string; id: string }], DeviceRow>(
    `SELECT * FROM devices WHERE user_id = @user_id AND id = @id`
  );
  const deleteDeviceStmt = sql.prepare<[{ user_id: string; id: string }]>(
    `DELETE FROM devices WHERE user_id = @user_id AND id = @id`
  );

  function nowIso(): string {
    return new Date().toISOString();
  }

  return {
    sql,
    registerDevice(userId, platform, token) {
      const existing = selectDeviceByToken.get({ user_id: userId, token }) as
        | DeviceRow
        | undefined;
      const last_seen_at = nowIso();
      if (existing) {
        updateDeviceSeen.run({ last_seen_at, user_id: userId, token });
        return { ...existing, last_seen_at };
      }
      const id = nanoid(16);
      insertDevice.run({ id, user_id: userId, platform, token, last_seen_at });
      const created = selectDeviceById.get({ user_id: userId, id }) as DeviceRow;
      return created;
    },
    deleteDevice(userId, deviceId) {
      const info = deleteDeviceStmt.run({ user_id: userId, id: deviceId });
      return info.changes > 0;
    },
    getDeviceById(userId, deviceId) {
      return selectDeviceById.get({ user_id: userId, id: deviceId }) as DeviceRow | undefined;
    },
  };
}

