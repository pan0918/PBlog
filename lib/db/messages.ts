import { db } from '../db';

export interface MessageRecord {
  id: string;
  author: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  deleted_at: string | null;
}

export async function getApprovedMessages(limit = 100): Promise<MessageRecord[]> {
  const result = await db.execute({
    sql: `SELECT * FROM messages WHERE status = 'approved' AND deleted_at IS NULL ORDER BY approved_at DESC, created_at DESC LIMIT ?`,
    args: [limit],
  });
  return result.rows as unknown as MessageRecord[];
}

export async function getAdminMessages(): Promise<MessageRecord[]> {
  const result = await db.execute(`SELECT * FROM messages WHERE deleted_at IS NULL ORDER BY created_at DESC`);
  return result.rows as unknown as MessageRecord[];
}

export async function getMessageById(id: string): Promise<MessageRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM messages WHERE id = ? AND deleted_at IS NULL`, args: [id] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as MessageRecord) : null;
}

export async function createPendingMessage(input: { author: string; content: string }): Promise<MessageRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO messages (id, author, content, status, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, ?)`,
    args: [id, input.author, input.content, now, now],
  });
  return getMessageById(id) as Promise<MessageRecord>;
}

export async function approveMessage(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE messages SET status = 'approved', approved_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`, args: [now, now, id] });
}

export async function rejectMessage(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE messages SET status = 'rejected', updated_at = ? WHERE id = ? AND deleted_at IS NULL`, args: [now, id] });
}

export async function markMessageAsSpam(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE messages SET status = 'spam', updated_at = ? WHERE id = ? AND deleted_at IS NULL`, args: [now, id] });
}

export async function softDeleteMessage(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE messages SET deleted_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] });
}
