import { open } from '@op-engineering/op-sqlite';
import type { DB } from '@op-engineering/op-sqlite';

let db: DB | null = null;

export const getDB = (): DB => {
  if (db) return db;
  db = open({ name: 'chatapp.db' });

  // Schema — use executeSync for DDL (one-time, safe to block)
  db.executeSync(`
    CREATE TABLE IF NOT EXISTS messages (
      _id TEXT PRIMARY KEY,
      conversationId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      senderName TEXT,
      senderAvatar TEXT,
      text TEXT DEFAULT '',
      messageType TEXT DEFAULT 'text',
      fileUrl TEXT,
      fileType TEXT,
      fileName TEXT,
      callType TEXT,
      callStatus TEXT,
      duration INTEGER DEFAULT 0,
      status TEXT DEFAULT 'sent',
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  const migrations = [
    `ALTER TABLE messages ADD COLUMN callType TEXT`,
    `ALTER TABLE messages ADD COLUMN callStatus TEXT`,
    `ALTER TABLE messages ADD COLUMN duration INTEGER DEFAULT 0`,
  ];
  migrations.forEach((sql) => {
    try { db?.executeSync(sql); } catch {}
  });

  db.executeSync(`
    CREATE INDEX IF NOT EXISTS idx_messages_conv
    ON messages (conversationId, createdAt DESC)
  `);

  return db;
};

export const closeDB = () => {
  db?.close();
  db = null;
};
