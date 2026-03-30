import { getDB } from './sqlite';
import type { Scalar } from '@op-engineering/op-sqlite';

const toRow = (msg: any) => ({
  _id: msg._id as string,
  conversationId: msg.conversationId as string,
  senderId: (typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId) as string,
  senderName: (typeof msg.senderId === 'object' ? msg.senderId.name ?? null : null) as string | null,
  senderAvatar: (typeof msg.senderId === 'object' ? msg.senderId.avatar ?? null : null) as string | null,
  text: (msg.text ?? '') as string,
  messageType: (msg.messageType ?? msg.file?.type ?? 'text') as string,
  fileUrl: (msg.file?.url ?? null) as string | null,
  fileType: (msg.file?.type ?? null) as string | null,
  fileName: (msg.file?.name ?? null) as string | null,
  status: (msg.status ?? 'sent') as string,
  createdAt: msg.createdAt as string,
  updatedAt: (msg.updatedAt ?? msg.createdAt) as string,
});

const fromRow = (row: Record<string, Scalar>) => ({
  _id: row._id as string,
  conversationId: row.conversationId as string,
  senderId: row.senderName
    ? { _id: row.senderId, name: row.senderName, avatar: row.senderAvatar }
    : row.senderId as string,
  text: row.text as string,
  messageType: row.messageType as string,
  file: row.fileUrl
    ? { url: row.fileUrl, type: row.fileType, name: row.fileName }
    : null,
  status: row.status as string,
  createdAt: row.createdAt as string,
  updatedAt: row.updatedAt as string,
});

// ── Writes (async, use transaction) ──────────────────────────────

export const saveMessages = async (messages: any[]): Promise<void> => {
  if (messages.length === 0) return;
  const db = getDB();
  await db.transaction(async (tx) => {
    for (const msg of messages) {
      const r = toRow(msg);
      await tx.execute(
        `INSERT OR REPLACE INTO messages
          (_id, conversationId, senderId, senderName, senderAvatar, text,
           messageType, fileUrl, fileType, fileName, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r._id, r.conversationId, r.senderId, r.senderName, r.senderAvatar,
         r.text, r.messageType, r.fileUrl, r.fileType, r.fileName,
         r.status, r.createdAt, r.updatedAt] as Scalar[]
      );
    }
  });
};

export const saveMessage = (msg: any): Promise<void> => saveMessages([msg]);

export const updateMessageStatus = async (messageId: string, status: string): Promise<void> => {
  const db = getDB();
  await db.transaction(async (tx) => {
    await tx.execute(`UPDATE messages SET status = ? WHERE _id = ?`, [status, messageId]);
  });
};

export const markAllAsRead = async (conversationId: string): Promise<void> => {
  const db = getDB();
  await db.transaction(async (tx) => {
    await tx.execute(
      `UPDATE messages SET status = 'read' WHERE conversationId = ? AND status != 'read'`,
      [conversationId]
    );
  });
};

export const markAllAsDelivered = async (conversationId: string, myUserId: string): Promise<void> => {
  const db = getDB();
  await db.transaction(async (tx) => {
    await tx.execute(
      `UPDATE messages SET status = 'delivered'
       WHERE conversationId = ? AND senderId = ? AND status = 'sent'`,
      [conversationId, myUserId]
    );
  });
};

export const clearAllMessages = async (): Promise<void> => {
  const db = getDB();
  await db.transaction(async (tx) => {
    await tx.execute(`DELETE FROM messages`);
  });
};

// ── Reads (sync, fast) ────────────────────────────────────────────

// Returns newest first — matches inverted FlatList
export const getMessages = (conversationId: string, page: number, limit: number): any[] => {
  const db = getDB();
  const offset = (page - 1) * limit;
  const result = db.executeSync(
    `SELECT * FROM messages
     WHERE conversationId = ?
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    [conversationId, limit, offset]
  );
  return result.rows.map(fromRow);
};

export const getMessageCount = (conversationId: string): number => {
  const db = getDB();
  const result = db.executeSync(
    `SELECT COUNT(*) as count FROM messages WHERE conversationId = ?`,
    [conversationId]
  );
  return (result.rows[0]?.count as number) ?? 0;
};

// Get the newest message createdAt — used for delta sync
export const getNewestMessageDate = (conversationId: string): string | null => {
  const db = getDB();
  const result = db.executeSync(
    `SELECT createdAt FROM messages WHERE conversationId = ? ORDER BY createdAt DESC LIMIT 1`,
    [conversationId]
  );
  return (result.rows[0]?.createdAt as string) ?? null;
};
