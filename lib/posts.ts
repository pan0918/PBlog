import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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
}

function formatUpdateTime(dateString: string) {
  if (!dateString || dateString === '1970-01-01') return '刚刚更新';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch { return dateString; }
}

function scanPosts(dir: string, baseDir: string): PostMeta[] {
  const results: PostMeta[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanPosts(fullPath, baseDir));
    } else if (entry.name.endsWith('.md')) {
      const relPath = path.relative(baseDir, fullPath);
      const slug = relPath.replace(/\.md$/, '');
      const category = path.dirname(relPath) === '.' ? null : path.dirname(relPath);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      const rawDate = data.date || '1970-01-01';
      results.push({
        slug,
        title: data.title || '',
        date: rawDate,
        description: data.description || content.substring(0, 120),
        tags: Array.isArray(data.tags) ? data.tags : [],
        cover: data.cover || '',
        category,
        formattedDate: formatUpdateTime(rawDate),
        content: content || '',
      });
    }
  }
  return results;
}

export function getAllPosts(): PostMeta[] {
  const postsDir = path.join(process.cwd(), 'posts');
  return scanPosts(postsDir, postsDir).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): { data: PostMeta; rawContent: string; contentHtml: string; toc: { level: number; text: string; id: string }[] } | null {
  const postsDir = path.join(process.cwd(), 'posts');
  const fullPath = path.join(postsDir, slug + '.md');
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const rawDate = data.date || '1970-01-01';
  const category = path.dirname(slug) === '.' ? null : path.dirname(slug);

  return {
    data: {
      slug,
      title: data.title || '',
      date: rawDate,
      description: data.description || content.substring(0, 120),
      tags: Array.isArray(data.tags) ? data.tags : [],
      cover: data.cover || '',
      category,
      formattedDate: formatUpdateTime(rawDate),
      content: content || '',
    },
    rawContent: content,
    contentHtml: '', // filled by caller
    toc: [],
  };
}
