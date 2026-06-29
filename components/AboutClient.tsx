"use client";
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ClientSocials from './ClientSocials';

interface Activity { id: string; type: string; title: string; date: string; url: string; }

const PER_PAGE = 5;

export default function AboutClient({ contentHtml, coverImage, activities }: { contentHtml: string; coverImage: string; activities: Activity[] }) {
  const [activeTab, setActiveTab] = useState<'about' | 'activities'>('about');
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(activities.length / PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paged = activities.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <div>
      {/* Cover */}
      <div className="w-full h-48 md:h-64 rounded-3xl overflow-hidden mb-8 relative group">
        <img src={coverImage} alt="cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('about')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'about' ? 'bg-indigo-500 text-white' : 'bg-white/40 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-white/40 dark:border-white/10'}`}>关于我</button>
        <button onClick={() => setActiveTab('activities')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'activities' ? 'bg-indigo-500 text-white' : 'bg-white/40 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-white/40 dark:border-white/10'}`}>动态日志</button>
      </div>

      {activeTab === 'about' ? (
        <div className="rounded-3xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl p-6 md:p-10">
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
            <ClientSocials />
          </div>
        </div>
      ) : (
        <div>
          <div className="space-y-3">
            {paged.map((activity, i) => (
              <motion.div key={activity.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={activity.url} className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg transition-all duration-300 hover:scale-[1.01] group">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${activity.type === '文章' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'}`}>{activity.type}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-1 truncate">{activity.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{new Date(activity.date).toLocaleDateString('zh-CN')}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {activities.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-8">
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
      )}
    </div>
  );
}
