import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import MessageWall from './MessageWall';
import { siteConfig } from '../../siteConfig';

export default function ChatterPage() {
  return (
    <div className="min-h-screen relative pb-20" style={{ background: "linear-gradient(180deg, rgba(245,240,232,0.4) 0%, rgba(235,228,216,0.3) 100%)" }}>
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-amber-900/80 dark:text-amber-100/80 mb-2 tracking-tight" style={{ fontFamily: "'Noto Serif SC', serif" }}>{siteConfig.chatterTitle}</h1>
            <p className="text-sm text-amber-700/50 dark:text-amber-200/40 font-medium" style={{ fontFamily: "'Noto Serif SC', serif" }}>{siteConfig.chatterDescription}</p>
          </div>
          <MessageWall />
        </main>
      </PageTransition>
    </div>
  );
}
