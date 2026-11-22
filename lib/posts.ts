import { db } from './db';
import { formatUpdateTime } from './utils';
import { renderMarkdownContent } from './markdown';
import { unstable_cache } from 'next/cache';

export interface PostMeta {
  id: string;
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  cover: string;
  category: string | null;
  formattedDate: string;
  viewCount: number;
}

/**
 * 前台：获取所有已发布文章。
 * 数据库错误直接抛出：失败结果不会进入缓存，ISR 会继续提供上一次成功生成的页面。
 */
async function queryAllPosts(): Promise<PostMeta[]> {
  const result = await db.execute(`
    SELECT p.id, p.slug, p.title, p.published_at, p.summary, p.cover_url, substr(p.content, 1, 120) AS excerpt, p.view_count,
           c.name as category_name,
           COALESCE((
             SELECT json_group_array(t.name)
             FROM post_tags pt
             JOIN tags t ON t.id = pt.tag_id
             WHERE pt.post_id = p.id
           ), '[]') as tags_json
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published' AND p.deleted_at IS NULL
    ORDER BY p.is_pinned DESC, p.published_at DESC, p.created_at DESC
  `);

  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    const rawDate = (r.published_at as string) || '1970-01-01';
    let tags: string[] = [];
    try {
      const parsed = JSON.parse((r.tags_json as string) || '[]');
      if (Array.isArray(parsed)) tags = parsed.filter((tag): tag is string => typeof tag === 'string');
    } catch {}

    return {
      id: r.id as string,
      slug: r.slug as string,
      title: (r.title as string) || '',
      date: rawDate,
      description: (r.summary as string) || (r.excerpt as string) || '',
      tags,
      cover: (r.cover_url as string) || '',
      category: (r.category_name as string) || null,
      formattedDate: formatUpdateTime(rawDate),
      viewCount: (r.view_count as number) || 0,
    };
  });
}

export const getAllPosts = unstable_cache(
  queryAllPosts,
  ['published-posts'],
  { tags: ['posts'], revalidate: 300 },
);

/**
 * 获取文章详情（含 Markdown 渲染）。文章不存在时返回 null；
 * 数据库错误直接抛出，避免把一次临时故障缓存成"文章不存在"。
 */
export async function getPostBySlug(slug: string): Promise<{
  data: PostMeta;
  contentHtml: string;
  toc: { level: number; text: string; id: string }[];
} | null> {
  let result = await db.execute({
    sql: `SELECT p.*, c.name as category_name FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
    args: [slug],
  });

  if (result.rows.length === 0 && slug.includes('/')) {
    const legacySlug = slug.replace(/\//g, '-');
    result = await db.execute({
      sql: `SELECT p.*, c.name as category_name FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.status = 'published' AND p.deleted_at IS NULL`,
      args: [legacySlug],
    });
  }

  if (result.rows.length === 0) return null;

  const r = result.rows[0] as Record<string, unknown>;
  const content = (r.content as string) || '';
  const rawDate = (r.published_at as string) || '1970-01-01';

  // Get tags
  const tagsResult = await db.execute({
    sql: `SELECT t.name FROM tags t JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ?`,
    args: [r.id as string],
  });
  const tags = tagsResult.rows.map((t: Record<string, unknown>) => t.name as string);

  const contentHtml = await renderMarkdownContent(content);

  // Extract TOC
  const headingRegex = /<h([1-3])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h[1-3]>/g;
  const toc: { level: number; text: string; id: string }[] = [];
  let match;
  while ((match = headingRegex.exec(contentHtml)) !== null) {
    const text = match[3].replace(/<[^>]*>/g, '').trim();
    toc.push({ level: parseInt(match[1]), text, id: match[2] });
  }

  return {
    data: {
      id: r.id as string,
      slug: r.slug as string,
      title: (r.title as string) || '',
      date: rawDate,
      description: (r.summary as string) || content.substring(0, 120),
      tags,
      cover: (r.cover_url as string) || '',
      category: (r.category_name as string) || null,
      formattedDate: formatUpdateTime(rawDate),
      viewCount: (r.view_count as number) || 0,
    },
    contentHtml,
    toc,
  };
}
