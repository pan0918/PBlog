import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { siteConfig } from '../../../siteConfig';
import ClientTOC from '../../../components/ClientTOC';
import Comments from '../../../components/Comments';
import SidebarLyric from '../../../components/SidebarLyric';
import ProfileCard from '../../../components/ProfileCard';
import ClientViewCount from '../../../components/ClientViewCount';
import { getAllPosts, getPostBySlug } from '../../../lib/posts';

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(p => ({ slug: p.slug.split('/') }));
}

function getRecentPosts(currentSlug: string, allPosts: { slug: string; title: string; formattedDate: string }[]) {
  return allPosts.filter(p => p.slug !== currentSlug).slice(0, 3);
}

export default async function Post({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params;
  const slugArr = resolvedParams.slug || [];
  const slug = slugArr.join('/');

  const postData = await getPostBySlug(slug);

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

  const allPosts = await getAllPosts();
  const recentPosts = getRecentPosts(postData.data.slug, allPosts);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[92%] max-w-[1440px] mx-auto mt-24 md:mt-28 flex flex-col lg:flex-row gap-6 md:gap-8 relative z-10">
          <article className="flex-1 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 relative group">
              <img src={postData.data.cover || siteConfig.defaultPostCover} alt="封面" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
            </div>
            <div className="p-5 md:p-12 relative">
              <Link href="/timeline" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 dark:border-white/10 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-300 shadow-sm mb-4">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                返回上一级
              </Link>
              <header className="mb-6 md:mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-5 md:pb-6 relative">
                <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors duration-700 pr-16 md:pr-24 leading-snug">{postData.data.title}</h1>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold bg-white/30 dark:bg-slate-900/50 px-3 py-1.5 rounded-full text-xs transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {postData.data.formattedDate}
                  </div>
                  <ClientViewCount slug={postData.data.slug} initialCount={postData.data.viewCount} />
                  {postData.data.category && (
                    <div className="flex items-center gap-1 text-green-700 dark:text-green-400 font-bold bg-white/30 dark:bg-slate-900/50 px-2.5 py-1.5 rounded-full text-xs transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                      📂 {postData.data.category}
                    </div>
                  )}
                  {postData.data.tags.map((tag: string) => (
                    <div key={tag} className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-bold bg-white/30 dark:bg-slate-900/50 px-2.5 py-1.5 rounded-full text-xs transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                      <span className="text-[10px] opacity-70">#</span> {tag}
                    </div>
                  ))}
                </div>
              </header>
              <div className="relative">
                <div id="article-content" className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 transition-colors duration-700 scroll-smooth scroll-mt-24" dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
              </div>
            </div>
          </article>

          <aside className="w-full lg:w-[360px] flex flex-col gap-6 flex-shrink-0">
            <ProfileCard showStats={false} surfaceTone="slate" />
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
            {postData.toc.length > 0 && (
              <div className="sticky top-24">
                <ClientTOC toc={postData.toc} />
              </div>
            )}
            <Comments postId={postData.data.id} postTitle={postData.data.title} />
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}
