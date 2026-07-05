import { db } from '../db';

export interface ProjectRecord {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  project_url: string | null;
  github_url: string | null;
  status: string;
  sort_order: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getPublishedProjects(): Promise<ProjectRecord[]> {
  const result = await db.execute(`SELECT * FROM projects WHERE status = 'published' AND deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC`);
  return result.rows as unknown as ProjectRecord[];
}

export async function getAdminProjects(): Promise<ProjectRecord[]> {
  const result = await db.execute(`SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY sort_order ASC, updated_at DESC`);
  return result.rows as unknown as ProjectRecord[];
}

export async function getProjectById(id: string): Promise<ProjectRecord | null> {
  const result = await db.execute({ sql: `SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL`, args: [id] });
  return result.rows.length > 0 ? (result.rows[0] as unknown as ProjectRecord) : null;
}

export async function createProject(input: { title: string; slug: string; description?: string | null; content?: string | null; project_url?: string | null; github_url?: string | null; status?: string; sort_order?: number; started_at?: string | null; ended_at?: string | null }): Promise<ProjectRecord> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO projects (id, title, slug, description, content, project_url, github_url, status, sort_order, started_at, ended_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.title, input.slug, input.description || null, input.content || null, input.project_url || null, input.github_url || null, input.status || 'published', input.sort_order || 0, input.started_at || null, input.ended_at || null, now, now],
  });
  return getProjectById(id) as Promise<ProjectRecord>;
}

export async function updateProject(id: string, input: Partial<{ title: string; slug: string; description: string | null; content: string | null; project_url: string | null; github_url: string | null; status: string; sort_order: number; started_at: string | null; ended_at: string | null }>): Promise<void> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  if (input.title !== undefined) { fields.push('title = ?'); args.push(input.title); }
  if (input.slug !== undefined) { fields.push('slug = ?'); args.push(input.slug); }
  if (input.description !== undefined) { fields.push('description = ?'); args.push(input.description); }
  if (input.content !== undefined) { fields.push('content = ?'); args.push(input.content); }
  if (input.project_url !== undefined) { fields.push('project_url = ?'); args.push(input.project_url); }
  if (input.github_url !== undefined) { fields.push('github_url = ?'); args.push(input.github_url); }
  if (input.status !== undefined) { fields.push('status = ?'); args.push(input.status); }
  if (input.sort_order !== undefined) { fields.push('sort_order = ?'); args.push(input.sort_order); }
  if (input.started_at !== undefined) { fields.push('started_at = ?'); args.push(input.started_at); }
  if (input.ended_at !== undefined) { fields.push('ended_at = ?'); args.push(input.ended_at); }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); args.push(now);
  args.push(id);
  await db.execute({ sql: `UPDATE projects SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, args });
}

export async function softDeleteProject(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE projects SET deleted_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] });
}
