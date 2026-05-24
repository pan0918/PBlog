"use client";
import { useRouter, usePathname } from 'next/navigation';

export default function MobileBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <button
      onClick={() => router.back()}
      className="fixed bottom-6 left-6 w-12 h-12 rounded-full bg-indigo-500/80 backdrop-blur-xl text-white flex items-center justify-center shadow-lg z-[55] md:hidden border border-white/30"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
    </button>
  );
}
