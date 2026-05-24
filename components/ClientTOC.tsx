"use client";
import { useState, useEffect } from 'react';

interface TocItem { level: number; text: string; id: string; }

export default function ClientTOC({ toc }: { toc: TocItem[] }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    toc.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
      <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">TABLE OF CONTENTS</h3>
      <nav className="space-y-2">
        {toc.map((item, i) => (
          <a
            key={i}
            href={`#${item.id}`}
            className={`block text-xs font-bold transition-colors duration-300 truncate ${
              activeId === item.id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'
            }`}
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
