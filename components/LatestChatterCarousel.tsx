"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

interface Chatter { slug: string; title: string; description: string; cover?: string; date?: string; formattedDate?: string; }

export default function LatestChatterCarousel({ chatters }: { chatters: Chatter[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (chatters.length <= 1) return;
    const timer = setInterval(() => setCurrent(prev => (prev + 1) % chatters.length), 5000);
    return () => clearInterval(timer);
  }, [chatters.length]);

  const chatter = chatters[current];
  if (!chatter) return null;

  return (
    <div className="h-full w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:scale-[1.02] relative group flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={chatter.slug}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col"
        >
          <div className="w-full h-32 bg-slate-200 dark:bg-slate-700 relative overflow-hidden flex-shrink-0">
            <img src={chatter.cover || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop'} alt={chatter.title} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="text-base font-bold text-white line-clamp-1 drop-shadow-lg">{chatter.title}</h3>
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-2">{chatter.formattedDate || chatter.date}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed flex-1">{chatter.description}</p>
            <Link href={`/chatter/${chatter.slug}`} className="mt-3 text-xs font-bold text-purple-500 hover:text-purple-600 transition-colors">
              查看详情 →
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-1.5 pb-3">
        {chatters.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-purple-500 w-4' : 'bg-slate-300 dark:bg-slate-600'}`} />
        ))}
      </div>
    </div>
  );
}
