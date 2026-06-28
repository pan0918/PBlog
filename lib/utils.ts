/**
 * Format a date string to "YYYY.MM.DD" format.
 * Returns "刚刚更新" for missing or epoch dates.
 */
export function formatUpdateTime(dateString: string): string {
  if (!dateString || dateString === '1970-01-01') return '刚刚更新';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch {
    return dateString;
  }
}

/**
 * Format seconds to "M:SS" or "MM:SS" display string.
 */
export function formatTime(time: number): string {
  if (!time || isNaN(time)) return '00:00';
  const m = Math.floor(time / 60).toString().padStart(2, '0');
  const s = Math.floor(time % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
