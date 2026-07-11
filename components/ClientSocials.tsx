"use client";
import { siteConfig } from '../siteConfig';
import { useToast } from './ToastProvider';

const btnClass = "w-9 h-9 rounded-xl bg-white/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all duration-300 border border-white/40 dark:border-white/10 shadow-sm";

export default function ClientSocials() {
  const { showToast } = useToast();
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label}已复制到剪贴板: ${text}`, 'success');
  };

  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {siteConfig.social?.github && (
        <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className={btnClass}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
        </a>
      )}
      {siteConfig.social?.email && (
        <button type="button" onClick={() => copy(siteConfig.social!.email!, '邮箱')} className={btnClass}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        </button>
      )}
      {siteConfig.social?.qq && (
        <button type="button" onClick={() => copy(siteConfig.social!.qq!, 'QQ号')} className={btnClass}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-4.418 0-8 3.582-8 8 0 1.25.289 2.433.805 3.49-1.024 1.708-1.53 3.843-1.021 5.308.203.585.806.84 1.341.57.828-.418 1.625-1.025 2.296-1.722 1.335.539 2.862.854 4.579.854 1.716 0 3.243-.315 4.578-.854.671.697 1.468 1.304 2.296 1.722.535.27 1.138.015 1.341-.57.509-1.465.003-3.6-1.021-5.308C19.71 12.433 20 11.25 20 10c0-4.418-3.582-8-8-8zm-2.5 8c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2zm5 0c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2z"/></svg>
        </button>
      )}
      {siteConfig.social?.wechat && (
        <button type="button" onClick={() => copy(siteConfig.social!.wechat!, '微信')} className={btnClass}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zM14.54 13.21a.96.96 0 01.962.966.96.96 0 01-.962.966.96.96 0 01-.961-.966.96.96 0 01.961-.966zm4.917 0a.96.96 0 01.962.966.96.96 0 01-.962.966.96.96 0 01-.961-.966.96.96 0 01.961-.966z"/></svg>
        </button>
      )}
      {siteConfig.social?.twitter && (
        <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className={btnClass}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
      )}
      {siteConfig.social?.xiaohongshu && (
        <a href={siteConfig.social.xiaohongshu} target="_blank" rel="noopener noreferrer" className={btnClass}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </a>
      )}
    </div>
  );
}
