"use client";
import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

interface Post { slug: string; title?: string; description?: string; tags?: string[]; date?: string; [key: string]: any; }

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const Highlight = ({ text = '', query = '' }: { text?: string; query?: string }) => {
  if (!query.trim() || !text) return <>{text}</>;
  const safeQuery = escapeRegExp(query);
  const regex = new RegExp(`(${safeQuery})`, 'gi');
  const parts = String(text).split(regex);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/80 text-slate-900 dark:text-white px-1 mx-[1px] rounded-[4px] shadow-sm font-bold">{part}</mark>
        ) : (<span key={i}>{part}</span>)
      )}
    </>
  );
};

export default function SearchBar({ posts = [] }: { posts?: Post[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return posts.filter(post => {
      const titleMatch = (post.title || '').toLowerCase().includes(query);
      const descMatch = (post.description || '').toLowerCase().includes(query);
      const tagMatch = (post.tags || []).some(tag => tag.toLowerCase().includes(query));
      return titleMatch || descMatch || tagMatch;
    });
  }, [searchQuery, posts]);

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-10 z-[100]" ref={containerRef}>
      <form className="relative group" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          className="w-full pl-14 pr-6 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-slate-200 transition-all placeholder-slate-500 dark:placeholder-slate-400 font-medium text-lg relative z-0"
          placeholder="搜寻标题、描述或标签..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          spellCheck="false"
        />
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none select-none z-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors drop-shadow-sm">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </form>

      <AnimatePresence>
        {isOpen && searchQuery.trim() !== '' && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden max-h-[450px] overflow-y-auto z-20"
          >
            {searchResults.length > 0 ? (
              <div className="flex flex-col py-3">
                {searchResults.map((post) => (
                  <Link key={post.slug} href={`/posts/${post.slug}`} onClick={() => setIsOpen(false)} className="px-6 py-5 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 transition-colors group border-b border-slate-100/50 dark:border-slate-800/50 last:border-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 transition-colors line-clamp-1">
                        <Highlight text={post.title} query={searchQuery} />
                      </h4>
                      {post.date && <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md shrink-0 mt-1">{post.date.split(' ')[0]}</span>}
                    </div>
                    {post.description && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed"><Highlight text={post.description} query={searchQuery} /></p>}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center flex flex-col items-center gap-3">
                <p className="text-slate-500 dark:text-slate-400 font-medium">数据海中未发现关于 &quot;<span className="text-indigo-500 font-bold">{searchQuery}</span>&quot; 的踪迹</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
