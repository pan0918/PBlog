import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import TimelineClient from '../../components/TimelineClient';

export default function TimelinePage() {
  const postsDir = path.join(process.cwd(), 'posts');
  let posts: any[] = [];
  try {
    if (fs.existsSync(postsDir)) {
      const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
      posts = files.map(f => {
        const content = fs.readFileSync(path.join(postsDir, f), 'utf8');
        const { data } = matter(content);
        return { slug: f.replace(/\.md$/, ''), title: data.title || '无标题', date: data.date || '', tags: data.tags || [] };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  } catch (e) {}

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">归档</h1>
          <TimelineClient posts={posts} />
        </main>
      </PageTransition>
    </div>
  );
}
