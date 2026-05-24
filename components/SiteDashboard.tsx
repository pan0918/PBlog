"use client";
import { useState, useEffect } from 'react';
import { siteConfig } from '../siteConfig';

export default function SiteDashboard() {
  const [now, setNow] = useState<Date | null>(null);
  const [uptime, setUptime] = useState('');

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const buildDate = new Date(siteConfig.buildDate);
    const update = () => {
      const diff = Date.now() - buildDate.getTime();
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setUptime(`${days}D ${hours}H ${mins}M ${secs}S`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 md:p-6 transition-colors duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors duration-700">
            {now ? (
              <>
                {now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                {' '}
                {now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </>
            ) : (
              <span className="opacity-0">0000年00月00日 00:00:00</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uptime</span>
          <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{uptime}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {siteConfig.footerBadges?.map((badge) => (
            <div key={badge.name} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/30 dark:bg-slate-700/30 border border-white/20 dark:border-white/5">
              <svg className={`w-3 h-3 ${badge.color}`} viewBox="0 0 24 24" fill="currentColor" dangerouslySetInnerHTML={{ __html: badge.svg }} />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{badge.name}</span>
            </div>
          ))}
        </div>

        {siteConfig.icpConfig?.name && (
          <a href={siteConfig.icpConfig.link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-500 transition-colors">
            {siteConfig.icpConfig.name}
          </a>
        )}
      </div>
    </div>
  );
}
