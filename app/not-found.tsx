import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative z-10">
      <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 p-10 md:p-14 max-w-md">
        <div className="text-6xl mb-4" aria-hidden>🐾</div>
        <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-2">404</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">这里什么都没有喵~ 页面可能被煤球叼走了</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-full bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 active:scale-95 transition-all shadow-md shadow-indigo-500/20"
        >
          回首页
        </Link>
      </div>
    </div>
  );
}
