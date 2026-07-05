import { db } from '../db';

export interface PhotoRecord {
  id: string;
  album_id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getPhotosByAlbumId(albumId: string): Promise<PhotoRecord[]> {
  const result = await db.execute({
    sql: `SELECT * FROM photos WHERE album_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC, created_at ASC`,
    args: [albumId],
  });
  return result.rows as unknown as PhotoRecord[];
}

export async function getPhotoById(id: string): Promise<PhotoRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM photos WHERE id = ? AND deleted_at IS NULL`, args: [id] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as PhotoRecord) : null;
}

export async function createPhoto(input: { album_id: string; title?: string | null; description?: string | null; image_url: string; thumbnail_url?: string | null; width?: number | null; height?: number | null; sort_order?: number }): Promise<PhotoRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO photos (id, album_id, title, description, image_url, thumbnail_url, width, height, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.album_id, input.title || null, input.description || null, input.image_url, input.thumbnail_url || null, input.width || null, input.height || null, input.sort_order || 0, now, now],
  });
  return getPhotoById(id) as Promise<PhotoRecord>;
}

export async function updatePhoto(id: string, input: Partial<{ title: string | null; description: string | null; image_url: string; thumbnail_url: string | null; width: number | null; height: number | null; sort_order: number }>): Promise<PhotoRecord | null> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  if (input.title !== undefined) { fields.push('title = ?'); args.push(input.title); }
  if (input.description !== undefined) { fields.push('description = ?'); args.push(input.description); }
  if (input.image_url !== undefined) { fields.push('image_url = ?'); args.push(input.image_url); }
  if (input.thumbnail_url !== undefined) { fields.push('thumbnail_url = ?'); args.push(input.thumbnail_url); }
  if (input.width !== undefined) { fields.push('width = ?'); args.push(input.width); }
  if (input.height !== undefined) { fields.push('height = ?'); args.push(input.height); }
  if (input.sort_order !== undefined) { fields.push('sort_order = ?'); args.push(input.sort_order); }
  if (fields.length === 0) return getPhotoById(id);
  fields.push('updated_at = ?'); args.push(now);
  args.push(id);
  await db.execute({ sql: `UPDATE photos SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, args });
  return getPhotoById(id);
}

export async function softDeletePhoto(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE photos SET deleted_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] });
}
