const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeUpdateTime(dateString: string, now = new Date()): string {
  if (!dateString) return '暂无';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '暂无';

  const diffMs = Math.max(0, now.getTime() - date.getTime());
  if (diffMs < MINUTE_MS) return '刚刚';
  if (diffMs < HOUR_MS) return `${Math.floor(diffMs / MINUTE_MS)} 分钟前`;
  if (diffMs < DAY_MS) return `${Math.floor(diffMs / HOUR_MS)} 小时前`;
  if (diffMs < 30 * DAY_MS) return `${Math.floor(diffMs / DAY_MS)} 天前`;

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}.${value('month')}.${value('day')}`;
}
