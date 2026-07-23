import PageTransition from '../../components/PageTransition';
import FriendsBoard from './FriendsBoard';
import { getApprovedFriends } from '../../lib/db/friends';

export default async function FriendsPage() {
  const dbFriends = await getApprovedFriends();

  const friends = dbFriends.map(f => ({
    id: f.id,
    name: f.name,
    url: f.url,
    description: f.description || '',
    avatar: f.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.name)}&backgroundColor=6366f1`,
    themeColor: 'rgba(99, 102, 241, 0.5)',
  }));

  return (
    <div className="min-h-screen relative pb-20">
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">友情链接</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">欢迎交换链接，共同进步！</p>
          <FriendsBoard friends={friends} />
        </main>
      </PageTransition>
    </div>
  );
}
