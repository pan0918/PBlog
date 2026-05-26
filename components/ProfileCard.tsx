"use client";

import { useRouter } from 'next/navigation';
import { siteConfig } from '../siteConfig';
import { useToast } from './ToastProvider';

export default function ProfileCard({ postCount, chatterCount, photoCount }: { postCount: number; chatterCount: number; photoCount: number }) {
  const router = useRouter();
  const { showToast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label}已复制到剪贴板: ${text}`, 'success');
  };

  return (
    <div
      onClick={() => router.push('/about')}
      className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col items-center text-center transition-all duration-700 hover:scale-[1.02] cursor-pointer group relative overflow-hidden"
    >
      {/* Avatar */}
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 shadow-lg mb-4 transition-transform duration-500 group-hover:rotate-3 group-hover:scale-105">
        <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full rounded-xl object-cover bg-white" />
      </div>

      {/* Name */}
      <h1 className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
        {siteConfig.authorName}
      </h1>

      {/* Bio */}
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4 line-clamp-2">
        {siteConfig.bio}
      </p>

      {/* Social Icons */}
      <div className="flex gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
        <SocialBtn type="github" />
        <SocialBtn type="email" onClick={() => copyToClipboard(siteConfig.social?.email || '', '邮箱')} />
        <SocialBtn type="qq" onClick={() => copyToClipboard(siteConfig.social?.qq || '', 'QQ号')} />
        <SocialBtn type="twitter" />
        <SocialBtn type="xiaohongshu" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 w-full justify-center pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
        <StatItem count={postCount} label="文章" color="text-indigo-600 dark:text-indigo-400" />
        <div className="w-px h-6 bg-slate-300/50 dark:bg-slate-700"></div>
        <StatItem count={chatterCount} label="杂谈" color="text-purple-600 dark:text-purple-400" />
        <div className="w-px h-6 bg-slate-300/50 dark:bg-slate-700"></div>
        <StatItem count={photoCount} label="照片" color="text-pink-600 dark:text-pink-400" />
      </div>
    </div>
  );
}

function StatItem({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="text-center group/stat px-1">
      <div className={`text-lg font-black ${color} transition-transform group-hover/stat:scale-110`}>{count}</div>
      <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function SocialBtn({ type, onClick }: { type: string; onClick?: () => void }) {
  const urlMap: Record<string, string | undefined> = {
    github: siteConfig.social?.github,
    twitter: siteConfig.social?.twitter,
    xiaohongshu: siteConfig.social?.xiaohongshu,
  };
  const url = urlMap[type];
  const getIcon = () => {
    switch (type) {
      case 'github': return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>;
      case 'email': return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
      case 'qq': return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-4.418 0-8 3.582-8 8 0 1.25.289 2.433.805 3.49-1.024 1.708-1.53 3.843-1.021 5.308.203.585.806.84 1.341.57.828-.418 1.625-1.025 2.296-1.722 1.335.539 2.862.854 4.579.854 1.716 0 3.243-.315 4.578-.854.671.697 1.468 1.304 2.296 1.722.535.27 1.138.015 1.341-.57.509-1.465.003-3.6-1.021-5.308C19.71 12.433 20 11.25 20 10c0-4.418-3.582-8-8-8zm-2.5 8c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2zm5 0c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2z"/></svg>;
      case 'xiaohongshu': return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
      case 'twitter': return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
      default: return null;
    }
  };
  const content = (
    <div onClick={onClick} className="w-9 h-9 rounded-xl bg-white/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all duration-300 border border-white/40 dark:border-white/10 shadow-sm" title={type}>
      {getIcon()}
    </div>
  );
  return <a href={url || undefined} target="_blank" rel="noopener noreferrer">{content}</a>;
}
