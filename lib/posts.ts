import { db } from './db';
import { formatUpdateTime } from './utils';
import { renderMarkdownContent, extractToc } from './markdown';
import { unstable_cache } from 'next/cache';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  cover: string;
  category: string | null;
  formattedDate: string;
  content: string;
  viewCount: number;
}

export type PostStatus = 'draft' | 'published';

export interface PostRecord {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_url: string | null;
  category_id: string | null;
  status: PostStatus;
  is_pinned: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PostWithMeta extends PostRecord {
  category_name: string | null;
  category_slug: string | null;
  tags: { id: string; name: string; slug: string }[];
}

export interface PostInput {
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  cover_url?: string | null;
  category_id?: string | null;
  status?: PostStatus;
  is_pinned?: number;
  published_at?: string | null;
}

export type PostUpdateInput = Partial<PostInput>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse tags JSON from a correlated subquery result */
function parseTagsJson(tagsJson: string | null): { id: string; name: string; slug: string }[] {
  try {
    const parsed = JSON.parse(tagsJson || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((t): t is { id: string; name: string; slug: string } =>
          typeof t === 'object' && t !== null && typeof t.id === 'string')
      : [];
  } catch {
    return [];
  }
}

/** Parse tags JSON into a flat string array (for frontend PostMeta) */
function parseTagsFlat(tagsJson: string | null): string[] {
  try {
    const parsed = JSON.parse(tagsJson || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : [];
  } catch {
    return [];
  }
}

/** Map a DB row to PostWithMeta (with structured tags from subquery) */
function rowToPostWithMeta(r: Record<string, unknown>): PostWithMeta {
  return {
    id: r.id as string,
    title: (r.title as string) || '',
    slug: r.slug as string,
    summary: (r.summary as string) || null,
    content: (r.content as string) || '',
    cover_url: (r.cover_url as string) || null,
    category_id: (r.category_id as string) || null,
    status: (r.status as PostStatus) || 'draft',
    is_pinned: (r.is_pinned as number) || 0,
    view_count: (r.view_count as number) || 0,
    published_at: (r.published_at as string) || null,
    created_at: (r.created_at as string) || '',
    updated_at: (r.updated_at as string) || '',
    deleted_at: (r.deleted_at as string) || null,
    category_name: (r.category_name as string) || null,
    category_slug: (r.category_slug as string) || null,
    tags: parseTagsJson(r.tags_json as string | null),
  };
}

// SQL fragment for inline tags (avoids N+1 queries)
const TAGS_SUBQUERY = `COALESCE((
  SELECT json_group_array(json_object('id', t.id, 'name', t.name, 'slug', t.slug))
  FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id
), '[]') as tags_json`;

const TAGS_SUBQUERY_FLAT = `COALESCE((
  SELECT json_group_array(t.name)
  FROM post_tags pt
  JOIN tags t ON t.id = pt.tag_id
  WHERE pt.post_id = p.id
), '[]') as tags_json`;

// ─── Frontend: Cached read model ─────────────────────────────────────────────

/** Internal: fetch all published posts (flat tags, for homepage/timeline) */
async function queryAllPosts(): Promise<PostMeta[]> {
  try {
    const result = await db.execute(`
      SELECT p.slug, p.title, p.published_at, p.summary, p.cover_url, p.content, p.view_count,
             c.name as category_name,
             ${TAGS_SUBQUERY_FLAT}
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published' AND p.deleted_at IS NULL
      ORDER BY p.is_pinned DESC, p.published_at DESC, p.created_at DESC
    `);

    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      const rawDate = (r.published_at as string) || '1970-01-01';
      return {
        slug: r.slug as string,
        title: (r.title as string) || '',
        date: rawDate,
        description: (r.summary as string) || ((r.content as string) || '').substring(0, 120),
        tags: parseTagsFlat(r.tags_json as string | null),
        cover: (r.cover_url as string) || '',
        category: (r.category_name as string) || null,
        formattedDate: formatUpdateTime(rawDate),
        content: (r.content as string) || '',
        viewCount: (r.view_count as number) || 0,
      };
    });
  } catch {
    return [];
  }
}

/** Frontend: get all published posts (cached, 5 min TTL) */
export const getAllPosts = unstable_cache(
  queryAllPosts,
  ['published-posts'],
  { tags: ['posts'], revalidate: 300 },
);

/** Frontend: get post detail with rendered HTML and TOC */
export async function getPostBySlug(slug: string): Promise<{
  data: PostMeta;
  rawContent: string;
  contentHtml: string;
  toc: { level: number; text: string; id: string }[];
} | null> {
  try {
    let result = await db.execute({
      sql: `SELECT p.*, c.name as category_name, ${TAGS_SUBQUERY_FLAT}
            FROM posts p LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
      args: [slug],
    });

    // Legacy slug fallback (e.g. "category/post" → "category-post")
    if (result.rows.length === 0 && slug.includes('/')) {
      const legacySlug = slug.replace(/\//g, '-');
      result = await db.execute({
        sql: `SELECT p.*, c.name as category_name, ${TAGS_SUBQUERY_FLAT}
              FROM posts p LEFT JOIN categories c ON p.category_id = c.id
              WHERE p.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
        args: [legacySlug],
      });
    }

    if (result.rows.length === 0) return null;

    const r = result.rows[0] as Record<string, unknown>;
    const content = (r.content as string) || '';
    const rawDate = (r.published_at as string) || '1970-01-01';
    const tags = parseTagsFlat(r.tags_json as string | null);

    // Render Markdown to HTML (with heading IDs for TOC)
    const contentHtml = await renderMarkdownContent(content, { withSlugIds: true, preprocess: true });

    // Extract table of contents
    const toc = extractToc(contentHtml);

    return {
      data: {
        slug: r.slug as string,
        title: (r.title as string) || '',
        date: rawDate,
        description: (r.summary as string) || content.substring(0, 120),
        tags,
        cover: (r.cover_url as string) || '',
        category: (r.category_name as string) || null,
        formattedDate: formatUpdateTime(rawDate),
        content,
        viewCount: (r.view_count as number) || 0,
      },
      rawContent: content,
      contentHtml,
      toc,
    };
  } catch {
    return null;
  }
}

// ─── Backend: CRUD & admin queries ───────────────────────────────────────────

/** Backend: get all published posts with structured tags (for API) */
export async function getPublishedPosts(): Promise<PostWithMeta[]> {
  const result = await db.execute(`
    SELECT p.*, c.name as category_name, c.slug as category_slug, ${TAGS_SUBQUERY}
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published' AND p.deleted_at IS NULL
    ORDER BY p.is_pinned DESC, p.published_at DESC, p.created_at DESC
  `);
  return result.rows.map(rowToPostWithMeta);
}

/** Backend: get all posts including drafts (admin) */
export async function getAdminPosts(): Promise<PostWithMeta[]> {
  const result = await db.execute(`
    SELECT p.*, c.name as category_name, c.slug as category_slug, ${TAGS_SUBQUERY}
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.deleted_at IS NULL
    ORDER BY p.updated_at DESC
  `);
  return result.rows.map(rowToPostWithMeta);
}

/** Backend: get post by ID with structured tags */
export async function getPostById(id: string): Promise<PostWithMeta | null> {
  const result = await db.execute({
    sql: `SELECT p.*, c.name as category_name, c.slug as category_slug, ${TAGS_SUBQUERY}
          FROM posts p LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = ? AND p.deleted_at IS NULL`,
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return rowToPostWithMeta(result.rows[0] as Record<string, unknown>);
}

/** Backend: get published post by slug with structured tags */
export async function getPublishedPostBySlug(slug: string): Promise<PostWithMeta | null> {
  let result = await db.execute({
    sql: `SELECT p.*, c.name as category_name, c.slug as category_slug, ${TAGS_SUBQUERY}
          FROM posts p LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
    args: [slug],
  });
  if (result.rows.length === 0 && slug.includes('/')) {
    const legacySlug = slug.replace(/\//g, '-');
    result = await db.execute({
      sql: `SELECT p.*, c.name as category_name, c.slug as category_slug, ${TAGS_SUBQUERY}
            FROM posts p LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
      args: [legacySlug],
    });
  }
  if (result.rows.length === 0) return null;
  return rowToPostWithMeta(result.rows[0] as Record<string, unknown>);
}

/** Create post with tags (transactional) */
export async function createPostWithTags(
  input: PostInput,
  tagIds: string[],
): Promise<PostWithMeta> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const publishedAt = input.status === 'published' ? (input.published_at || now) : null;
  const transaction = await db.transaction('write');
  try {
    await transaction.execute({
      sql: `INSERT INTO posts (id, title, slug, summary, content, cover_url, category_id, status, is_pinned, view_count, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      args: [id, input.title, input.slug, input.summary || null, input.content, input.cover_url || null, input.category_id || null, input.status || 'draft', input.is_pinned || 0, publishedAt, now, now],
    });
    for (const tagId of tagIds) {
      await transaction.execute({
        sql: `INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)`,
        args: [id, tagId],
      });
    }
    await transaction.commit();
  } finally {
    transaction.close();
  }

  const post = await getPostById(id);
  if (!post) throw new Error('文章创建后无法读取');
  return post;
}

/** Update post with tags (transactional) */
export async function updatePostWithTags(
  id: string,
  input: PostUpdateInput,
  tagIds?: string[],
): Promise<{ post: PostWithMeta | null; previousSlug: string | null }> {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  const transaction = await db.transaction('write');

  try {
    const existing = await transaction.execute({
      sql: 'SELECT slug, published_at FROM posts WHERE id = ? AND deleted_at IS NULL',
      args: [id],
    });
    if (existing.rows.length === 0) {
      await transaction.rollback();
      return { post: null, previousSlug: null };
    }
    const existingPost = existing.rows[0] as Record<string, unknown>;
    const previousSlug = existingPost.slug as string;

    if (input.title !== undefined) { fields.push('title = ?'); args.push(input.title); }
    if (input.slug !== undefined) { fields.push('slug = ?'); args.push(input.slug); }
    if (input.summary !== undefined) { fields.push('summary = ?'); args.push(input.summary); }
    if (input.content !== undefined) { fields.push('content = ?'); args.push(input.content); }
    if (input.cover_url !== undefined) { fields.push('cover_url = ?'); args.push(input.cover_url); }
    if (input.category_id !== undefined) { fields.push('category_id = ?'); args.push(input.category_id); }
    if (input.status !== undefined) {
      fields.push('status = ?'); args.push(input.status);
      if (input.status === 'published' && !input.published_at && !existingPost.published_at) {
        fields.push('published_at = ?'); args.push(now);
      }
    }
    if (input.is_pinned !== undefined) { fields.push('is_pinned = ?'); args.push(input.is_pinned); }
    if (input.published_at !== undefined) { fields.push('published_at = ?'); args.push(input.published_at); }

    if (fields.length > 0) {
      fields.push('updated_at = ?'); args.push(now);
      args.push(id);
      await transaction.execute({
        sql: `UPDATE posts SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
        args,
      });
    }

    if (tagIds !== undefined) {
      await transaction.execute({
        sql: `DELETE FROM post_tags WHERE post_id = ?`,
        args: [id],
      });
      for (const tagId of tagIds) {
        await transaction.execute({
          sql: `INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)`,
          args: [id, tagId],
        });
      }
    }

    await transaction.commit();
    return { post: await getPostById(id), previousSlug };
  } finally {
    transaction.close();
  }
}

/** Soft-delete a post */
export async function softDeletePost(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE posts SET deleted_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] });
}

/** Increment view count */
export async function incrementViewCount(id: string): Promise<void> {
  await db.execute({ sql: `UPDATE posts SET view_count = view_count + 1 WHERE id = ?`, args: [id] });
}

/** Get all published post slugs (for generateStaticParams) */
export async function getAllPostSlugs(): Promise<string[]> {
  const result = await db.execute(`SELECT slug FROM posts WHERE status = 'published' AND deleted_at IS NULL`);
  return result.rows.map((r: Record<string, unknown>) => r.slug as string);
}

/** Get post slugs by category slug */
export async function getPostSlugsByCategory(categorySlug: string): Promise<string[]> {
  const result = await db.execute({
    sql: `SELECT p.slug FROM posts p JOIN categories c ON p.category_id = c.id WHERE c.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
    args: [categorySlug],
  });
  return result.rows.map((r: Record<string, unknown>) => r.slug as string);
}

/** Get post slugs by category ID */
export async function getPostSlugsByCategoryId(categoryId: string): Promise<string[]> {
  const result = await db.execute({
    sql: `SELECT slug FROM posts WHERE category_id = ? AND status = 'published' AND deleted_at IS NULL`,
    args: [categoryId],
  });
  return result.rows.map((row: Record<string, unknown>) => row.slug as string);
}

/** Get post slugs by tag ID */
export async function getPostSlugsByTagId(tagId: string): Promise<string[]> {
  const result = await db.execute({
    sql: `SELECT p.slug
          FROM posts p
          JOIN post_tags pt ON pt.post_id = p.id
          WHERE pt.tag_id = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
    args: [tagId],
  });
  return result.rows.map((row: Record<string, unknown>) => row.slug as string);
}
