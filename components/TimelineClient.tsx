"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Post { slug: string; title: string; date: string; tags: string[]; category: string | null; }

export default function TimelineClient({ posts }: { posts: Post[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const catSet = new Set<string>();
    posts.forEach(p => { if (p.category) catSet.add(p.category); });
    return Array.from(catSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    return result;
  }, [posts, selectedCategory, query]);

  const groupedByYear = useMemo(() => {
    const groups: Record<string, Post[]> = {};
    filteredPosts.forEach(p => {
      const year = p.date ? p.date.substring(0, 4) : '未知';
      if (!groups[year]) groups[year] = [];
      groups[year].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredPosts]);

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-6 w-full md:w-96 mx-auto group">
        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-stone-400 group-focus-within:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="搜寻被封存的知识..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="soft-glass-panel-strong w-full h-12 pl-12 pr-4 rounded-full text-sm text-stone-800 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/35 transition-all duration-300"
        />
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!selectedCategory ? 'bg-amber-500 text-white shadow-lg shadow-amber-600/20' : 'soft-glass-panel text-stone-600 dark:text-stone-300'}`}>全部</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${cat === selectedCategory ? 'bg-amber-500 text-white shadow-lg shadow-amber-600/20' : 'soft-glass-panel text-stone-600 dark:text-stone-300'}`}>{cat}</button>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 to-orange-400"></div>
        {groupedByYear.length > 0 ? groupedByYear.map(([year, yearPosts]) => (
          <div key={year} className="mb-10">
            <div className="flex items-center gap-3 mb-6 ml-2">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-600/25 z-10">{year.slice(2)}</div>
              <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100">{year}</h2>
              <span className="text-xs text-stone-400 font-bold">{yearPosts.length} 篇</span>
            </div>
            <div className="space-y-4 ml-16">
              {yearPosts.map((post, i) => (
                <motion.div key={post.slug} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/posts/${post.slug}`} className="soft-glass-panel block rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01] group">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{post.title}</h3>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">{post.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {post.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold">{post.category}</span>
                      )}
                      {post.tags.length > 0 && post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100/70 dark:bg-stone-900/35 text-stone-500 dark:text-stone-400 font-bold">#{tag}</span>
                      ))}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )) : (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 font-bold ml-16">
            没有找到匹配的文章
          </div>
        )}
      </div>
    </div>
  );
}
