import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import AboutClient from '../../components/AboutClient';
import { Suspense } from 'react';

function getDirActivities(dirName: string, typeLabel: '文章' | '杂谈' | '说说', linkPrefix: string) {
  const dirPath = path.join(process.cwd(), dirName);
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
    const { data } = matter(content);
    return { id: `${dirName}-${file}`, type: typeLabel, title: data.title || file.replace('.md', ''), date: data.date ? new Date(data.date).toISOString() : '1970-01-01T00:00:00Z', url: `/${linkPrefix}/${file.replace('.md', '')}` };
  });
}

export default async function AboutPage() {
  const fullPath = path.join(process.cwd(), 'app', 'about', 'about.md');
  let contentHtml = "博主很懒，还没有写自我介绍哦...";
  let coverImage = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop";

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
      .use(rehypeKatex).use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);
    contentHtml = processedContent.toString();
  } catch (e) {}

  const posts = getDirActivities('posts', '文章', 'posts');
  const chatters = getDirActivities('chatters', '杂谈', 'chatter');
  const moments = getDirActivities('moments', '说说', 'moments');
  const allActivities = [...posts, ...chatters, ...moments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
