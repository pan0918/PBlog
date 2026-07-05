import { db } from '../db';

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

/** 前台：获取已发布文章 */
export async function getPublishedPosts(): Promise<PostWithMeta[]> {
  const result = await db.execute(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published' AND p.deleted_at IS NULL
    ORDER BY p.is_pinned DESC, p.published_at DESC, p.created_at DESC
  `);

  const posts = result.rows as unknown as PostWithMeta[];
  for (const post of posts) {
    const tagsResult = await db.execute({
      sql: `SELECT t.id, t.name, t.slug FROM tags t JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ?`,
      args: [post.id],
    });
    post.tags = tagsResult.rows as unknown as { id: string; name: string; slug: string }[];
  }
  return posts;
}

/** 后台：获取所有文章（含草稿） */
export async function getAdminPosts(): Promise<PostWithMeta[]> {
  const result = await db.execute(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.deleted_at IS NULL
    ORDER BY p.updated_at DESC
  `);

  const posts = result.rows as unknown as PostWithMeta[];
  for (const post of posts) {
    const tagsResult = await db.execute({
      sql: `SELECT t.id, t.name, t.slug FROM tags t JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ?`,
      args: [post.id],
    });
    post.tags = tagsResult.rows as unknown as { id: string; name: string; slug: string }[];
  }
  return posts;
}

/** 根据 ID 获取文章 */
export async function getPostById(id: string): Promise<PostWithMeta | null> {
  const result = await db.execute({
    sql: `SELECT p.*, c.name as category_name, c.slug as category_slug FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ? AND p.deleted_at IS NULL`,
    args: [id],
  });
  if (result.rows.length === 0) return null;
  const post = result.rows[0] as unknown as PostWithMeta;
  const tagsResult = await db.execute({
    sql: `SELECT t.id, t.name, t.slug FROM tags t JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ?`,
    args: [post.id],
  });
  post.tags = tagsResult.rows as unknown as { id: string; name: string; slug: string }[];
  return post;
}

/** 前台：根据 slug 获取已发布文章 */
export async function getPublishedPostBySlug(slug: string): Promise<PostWithMeta | null> {
  let result = await db.execute({
    sql: `SELECT p.*, c.name as category_name, c.slug as category_slug FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
    args: [slug],
  });
  if (result.rows.length === 0 && slug.includes('/')) {
    const legacySlug = slug.replace(/\//g, '-');
    result = await db.execute({
      sql: `SELECT p.*, c.name as category_name, c.slug as category_slug FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
      args: [legacySlug],
    });
  }
  if (result.rows.length === 0) return null;
  const post = result.rows[0] as unknown as PostWithMeta;
  const tagsResult = await db.execute({
    sql: `SELECT t.id, t.name, t.slug FROM tags t JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ?`,
    args: [post.id],
  });
  post.tags = tagsResult.rows as unknown as { id: string; name: string; slug: string }[];
  return post;
}

/** 创建文章及标签，保证原子写入 */
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

/** 更新文章及标签，保证原子写入 */
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

/** 软删除文章 */
export async function softDeletePost(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({ sql: `UPDATE posts SET deleted_at = ?, updated_at = ? WHERE id = ?`, args: [now, now, id] });
}

/** 增加浏览量 */
export async function incrementViewCount(id: string): Promise<void> {
  await db.execute({ sql: `UPDATE posts SET view_count = view_count + 1 WHERE id = ?`, args: [id] });
}

/** 获取所有文章 slug（用于 generateStaticParams） */
export async function getAllPostSlugs(): Promise<string[]> {
  const result = await db.execute(`SELECT slug FROM posts WHERE status = 'published' AND deleted_at IS NULL`);
  return result.rows.map((r: Record<string, unknown>) => r.slug as string);
}

/** 获取分类下文章 slug */
export async function getPostSlugsByCategory(categorySlug: string): Promise<string[]> {
  const result = await db.execute({
    sql: `SELECT p.slug FROM posts p JOIN categories c ON p.category_id = c.id WHERE c.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
    args: [categorySlug],
  });
  return result.rows.map((r: Record<string, unknown>) => r.slug as string);
}

export async function getPostSlugsByCategoryId(categoryId: string): Promise<string[]> {
  const result = await db.execute({
    sql: `SELECT slug FROM posts WHERE category_id = ? AND status = 'published' AND deleted_at IS NULL`,
    args: [categoryId],
  });
  return result.rows.map((row: Record<string, unknown>) => row.slug as string);
}

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
