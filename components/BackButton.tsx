"use client";
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-md border border-white/40 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-lg z-10"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
    </button>
  );
}
