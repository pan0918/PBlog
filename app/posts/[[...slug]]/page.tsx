import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import matter from 'gray-matter';
import 'highlight.js/styles/atom-one-dark.css';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { siteConfig } from '../../../siteConfig';
import ClientTOC from '../../../components/ClientTOC';
import BackButton from '../../../components/BackButton';
import Comments from '../../../components/Comments';
import SidebarLyric from '../../../components/SidebarLyric';
import ProfileCard from '../../../components/ProfileCard';
import { getAllPosts } from '../../../lib/posts';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map(p => ({ slug: p.slug.split('/') }));
}

function extractToc(content: string) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const toc = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    toc.push({ level: match[1].length, text: match[2].trim(), id: match[2].trim().toLowerCase().replace(/\s+/g, '-') });
  }
  return toc;
}

async function getPostData(slugArr: string[]) {
  const slug = slugArr.join('/');
  const postsDir = path.join(process.cwd(), 'posts');
  const fullPath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  let { data, content } = matter(fileContents);
  content = content.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');
  content = content.replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '');
  const blocks = content.split(/(```[\s\S]*?```)/g);
  content = blocks.map((block, index) => {
    if (index % 2 === 1) return block;
    return block.replace(/\n{3,}/g, (match) => { const brCount = match.length - 2; return '\n\n' + '<br/>'.repeat(brCount) + '\n\n'; });
  }).join('');

  const processedContent = await unified()
    .use(remarkParse).use(remarkGfm).use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    // @ts-ignore
    .use(rehypeHighlight, { detect: true, ignoreMissing: true, subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml'] })
    .use(rehypeKatex).use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return { slug, contentHtml: processedContent.toString(), toc: extractToc(content), title: data.title, date: data.date, tags: data.tags && Array.isArray(data.tags) ? data.tags : [], cover: data.cover || siteConfig.defaultPostCover };
}

function getRecentPosts(currentSlug: string) {
  const posts = getAllPosts();
  return posts.filter(p => p.slug !== currentSlug).slice(0, 3);
}

export default async function Post({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params;
  const slugArr = resolvedParams.slug || [];
  const postData = await getPostData(slugArr);
  if (!postData) {
    return (
      <div className="min-h-screen relative pb-20">
        <Navbar />
        <PageTransition>
          <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10">
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 p-12 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">文章不存在</h1>
              <Link href="/" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">返回首页</Link>
            </div>
          </main>
        </PageTransition>
      </div>
    );
  }

  const recentPosts = getRecentPosts(postData.slug);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 flex flex-col lg:flex-row gap-6 md:gap-8 relative z-10">
          <article className="flex-1 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 relative group">
              <img src={postData.cover} alt="封面" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
            </div>
            <div className="p-5 md:p-12 relative">
              <BackButton />
              <header className="mb-6 md:mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-5 md:pb-6 relative">
                <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors duration-700 pr-16 md:pr-24 leading-snug">{postData.title}</h1>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold bg-white/30 dark:bg-slate-900/50 px-3 py-1.5 rounded-full text-xs transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {postData.date}
                  </div>
                  {postData.tags.map((tag: string) => (
                    <div key={tag} className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-bold bg-white/30 dark:bg-slate-900/50 px-2.5 py-1.5 rounded-full text-xs transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                      <span className="text-[10px] opacity-70">#</span> {tag}
                    </div>
                  ))}
                </div>
              </header>
              <div className="relative">
                <style dangerouslySetInnerHTML={{ __html: `
                  .prose h1 { font-size: 1.8rem !important; font-weight: 900 !important; margin-bottom: 1.2rem !important; margin-top: 2rem !important; line-height: 1.3 !important; color: inherit !important; }
                  .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; margin-top: 1.5rem !important; color: inherit !important; }
                  .prose h3 { font-size: 1.2rem !important; font-weight: 700 !important; margin-bottom: 0.8rem !important; color: inherit !important; }
                  .prose p { font-size: 0.95rem !important; line-height: 1.75 !important; color: inherit !important; }
                  .prose a { color: #6366f1 !important; text-decoration: none !important; font-weight: 600 !important; border-bottom: 1px dashed #6366f1 !important; }
                  .prose a:hover { color: #4f46e5 !important; border-bottom-style: solid !important; }
                  .dark .prose a { color: #818cf8 !important; border-bottom-color: #818cf8 !important; }
                  .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
                  .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
                  .prose li { display: list-item !important; margin-bottom: 0.5rem !important; }
                  .prose blockquote { border-left: 4px solid #6366f1 !important; background-color: rgba(99,102,241,0.05) !important; padding: 1rem 1.5rem !important; margin: 1.5rem 0 !important; border-radius: 0 1.25rem 1.25rem 0 !important; font-style: italic !important; color: #64748b !important; }
                  .prose blockquote p { margin: 0 !important; color: inherit !important; }
                  .dark .prose blockquote { border-left-color: #818cf8 !important; background-color: rgba(129,140,248,0.1) !important; color: #94a3b8 !important; }
                  .prose pre { background-color: #282c34 !important; color: #abb2bf !important; padding: 1rem !important; border-radius: 1.25rem !important; overflow-x: auto !important; margin-top: 1rem !important; margin-bottom: 1rem !important; }
                  .prose pre code { background-color: transparent !important; padding: 0 !important; color: inherit !important; font-size: 0.85em !important; }
                  .prose code::before, .prose code::after { content: none !important; }
                  .prose p code, .prose li code { background-color: rgba(99,102,241,0.1) !important; color: #6366f1 !important; padding: 0.2rem 0.4rem !important; border-radius: 0.5rem !important; font-size: 0.85em !important; }
                  .dark .prose p code, .dark .prose li code { background-color: rgba(99,102,241,0.2) !important; color: #818cf8 !important; }
                  .prose img { display: block !important; margin: 1.5rem auto !important; border-radius: 1rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; max-width: 100% !important; }
                  .prose br { display: block !important; content: "" !important; margin-top: 0.5em !important; }
                  @media (min-width: 768px) {
                    .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; }
                    .prose h2 { font-size: 2.2rem !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; }
                    .prose h3 { font-size: 1.5rem !important; margin-bottom: 1rem !important; }
                    .prose p { font-size: 1.15rem !important; line-height: 1.85 !important; }
                  }
                `}} />
                <div id="article-content" className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 transition-colors duration-700 scroll-smooth" dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
              </div>
              <div className="mt-12 md:mt-16"><Comments /></div>
            </div>
          </article>

          <aside className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
            <ProfileCard showStats={false} />
            <SidebarLyric />
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
              <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">RECOMMENDED</h3>
              <div className="space-y-4">
                {recentPosts.map(p => (
                  <Link key={p.slug} href={`/posts/${p.slug}`} className="group block">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{p.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase">{p.formattedDate}</p>
                  </Link>
                ))}
              </div>
            </div>
            {postData.toc.length > 0 && <ClientTOC toc={postData.toc} />}
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}
