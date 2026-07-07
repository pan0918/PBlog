import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import matter from 'gray-matter';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import AboutClient from '../../components/AboutClient';
import { Suspense } from 'react';
import { db } from '../../lib/db';
import { katexOptions } from '../../lib/markdown';

export default async function AboutPage() {
  const fullPath = path.join(process.cwd(), 'app', 'about', 'about.md');
  let contentHtml = "博主很懒，还没有写自我介绍哦...";
  let coverImage = "https://cloudflare-imgbed-9pz.pages.dev/file/1782542461827_上杉绘梨衣.png";

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    let { data, content } = matter(fileContents);
    if (data.cover) coverImage = data.cover;
    content = content.replace(/^```\s*$/gm, '```cpp');
    content = content.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');
    content = content.replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '');
    const blocks = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
    content = blocks.map((block, index) => {
      if (index % 2 === 1) return block;
      return block.replace(/\n{3,}/g, (match) => { const brCount = match.length - 2; return '\n\n' + '<br>'.repeat(brCount) + '\n\n'; });
    }).join('');

    const processedContent = await unified()
      .use(remarkParse).use(remarkGfm).use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      // @ts-ignore
      .use(rehypeHighlight, { detect: true, ignoreMissing: true, subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml'] })
      .use(rehypeKatex, katexOptions).use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);
    contentHtml = processedContent.toString();
  } catch (e) {}

  // Get activities from database
  const allActivities: { id: string; type: string; title: string; date: string; url: string }[] = [];

  try {
    const postsResult = await db.execute(`SELECT id, title, slug, published_at FROM posts WHERE status = 'published' AND deleted_at IS NULL`);
    for (const row of postsResult.rows) {
      const r = row as Record<string, unknown>;
      allActivities.push({
        id: `post-${r.id}`,
        type: '文章',
        title: (r.title as string) || '',
        date: (r.published_at as string) || '1970-01-01T00:00:00Z',
        url: `/posts/${r.slug}`,
      });
    }
  } catch {}

  try {
    const momentsResult = await db.execute(`SELECT id, content, published_at FROM moments WHERE status = 'published' AND deleted_at IS NULL`);
    for (const row of momentsResult.rows) {
      const r = row as Record<string, unknown>;
      allActivities.push({
        id: `moment-${r.id}`,
        type: '说说',
        title: ((r.content as string) || '').substring(0, 50),
        date: (r.published_at as string) || '1970-01-01T00:00:00Z',
        url: `/moments`,
      });
    }
  } catch {}

  allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">
          <Suspense fallback={<div className="h-96 flex items-center justify-center text-slate-500 font-bold animate-pulse">正在载入档案...</div>}>
            <AboutClient contentHtml={contentHtml} coverImage={coverImage} activities={allActivities} />
          </Suspense>
        </main>
      </PageTransition>
    </div>
  );
}
