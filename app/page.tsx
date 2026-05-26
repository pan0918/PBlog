import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
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
import { albums } from '../data/albums';
import { ToastProvider } from '../components/ToastProvider';

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

export default function Home() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  let allPosts: any[] = [];
  try {
    if (fs.existsSync(postsDirectory)) {
      const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md'));
      allPosts = fileNames.map(fileName => {
        const fullPath = path.join(postsDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        return { slug: fileName.replace(/\.md$/, ''), ...data, title: data.title || '', description: data.description || content.substring(0, 120), content: content || '', date: rawDate, formattedDate: formatUpdateTime(rawDate) };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  } catch (e) {}

  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let allChatters: any[] = [];
  try {
    if (fs.existsSync(chattersDirectory)) {
      const chatterFiles = fs.readdirSync(chattersDirectory).filter(f => f.endsWith('.md'));
      allChatters = chatterFiles.map(fileName => {
        const fullPath = path.join(chattersDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        return { slug: fileName.replace(/\.md$/, ''), title: data.title || '碎片记录', description: data.description || content.substring(0, 60), cover: data.cover || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop', date: rawDate, formattedDate: formatUpdateTime(rawDate) };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  } catch (e) {}

  const chatterCount = allChatters.length;
  const realPhotoCount = albums.reduce((total, album) => total + album.photos.length, 0);

  return (
    <ToastProvider>
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <div className="w-full max-w-7xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">
          {/* Top Search */}
          <SearchBar posts={allPosts} />

          {/* 3-Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6 mt-6">

            {/* Left Column */}
            <aside className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-6">
              <ProfileCard postCount={allPosts.length} chatterCount={chatterCount} photoCount={realPhotoCount} />
              <NavigationCard />
              <SiteDashboard />
            </aside>

            {/* Center Column */}
            <main className="flex-1 min-w-0 flex flex-col gap-6">
              {allPosts.length > 0 ? allPosts.map((post: any) => (
                <ArticleCard key={post.slug} post={post} />
              )) : (
                <div className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-12 text-center">
                  <p className="text-slate-400 dark:text-slate-500 font-bold">暂无文章</p>
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
