"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative z-10">
      <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 p-10 md:p-14 max-w-md">
        <div className="text-6xl mb-4" aria-hidden>🙀</div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">页面出了点小状况喵~</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 break-words">
          {error?.message || '发生了未知错误，煤球也不知道为什么…'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-full bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 active:scale-95 transition-all shadow-md shadow-indigo-500/20"
          >
            重试一下
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-white/80 dark:hover:bg-slate-700 transition-all border border-white/40 dark:border-white/10"
          >
            回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
