import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import PhotoWallClient from './PhotoWallClient';
import { albums } from '../../data/albums';

export default function PhotoWallPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">照片墙</h1>
          <PhotoWallClient albums={albums} />
        </main>
      </PageTransition>
    </div>
  );
}
