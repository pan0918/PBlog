"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Post { slug: string; title: string; date: string; tags: string[]; }

export default function TimelineClient({ posts }: { posts: Post[] }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter(p => p.tags.includes(selectedTag));
  }, [posts, selectedTag]);

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
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedTag(null)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!selectedTag ? 'bg-indigo-500 text-white' : 'bg-white/40 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-white/40 dark:border-white/10'}`}>全部</button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${tag === selectedTag ? 'bg-indigo-500 text-white' : 'bg-white/40 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-white/40 dark:border-white/10'}`}>#{tag}</button>
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
                    {post.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {post.tags.map(tag => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">#{tag}</span>)}
                      </div>
                    )}
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
