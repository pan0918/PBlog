import { db } from '../db';

export interface AlbumRecord {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  location: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getPublishedAlbums(): Promise<AlbumRecord[]> {
  const result = await db.execute(`SELECT * FROM albums WHERE status = 'published' AND deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC`);
  return result.rows as unknown as AlbumRecord[];
}

export async function getAdminAlbums(): Promise<AlbumRecord[]> {
  const result = await db.execute(`SELECT * FROM albums WHERE deleted_at IS NULL ORDER BY sort_order ASC, updated_at DESC`);
  return result.rows as unknown as AlbumRecord[];
}

export async function getAlbumById(id: string): Promise<AlbumRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM albums WHERE id = ? AND deleted_at IS NULL`, args: [id] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as AlbumRecord) : null;
}

export async function getAlbumBySlug(slug: string): Promise<AlbumRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM albums WHERE slug = ? AND deleted_at IS NULL`, args: [slug] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as AlbumRecord) : null;
}

export async function createAlbum(input: { title: string; slug: string; description?: string | null; cover_url?: string | null; location?: string | null; status?: string; sort_order?: number }): Promise<AlbumRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO albums (id, title, slug, description, cover_url, location, status, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.title, input.slug, input.description || null, input.cover_url || null, input.location || null, input.status || 'published', input.sort_order || 0, now, now],
  });
  return getAlbumById(id) as Promise<AlbumRecord>;
}

export async function updateAlbum(id: string, input: Partial<{ title: string; slug: string; description: string | null; cover_url: string | null; location: string | null; status: string; sort_order: number }>): Promise<void> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  if (input.title !== undefined) { fields.push('title = ?'); args.push(input.title); }
  if (input.slug !== undefined) { fields.push('slug = ?'); args.push(input.slug); }
  if (input.description !== undefined) { fields.push('description = ?'); args.push(input.description); }
  if (input.cover_url !== undefined) { fields.push('cover_url = ?'); args.push(input.cover_url); }
  if (input.location !== undefined) { fields.push('location = ?'); args.push(input.location); }
  if (input.status !== undefined) { fields.push('status = ?'); args.push(input.status); }
  if (input.sort_order !== undefined) { fields.push('sort_order = ?'); args.push(input.sort_order); }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); args.push(now);
  args.push(id);
  await db.execute({ sql: `UPDATE albums SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, args });
}

export async function softDeleteAlbum(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE albums SET deleted_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] });
}
