"use client";
import { siteConfig } from '../siteConfig';

interface SiteStatsProps {
  lastPostDate: string;
}

export default function SiteStats({ lastPostDate }: SiteStatsProps) {
  const launchDate = new Date(siteConfig.buildDate);
  const now = new Date();
  const days = Math.floor((now.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));

  const lastDate = new Date(lastPostDate);
  const diffMs = now.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let lastUpdate = '刚刚';
  if (diffDays > 365) lastUpdate = `${Math.floor(diffDays / 365)} 年前`;
  else if (diffDays > 30) lastUpdate = `${Math.floor(diffDays / 30)} 个月前`;
  else if (diffDays > 0) lastUpdate = `${diffDays} 天前`;

  const items = [
    { icon: '🕐', label: '运行天数', value: `${days} 天` },
    { icon: '📝', label: '最后更新', value: lastUpdate },
  ];

  return (
    <div className="soft-glass-panel rounded-3xl p-5 transition-all duration-700">
      <h3 className="font-black text-slate-800 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">站点统计</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{item.icon}</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
