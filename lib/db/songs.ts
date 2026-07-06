import { db } from '../db';

export interface SongRecord {
  id: string;
  title: string;
  artist: string;
  album: string;
  pic: string;
  url: string;
  lrc: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getPublishedSongs(): Promise<SongRecord[]> {
  const result = await db.execute(`SELECT * FROM songs WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC`);
  return result.rows as unknown as SongRecord[];
}

export async function getAdminSongs(): Promise<SongRecord[]> {
  const result = await db.execute(`SELECT * FROM songs WHERE deleted_at IS NULL ORDER BY sort_order ASC, updated_at DESC`);
  return result.rows as unknown as SongRecord[];
}

export async function getSongById(id: string): Promise<SongRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM songs WHERE id = ? AND deleted_at IS NULL`, args: [id] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as SongRecord) : null;
}

export async function createSong(input: { title: string; artist: string; album?: string; pic?: string; url: string; lrc?: string; sort_order?: number }): Promise<SongRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO songs (id, title, artist, album, pic, url, lrc, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.title, input.artist, input.album || '', input.pic || '', input.url, input.lrc || '', input.sort_order ?? 0, now, now],
  });
  return getSongById(id) as Promise<SongRecord>;
}

export async function updateSong(id: string, input: Partial<{ title: string; artist: string; album: string; pic: string; url: string; lrc: string; sort_order: number }>): Promise<void> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  if (input.title !== undefined) { fields.push('title = ?'); args.push(input.title); }
  if (input.artist !== undefined) { fields.push('artist = ?'); args.push(input.artist); }
  if (input.album !== undefined) { fields.push('album = ?'); args.push(input.album); }
  if (input.pic !== undefined) { fields.push('pic = ?'); args.push(input.pic); }
  if (input.url !== undefined) { fields.push('url = ?'); args.push(input.url); }
  if (input.lrc !== undefined) { fields.push('lrc = ?'); args.push(input.lrc); }
  if (input.sort_order !== undefined) { fields.push('sort_order = ?'); args.push(input.sort_order); }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); args.push(now);
  args.push(id);
  await db.execute({ sql: `UPDATE songs SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, args });
}

export async function softDeleteSong(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE songs SET deleted_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] });
}
