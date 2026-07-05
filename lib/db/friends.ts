import { db } from '../db';

export interface FriendRecord {
  id: string;
  name: string;
  url: string;
  avatar_url: string | null;
  description: string | null;
  site_title: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  deleted_at: string | null;
}

export async function getApprovedFriends(): Promise<FriendRecord[]> {
  const result = await db.execute(`SELECT * FROM friends WHERE status = 'approved' AND deleted_at IS NULL ORDER BY sort_order ASC, approved_at DESC, created_at DESC`);
  return result.rows as unknown as FriendRecord[];
}

export async function getAdminFriends(): Promise<FriendRecord[]> {
  const result = await db.execute(`SELECT * FROM friends WHERE deleted_at IS NULL ORDER BY status ASC, sort_order ASC, updated_at DESC`);
  return result.rows as unknown as FriendRecord[];
}

export async function getFriendById(id: string): Promise<FriendRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM friends WHERE id = ? AND deleted_at IS NULL`, args: [id] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as FriendRecord) : null;
}

export async function createFriend(input: { name: string; url: string; avatar_url?: string | null; description?: string | null; site_title?: string | null; status?: string; sort_order?: number }): Promise<FriendRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const approvedAt = input.status === 'approved' ? now : null;
  await db.execute({
    sql: `INSERT INTO friends (id, name, url, avatar_url, description, site_title, status, sort_order, created_at, updated_at, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.name, input.url, input.avatar_url || null, input.description || null, input.site_title || null, input.status || 'pending', input.sort_order || 0, now, now, approvedAt],
  });
  return getFriendById(id) as Promise<FriendRecord>;
}

export async function updateFriend(id: string, input: Partial<{ name: string; url: string; avatar_url: string | null; description: string | null; site_title: string | null; status: string; sort_order: number }>): Promise<void> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  if (input.name !== undefined) { fields.push('name = ?'); args.push(input.name); }
  if (input.url !== undefined) { fields.push('url = ?'); args.push(input.url); }
  if (input.avatar_url !== undefined) { fields.push('avatar_url = ?'); args.push(input.avatar_url); }
  if (input.description !== undefined) { fields.push('description = ?'); args.push(input.description); }
  if (input.site_title !== undefined) { fields.push('site_title = ?'); args.push(input.site_title); }
  if (input.status !== undefined) { fields.push('status = ?'); args.push(input.status); }
  if (input.sort_order !== undefined) { fields.push('sort_order = ?'); args.push(input.sort_order); }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); args.push(now);
  args.push(id);
  await db.execute({ sql: `UPDATE friends SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, args });
}

export async function approveFriend(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE friends SET status = 'approved', approved_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`, args: [now, now, id] });
}

export async function rejectFriend(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE friends SET status = 'rejected', updated_at = ? WHERE id = ? AND deleted_at IS NULL`, args: [now, id] });
}

export async function softDeleteFriend(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE friends SET deleted_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] });
}
