'use client';

import { useEffect, useState } from 'react';

export default function ClientViewCount({ slug, initialCount }: { slug: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const encodedSlug = slug.split('/').map(encodeURIComponent).join('/');
    fetch(`/api/posts/view/${encodedSlug}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.ok) setCount(data.viewCount);
      })
      .catch(() => {});
  }, [slug]);

  return (
    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold bg-white/30 dark:bg-slate-900/50 px-3 py-1.5 rounded-full text-xs transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      {count}
    </div>
  );
}
