"use client";
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ClientSocials from './ClientSocials';

interface Activity { id: string; type: string; title: string; date: string; url: string; }

export default function AboutClient({ contentHtml, coverImage, activities }: { contentHtml: string; coverImage: string; activities: Activity[] }) {
  const [activeTab, setActiveTab] = useState<'about' | 'activities'>('about');

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        .prose h1 { font-size: 1.8rem !important; font-weight: 900 !important; margin-bottom: 1.2rem !important; margin-top: 2rem !important; color: inherit !important; }
        .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; margin-top: 1.5rem !important; color: inherit !important; }
        .prose h3 { font-size: 1.2rem !important; font-weight: 700 !important; margin-bottom: 0.8rem !important; color: inherit !important; }
        .prose p { font-size: 0.95rem !important; line-height: 1.75 !important; color: inherit !important; }
        .prose a { color: #6366f1 !important; text-decoration: none !important; font-weight: 600 !important; border-bottom: 1px dashed #6366f1 !important; }
        .prose a:hover { color: #4f46e5 !important; border-bottom-style: solid !important; }
        .dark .prose a { color: #818cf8 !important; border-bottom-color: #818cf8 !important; }
        .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
        .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
        .prose li { display: list-item !important; margin-bottom: 0.5rem !important; }
        .prose blockquote { border-left: 4px solid #6366f1 !important; background-color: rgba(99,102,241,0.05) !important; padding: 1rem 1.5rem !important; margin: 1.5rem 0 !important; border-radius: 0 1.25rem 1.25rem 0 !important; font-style: italic !important; color: #64748b !important; }
        .prose blockquote p { margin: 0 !important; color: inherit !important; }
        .prose blockquote p::before, .prose blockquote p::after { display: none !important; content: none !important; }
        .dark .prose blockquote { border-left-color: #818cf8 !important; background-color: rgba(129,140,248,0.1) !important; color: #94a3b8 !important; }
        .prose pre { background-color: #282c34 !important; color: #abb2bf !important; padding: 1rem !important; border-radius: 1.25rem !important; overflow-x: auto !important; }
        .prose pre code { background-color: transparent !important; padding: 0 !important; color: inherit !important; font-size: 0.85em !important; }
        .prose code::before, .prose code::after { content: none !important; }
        .prose p code, .prose li code { background-color: rgba(99,102,241,0.1) !important; color: #6366f1 !important; padding: 0.2rem 0.4rem !important; border-radius: 0.5rem !important; font-size: 0.85em !important; }
        .dark .prose p code, .dark .prose li code { background-color: rgba(99,102,241,0.2) !important; color: #818cf8 !important; }
        .prose img { display: block !important; margin: 1.5rem auto !important; border-radius: 1rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; max-width: 100% !important; }
        .prose br { display: block !important; content: "" !important; margin-top: 0.5em !important; }
        .prose s, .prose del { text-decoration-line: line-through !important; opacity: 0.6; }
        @media (min-width: 768px) {
          .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; }
          .prose h2 { font-size: 2.2rem !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; }
          .prose h3 { font-size: 1.5rem !important; margin-bottom: 1rem !important; }
          .prose p { font-size: 1.15rem !important; line-height: 1.85 !important; }
        }
      `}} />

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
        <div className="space-y-3">
          {activities.map((activity, i) => (
            <motion.div key={activity.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={activity.url} className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg transition-all duration-300 hover:scale-[1.01] group">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${activity.type === '文章' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : activity.type === '杂谈' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'}`}>{activity.type}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-1 truncate">{activity.title}</span>
                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{new Date(activity.date).toLocaleDateString('zh-CN')}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
