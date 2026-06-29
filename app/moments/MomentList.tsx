"use client";
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export interface Moment { id: string; title: string; date: string; mood: string; weather: string; content: string; }

function getMonthKey(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${y.slice(2)}年${parseInt(m)}月`;
}

const PER_PAGE = 5;

export default function MomentList({ moments }: { moments: Moment[] }) {
  const [query, setQuery] = useState('');
  const [activeMonth, setActiveMonth] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const monthKeys = useMemo(() => {
    const set = new Set<string>();
    moments.forEach(m => {
      const k = getMonthKey(m.date);
      if (k) set.add(k);
    });
    return Array.from(set).sort().reverse();
  }, [moments]);

  const filtered = useMemo(() => {
    let list = moments;
    if (activeMonth !== 'all') {
      list = list.filter(m => getMonthKey(m.date) === activeMonth);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.mood.toLowerCase().includes(q) ||
        m.weather.toLowerCase().includes(q)
      );
    }
    return list;
  }, [moments, query, activeMonth]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const handleMonthChange = (key: string) => { setActiveMonth(key); setCurrentPage(1); };
  const handleQueryChange = (v: string) => { setQuery(v); setCurrentPage(1); };

  if (!moments.length) {
    return <div className="text-center py-20 text-slate-400 dark:text-slate-500 font-bold">暂无说说</div>;
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-8 w-full md:w-96 mx-auto group">
        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-500 dark:text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="搜索说说内容..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-full text-sm text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all duration-300"
        />
      </div>

      {/* Month Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => handleMonthChange('all')}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
            activeMonth === 'all'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
              : 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/50'
          }`}
        >
          全部
        </button>
        {monthKeys.map(key => (
          <button
            key={key}
            onClick={() => handleMonthChange(key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
              activeMonth === key
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/50'
            }`}
          >
            {formatMonthLabel(key)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500 hidden md:block"></div>
        <div className="space-y-6">
          {paged.length > 0 ? paged.map((moment, i) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="md:ml-16 relative"
            >
              <div className="absolute -left-[41px] top-6 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 hidden md:block"></div>
              <div className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 transition-all duration-500 hover:scale-[1.01]">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{moment.date}</span>
                  {moment.mood && <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-bold">{moment.mood}</span>}
                  {moment.weather && <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-bold">{moment.weather}</span>}
                </div>
                {moment.title && <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{moment.title}</h3>}
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{moment.content}</p>
              </div>
            </motion.div>
          )) : (
            <div className="md:ml-16 text-center py-16 text-slate-400 dark:text-slate-500 font-bold">
              没有找到匹配的说说
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
              safePage <= 1
                ? 'bg-white/20 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                : 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 shadow-sm'
            }`}
          >
            上一页
          </button>
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
              safePage >= totalPages
                ? 'bg-white/20 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                : 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 shadow-sm'
            }`}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
