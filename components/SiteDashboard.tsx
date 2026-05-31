"use client";
import { useState, useEffect } from 'react';

export default function SiteDashboard() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time ? String(time.getHours()).padStart(2, '0') : '--';
  const minutes = time ? String(time.getMinutes()).padStart(2, '0') : '--';
  const seconds = time ? String(time.getSeconds()).padStart(2, '0') : '--';

  return (
    <div className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex items-center justify-center transition-all duration-700 overflow-hidden relative">
      <div className="relative z-10 flex items-baseline gap-1 font-mono font-black text-slate-800 dark:text-white/90 tracking-widest">
        <span className="text-3xl md:text-4xl">{hours}</span>
        <span className="text-3xl md:text-4xl text-slate-400 dark:text-white/40 animate-pulse">:</span>
        <span className="text-3xl md:text-4xl">{minutes}</span>
        <span className="text-3xl md:text-4xl text-slate-400 dark:text-white/40 animate-pulse">:</span>
        <span className="text-3xl md:text-4xl">{seconds}</span>
      </div>
    </div>
  );
}
