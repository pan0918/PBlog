import Link from 'next/link';
import PageTransition from '../../../components/PageTransition';

export default function PostNotFound() {
  return (
    <div className="min-h-screen relative pb-20">
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
