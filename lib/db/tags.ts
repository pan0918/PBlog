import { db } from '../db';

export interface TagRecord {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export async function getAllTags(): Promise<TagRecord[]> {
  const result = await db.execute(`SELECT * FROM tags ORDER BY name ASC`);
  return result.rows as unknown as TagRecord[];
}

export async function getTagById(id: string): Promise<TagRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM tags WHERE id = ?`, args: [id] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as TagRecord) : null;
}

export async function getTagBySlug(slug: string): Promise<TagRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM tags WHERE slug = ?`, args: [slug] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as TagRecord) : null;
}

export async function createTag(input: { name: string; slug: string }): Promise<TagRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO tags (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    args: [id, input.name, input.slug, now, now],
  });
  return getTagById(id) as Promise<TagRecord>;
}

export async function updateTag(id: string, input: Partial<{ name: string; slug: string }>): Promise<void> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  if (input.name !== undefined) { fields.push('name = ?'); args.push(input.name); }
  if (input.slug !== undefined) { fields.push('slug = ?'); args.push(input.slug); }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); args.push(now);
  args.push(id);
  await db.execute({ sql: `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, args });
}

export async function deleteTag(id: string): Promise<void> {
  await db.execute({ sql: `DELETE FROM tags WHERE id = ?`, args: [id] });
}
