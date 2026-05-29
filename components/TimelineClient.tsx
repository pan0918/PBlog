"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Post { slug: string; title: string; date: string; tags: string[]; category: string | null; }

export default function TimelineClient({ posts }: { posts: Post[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const catSet = new Set<string>();
    posts.forEach(p => { if (p.category) catSet.add(p.category); });
    return Array.from(catSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return posts;
    return posts.filter(p => p.category === selectedCategory);
  }, [posts, selectedCategory]);

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
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!selectedCategory ? 'bg-indigo-500 text-white' : 'bg-white/40 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-white/40 dark:border-white/10'}`}>全部</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${cat === selectedCategory ? 'bg-indigo-500 text-white' : 'bg-white/40 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-white/40 dark:border-white/10'}`}>{cat}</button>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
        {groupedByYear.map(([year, yearPosts]) => (
          <div key={year} className="mb-10">
            <div className="flex items-center gap-3 mb-6 ml-2">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg z-10">{year.slice(2)}</div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{year}</h2>
              <span className="text-xs text-slate-400 font-bold">{yearPosts.length} 篇</span>
            </div>
            <div className="space-y-4 ml-16">
              {yearPosts.map((post, i) => (
                <motion.div key={post.slug} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/posts/${post.slug}`} className="block rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl group">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{post.title}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">{post.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {post.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">{post.category}</span>
                      )}
                      {post.tags.length > 0 && post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">#{tag}</span>
                      ))}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
