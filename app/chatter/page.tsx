import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import MessageWall from './MessageWall';
import { siteConfig } from '../../siteConfig';

export default function ChatterPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight drop-shadow-sm">{siteConfig.chatterTitle}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-200/80 font-medium drop-shadow-sm">{siteConfig.chatterDescription}</p>
          </div>
          <MessageWall />
        </main>
      </PageTransition>
    </div>
  );
}
