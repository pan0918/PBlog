import { db } from './db';
import { formatUpdateTime } from './utils';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';

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

/** 前台：获取所有已发布文章 */
export async function getAllPosts(): Promise<PostMeta[]> {
  try {
    const result = await db.execute(`
      SELECT p.slug, p.title, p.published_at, p.summary, p.cover_url, p.content, p.view_count,
             c.name as category_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published' AND p.deleted_at IS NULL
      ORDER BY p.is_pinned DESC, p.published_at DESC, p.created_at DESC
    `);

    const posts: PostMeta[] = [];
    for (const row of result.rows) {
      const r = row as Record<string, unknown>;
      // Get tags for this post
      const tagsResult = await db.execute({
        sql: `SELECT t.name FROM tags t JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = (SELECT id FROM posts WHERE slug = ?)`,
        args: [r.slug as string],
      });
      const tags = tagsResult.rows.map((t: Record<string, unknown>) => t.name as string);

      const rawDate = (r.published_at as string) || '1970-01-01';
      posts.push({
        slug: r.slug as string,
        title: (r.title as string) || '',
        date: rawDate,
        description: (r.summary as string) || ((r.content as string) || '').substring(0, 120),
        tags,
        cover: (r.cover_url as string) || '',
        category: (r.category_name as string) || null,
        formattedDate: formatUpdateTime(rawDate),
        content: (r.content as string) || '',
        viewCount: (r.view_count as number) || 0,
      });
    }
    return posts;
  } catch {
    // Fallback: if DB not configured, return empty
    return [];
  }
}

/** 获取文章详情（含 Markdown 渲染） */
export async function getPostBySlug(slug: string): Promise<{
  data: PostMeta;
  rawContent: string;
  contentHtml: string;
  toc: { level: number; text: string; id: string }[];
} | null> {
  try {
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

    // Render Markdown
    let processedContent = content;
    processedContent = processedContent.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');
    processedContent = processedContent.replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '');
    const blocks = processedContent.split(/(```[\s\S]*?```)/g);
    processedContent = blocks.map((block, index) => {
      if (index % 2 === 1) return block;
      return block.replace(/\n{3,}/g, (match) => {
        const brCount = match.length - 2;
        return '\n\n' + '<br/>'.repeat(brCount) + '\n\n';
      });
    }).join('');

    const processed = await unified()
      .use(remarkParse).use(remarkGfm).use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      // @ts-ignore
      .use(rehypeHighlight, { detect: true, ignoreMissing: true, subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml'] })
      .use(rehypeKatex).use(rehypeSlug).use(rehypeStringify, { allowDangerousHtml: true })
      .process(processedContent);

    const contentHtml = processed.toString();

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
