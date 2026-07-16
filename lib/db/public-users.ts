import { db } from '../db';

export type PublicUserStatus = 'active' | 'muted' | 'banned';

export interface PublicUserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  status: PublicUserStatus;
  muted_until: string | null;
  session_version: number;
  must_change_password: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function createPublicUser(input: { username: string; email: string; passwordHash: string }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO public_users (id, username, email, password_hash, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, input.username, input.email, input.passwordHash, now, now],
  });
  return getPublicUserById(id) as Promise<PublicUserRecord>;
}

export async function getPublicUserByUsername(username: string): Promise<PublicUserRecord | null> {
  const result = await db.execute({
    sql: `SELECT * FROM public_users WHERE username = ? COLLATE NOCASE AND deleted_at IS NULL`,
    args: [username],
  });
  return result.rows.length ? result.rows[0] as unknown as PublicUserRecord : null;
}

export async function getPublicUserById(id: string): Promise<PublicUserRecord | null> {
  const result = await db.execute({
    sql: `SELECT * FROM public_users WHERE id = ? AND deleted_at IS NULL`,
    args: [id],
  });
  return result.rows.length ? result.rows[0] as unknown as PublicUserRecord : null;
}

export async function markPublicUserLogin(id: string) {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE public_users SET last_login_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] });
}

export async function updatePublicUserProfile(id: string, username: string) {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE public_users SET username = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`, args: [username, now, id] });
  return getPublicUserById(id);
}

export async function updatePublicUserAvatar(id: string, avatarUrl: string) {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE public_users SET avatar_url = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`, args: [avatarUrl, now, id] });
}

export async function updatePublicUserPassword(id: string, passwordHash: string) {
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE public_users SET password_hash = ?, session_version = session_version + 1,
          must_change_password = 0, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
    args: [passwordHash, now, id],
  });
  return getPublicUserById(id);
}

export async function deletePublicUserAccount(id: string) {
  const now = new Date().toISOString();
  const transaction = await db.transaction('write');
  try {
    await transaction.execute({
      sql: `UPDATE post_comments SET status = 'deleted', deleted_at = ?, updated_at = ?
            WHERE public_user_id = ? AND deleted_at IS NULL`,
      args: [now, now, id],
    });
    await transaction.execute({
      sql: `UPDATE public_users SET deleted_at = ?, status = 'banned', session_version = session_version + 1,
            updated_at = ? WHERE id = ?`,
      args: [now, now, id],
    });
    await transaction.commit();
  } finally {
    transaction.close();
  }
}
