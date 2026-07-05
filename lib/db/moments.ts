import { db } from '../db';

export interface MomentRecord {
  id: string;
  content: string;
  mood: string | null;
  weather: string | null;
  location: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getPublishedMoments(): Promise<MomentRecord[]> {
  const result = await db.execute(`SELECT * FROM moments WHERE status = 'published' AND deleted_at IS NULL ORDER BY published_at DESC, created_at DESC`);
  return result.rows as unknown as MomentRecord[];
}

export async function getAdminMoments(): Promise<MomentRecord[]> {
  const result = await db.execute(`SELECT * FROM moments WHERE deleted_at IS NULL ORDER BY updated_at DESC`);
  return result.rows as unknown as MomentRecord[];
}

export async function getMomentById(id: string): Promise<MomentRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM moments WHERE id = ? AND deleted_at IS NULL`, args: [id] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as MomentRecord) : null;
}

export async function createMoment(input: { content: string; mood?: string | null; weather?: string | null; location?: string | null; status?: string; published_at?: string | null }): Promise<MomentRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const publishedAt = input.status === 'published' ? (input.published_at || now) : null;
  await db.execute({
    sql: `INSERT INTO moments (id, content, mood, weather, location, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.content, input.mood || null, input.weather || null, input.location || null, input.status || 'published', publishedAt, now, now],
  });
  return getMomentById(id) as Promise<MomentRecord>;
}

export async function updateMoment(id: string, input: Partial<{ content: string; mood: string | null; weather: string | null; location: string | null; status: string; published_at: string | null }>): Promise<void> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  if (input.content !== undefined) { fields.push('content = ?'); args.push(input.content); }
  if (input.mood !== undefined) { fields.push('mood = ?'); args.push(input.mood); }
  if (input.weather !== undefined) { fields.push('weather = ?'); args.push(input.weather); }
  if (input.location !== undefined) { fields.push('location = ?'); args.push(input.location); }
  if (input.status !== undefined) { fields.push('status = ?'); args.push(input.status); }
  if (input.published_at !== undefined) { fields.push('published_at = ?'); args.push(input.published_at); }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); args.push(now);
  args.push(id);
  await db.execute({ sql: `UPDATE moments SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, args });
}

export async function softDeleteMoment(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE moments SET deleted_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] });
}
