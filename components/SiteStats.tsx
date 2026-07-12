import { siteConfig } from '../siteConfig';
import { formatRelativeUpdateTime } from '../lib/site-stats';

interface SiteStatsProps {
  lastUpdatedAt: string;
}

export default function SiteStats({ lastUpdatedAt }: SiteStatsProps) {
  const launchDate = new Date(siteConfig.buildDate);
  const now = new Date();
  const days = Math.floor((now.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));

  const lastUpdate = formatRelativeUpdateTime(lastUpdatedAt, now);

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
