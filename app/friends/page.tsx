import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import FriendsBoard from './FriendsBoard';
import { friendsData } from '../../data/friends';

export default function FriendsPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">友情链接</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">欢迎交换链接，共同进步！</p>
          <FriendsBoard friends={friendsData} />
        </main>
      </PageTransition>
    </div>
  );
}
