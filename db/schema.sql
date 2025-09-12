-- Week 2 schema: groups, messages, media, search index, safety, push
-- SQLite-compatible schema with FTS5 for message search

PRAGMA foreign_keys = ON;

-- groups
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  is_safety_room INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  max_members INTEGER NOT NULL DEFAULT 256 CHECK (max_members <= 256)
);

-- group_members
CREATE TABLE IF NOT EXISTS group_members (
  group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','member')),
  joined_at DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  left_at DATETIME,
  is_muted INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_role ON group_members(group_id, role);

-- Enforce max 256 members per group via trigger
CREATE TRIGGER IF NOT EXISTS trg_group_member_limit
BEFORE INSERT ON group_members
FOR EACH ROW BEGIN
  SELECT CASE WHEN (
    (SELECT COUNT(1) FROM group_members WHERE group_id = NEW.group_id) >= (
      SELECT max_members FROM groups WHERE id = NEW.group_id
    )
  ) THEN RAISE(ABORT, 'group member limit exceeded') END;
END;

-- media
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('image','video','audio','file')),
  original_url TEXT NOT NULL,
  sizes TEXT, -- JSON
  thumb_url TEXT,
  meta TEXT, -- JSON: mime, size, width, height, duration
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','failed')),
  created_at DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text','image','video','audio','file','system')),
  text TEXT,
  media_id TEXT,
  created_at DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at DATETIME,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_group_created ON messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- devices (push registration)
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  token TEXT NOT NULL,
  last_seen_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(user_id, token)
);

-- blocks (user blocks user)
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id TEXT NOT NULL,
  blocked_user_id TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  reason TEXT,
  PRIMARY KEY (blocker_id, blocked_user_id)
);

-- reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('message','user','group')),
  target_id TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','triaged','closed'))
);

-- Full-text search using FTS5 (contentless table)
CREATE VIRTUAL TABLE IF NOT EXISTS message_index USING fts5(
  message_id UNINDEXED,
  group_id UNINDEXED,
  text,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Keep FTS in sync (index only text messages that are not deleted)
CREATE TRIGGER IF NOT EXISTS trg_messages_ai
AFTER INSERT ON messages
FOR EACH ROW WHEN NEW.type = 'text' AND NEW.text IS NOT NULL BEGIN
  INSERT INTO message_index(message_id, group_id, text)
  VALUES (NEW.id, NEW.group_id, NEW.text);
END;

CREATE TRIGGER IF NOT EXISTS trg_messages_au
AFTER UPDATE OF text, deleted_at ON messages
FOR EACH ROW BEGIN
  DELETE FROM message_index WHERE message_id = OLD.id;
  SELECT CASE WHEN (NEW.type = 'text' AND NEW.text IS NOT NULL AND NEW.deleted_at IS NULL) THEN
    (INSERT INTO message_index(message_id, group_id, text) VALUES (NEW.id, NEW.group_id, NEW.text))
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_messages_ad
AFTER DELETE ON messages
FOR EACH ROW BEGIN
  DELETE FROM message_index WHERE message_id = OLD.id;
END;

-- Convenience views
CREATE VIEW IF NOT EXISTS v_group_counts AS
SELECT g.id AS group_id,
       COUNT(m.user_id) AS member_count
FROM groups g
LEFT JOIN group_members m ON m.group_id = g.id
GROUP BY g.id;

