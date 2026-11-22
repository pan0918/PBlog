import PageTransition from '../components/PageTransition';
import SearchBar from '../components/SearchBar';
import { siteConfig } from '../siteConfig';
import CloudPlayer from '../components/CloudPlayer';
import ProfileCard from '../components/ProfileCard';
import NavigationCard from '../components/NavigationCard';
import HomeArticleFeed from '../components/HomeArticleFeed';
import WeatherCard from '../components/WeatherCard';
import CalendarCard from '../components/CalendarCard';
import SiteDashboard from '../components/SiteDashboard';
import SiteStats from '../components/SiteStats';
import { getAllPosts } from '../lib/posts';
import HeroBanner from '../components/HeroBanner';
import { getHomepageCounts } from '../lib/home-data';

export default async function Home() {
  const [allPosts, { momentCount, photoCount, lastPostUpdatedAt }] = await Promise.all([
    getAllPosts(),
    getHomepageCounts(),
  ]);
  const renderedAt = new Date().toISOString();
  const homePosts = allPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    cover: post.cover,
    date: post.date,
    formattedDate: post.formattedDate,
    tags: post.tags,
    viewCount: post.viewCount,
  }));

  return (
    <div className="min-h-screen relative pb-12">
      <HeroBanner />
      <PageTransition duration={0.28}>
        <div className="w-full max-w-7xl mx-auto -mt-12 md:-mt-14 px-4 sm:px-6 lg:px-10 relative z-10">
          {/* Top Search */}
          <SearchBar posts={homePosts} />

          {/* 3-Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6 mt-6">

            {/* Left Column */}
            <aside className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-6">
              <ProfileCard postCount={allPosts.length} momentCount={momentCount} photoCount={photoCount} />
              <NavigationCard />
              <SiteDashboard />
              <SiteStats lastUpdatedAt={lastPostUpdatedAt || siteConfig.buildDate} />
            </aside>

            {/* Center Column */}
            <HomeArticleFeed posts={homePosts} />

            {/* Right Column */}
            <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
              <CloudPlayer />
              <WeatherCard />
              <CalendarCard renderedAt={renderedAt} />
            </aside>

          </div>
        </div>
      </PageTransition>
    </div>
  );
}
