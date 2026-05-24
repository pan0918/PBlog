"use client";
import { useEffect, useRef } from 'react';
import { siteConfig } from '../siteConfig';

export default function Comments() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const config = siteConfig.gitalkConfig;
    if (!config.clientID || !config.repo) return;

    const initGitalk = async () => {
      try {
        const Gitalk = (await import('gitalk')).default;
        const gitalk = new Gitalk({
          clientID: config.clientID,
          clientSecret: config.clientSecret,
          repo: config.repo,
          owner: config.owner,
          admin: config.admin,
          id: location.pathname,
          distractionFreeMode: false,
        });
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          gitalk.render(containerRef.current);
        }
      } catch (e) { /* gitalk not available */ }
    };

    initGitalk();
  }, []);

  if (!siteConfig.gitalkConfig.clientID) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm font-bold">
        评论系统暂未配置
      </div>
    );
  }

  return <div ref={containerRef} />;
}
