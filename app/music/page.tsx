import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import MusicClient from './MusicClient';

export default function MusicPage() {
  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-7xl mx-auto mt-24 md:mt-28 px-4 sm:px-6 md:px-10 relative z-10">
          <div className="mb-6 md:mb-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-widest mb-1 md:mb-2">云端乐律</h1>
            <p className="text-xs md:text-base text-slate-600 dark:text-slate-400 font-medium tracking-wider">音乐纯粹，爱V绝对</p>
          </div>
          <MusicClient />
        </main>
      </PageTransition>
    </div>
  );
}
