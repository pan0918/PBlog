import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import SearchBar from '../components/SearchBar';
import { siteConfig } from '../siteConfig';
import CloudPlayer from '../components/CloudPlayer';
import ProfileCard from '../components/ProfileCard';
import NavigationCard from '../components/NavigationCard';
import ArticleCard from '../components/ArticleCard';
import WeatherCard from '../components/WeatherCard';
import CalendarCard from '../components/CalendarCard';
import SiteDashboard from '../components/SiteDashboard';
import SiteStats from '../components/SiteStats';
import { albums } from '../data/albums';
import { ToastProvider } from '../components/ToastProvider';
import { getAllPosts } from '../lib/posts';
import HeroBanner from '../components/HeroBanner';

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

const POSTS_PER_PAGE = 5;

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);

  const allPosts = getAllPosts();
  const totalPages = Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * POSTS_PER_PAGE;
  const posts = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const momentsDirectory = path.join(process.cwd(), 'moments');
  let momentCount = 0;
  try {
    if (fs.existsSync(momentsDirectory)) {
      momentCount = fs.readdirSync(momentsDirectory).filter(f => f.endsWith('.md')).length;
    }
  } catch (e) {}
  const realPhotoCount = albums.reduce((total, album) => total + album.photos.length, 0);

  return (
    <ToastProvider>
    <div className="min-h-screen relative pb-12">
      <Navbar />
      <HeroBanner />
      <PageTransition>
        <div className="w-full max-w-7xl mx-auto -mt-12 md:-mt-14 px-4 sm:px-6 lg:px-10 relative z-10">
          {/* Top Search */}
          <SearchBar posts={allPosts} />

          {/* 3-Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6 mt-6">

            {/* Left Column */}
            <aside className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-6">
              <ProfileCard postCount={allPosts.length} momentCount={momentCount} photoCount={realPhotoCount} />
              <NavigationCard />
              <SiteDashboard />
              <SiteStats lastPostDate={allPosts[0]?.date || siteConfig.buildDate} />
            </aside>

            {/* Center Column */}
            <main className="flex-1 min-w-0 flex flex-col gap-6">
              {posts.length > 0 ? posts.map((post: any) => (
                <ArticleCard key={post.slug} post={post} />
              )) : (
                <div className="soft-glass-panel rounded-3xl p-12 text-center">
                  <p className="text-slate-400 dark:text-slate-500 font-bold">暂无文章</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  {safePage > 1 ? (
                    <Link href={`/?page=${safePage - 1}`} className="soft-glass-panel px-4 py-2 rounded-full text-sm font-bold text-stone-600 dark:text-stone-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                      上一页
                    </Link>
                  ) : (
                    <span className="px-4 py-2 rounded-full bg-white/20 dark:bg-slate-800/30 text-sm font-bold text-slate-300 dark:text-slate-600 cursor-not-allowed">
                      上一页
                    </span>
                  )}
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    {safePage} / {totalPages}
                  </span>
                  {safePage < totalPages ? (
                    <Link href={`/?page=${safePage + 1}`} className="soft-glass-panel px-4 py-2 rounded-full text-sm font-bold text-stone-600 dark:text-stone-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                      下一页
                    </Link>
                  ) : (
                    <span className="px-4 py-2 rounded-full bg-white/20 dark:bg-slate-800/30 text-sm font-bold text-slate-300 dark:text-slate-600 cursor-not-allowed">
                      下一页
                    </span>
                  )}
                </div>
              )}
            </main>

            {/* Right Column */}
            <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
              <CloudPlayer />
              <WeatherCard />
              <CalendarCard />
            </aside>

          </div>
        </div>
      </PageTransition>
    </div>
    </ToastProvider>
  );
}
