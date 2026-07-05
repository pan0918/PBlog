import { db } from '../db';

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getAllCategories(): Promise<CategoryRecord[]> {
  const result = await db.execute(`SELECT * FROM categories ORDER BY sort_order ASC, name ASC`);
  return result.rows as unknown as CategoryRecord[];
}

export async function getCategoryById(id: string): Promise<CategoryRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM categories WHERE id = ?`, args: [id] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as CategoryRecord) : null;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM categories WHERE slug = ?`, args: [slug] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as CategoryRecord) : null;
}

export async function createCategory(input: { name: string; slug: string; description?: string | null; sort_order?: number }): Promise<CategoryRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO categories (id, name, slug, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.name, input.slug, input.description || null, input.sort_order || 0, now, now],
  });
  return getCategoryById(id) as Promise<CategoryRecord>;
}

export async function updateCategory(id: string, input: Partial<{ name: string; slug: string; description: string | null; sort_order: number }>): Promise<void> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  if (input.name !== undefined) { fields.push('name = ?'); args.push(input.name); }
  if (input.slug !== undefined) { fields.push('slug = ?'); args.push(input.slug); }
  if (input.description !== undefined) { fields.push('description = ?'); args.push(input.description); }
  if (input.sort_order !== undefined) { fields.push('sort_order = ?'); args.push(input.sort_order); }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); args.push(now);
  args.push(id);
  await db.execute({ sql: `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, args });
}

export async function deleteCategory(id: string): Promise<void> {
  await db.execute({ sql: `DELETE FROM categories WHERE id = ?`, args: [id] });
}
