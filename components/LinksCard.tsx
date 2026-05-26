"use client";
import Link from 'next/link';

const links = [
  { href: '/photowall', label: '照片墙', icon: '📸', desc: '记录美好瞬间' },
  { href: '/moments', label: '说说', icon: '💭', desc: '碎碎念' },
  { href: '/chatter', label: '留言墙', icon: '💌', desc: '留下足迹' },
];

export default function LinksCard() {
  return (
    <div className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 transition-all duration-700">
      <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 tracking-tight">快捷入口</h3>
      <div className="flex flex-col gap-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/30 dark:bg-slate-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-300 group"
          >
            <span className="text-lg">{link.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{link.label}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{link.desc}</p>
            </div>
            <svg className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-all group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
