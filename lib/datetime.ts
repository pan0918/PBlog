// Public dates are always shown in the blog's home time zone. The server renders
// in UTC (Vercel) while visitors' browsers render in their local zone, so
// formatting with a fixed zone keeps server HTML and hydration identical.
export const SITE_TIME_ZONE = 'Asia/Shanghai';

const siteDateTimeFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export interface SiteDateParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

export function getSiteDateParts(value: string | Date): SiteDateParts | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts: Record<string, string> = {};
  for (const part of siteDateTimeFormat.formatToParts(date)) parts[part.type] = part.value;
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute };
}

/** "YYYY.MM.DD" in the site time zone, or "" for invalid input. */
export function formatSiteDate(value: string | Date, separator = '.'): string {
  const parts = getSiteDateParts(value);
  return parts ? [parts.year, parts.month, parts.day].join(separator) : '';
}

/** "HH:mm" in the site time zone, or "" for invalid input. */
export function formatSiteTime(value: string | Date): string {
  const parts = getSiteDateParts(value);
  return parts ? `${parts.hour}:${parts.minute}` : '';
}
