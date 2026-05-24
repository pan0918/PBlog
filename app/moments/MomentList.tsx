"use client";
import { motion } from 'framer-motion';

interface Moment { id: string; title: string; date: string; mood: string; weather: string; content: string; }

export default function MomentList({ moments }: { moments: Moment[] }) {
  if (!moments.length) {
    return <div className="text-center py-20 text-slate-400 dark:text-slate-500 font-bold">暂无说说</div>;
  }

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500 hidden md:block"></div>
      <div className="space-y-6">
        {moments.map((moment, i) => (
          <motion.div
            key={moment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
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
        ))}
      </div>
    </div>
  );
}
