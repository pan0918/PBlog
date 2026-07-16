/** Parsed lyric line with timestamp */
export interface LyricLine {
  time: number; // seconds
  text: string;
}

/**
 * Parse LRC format text into an array of timed lyric lines.
 * Supports timestamps without fractions, dot/colon fractions, repeated
 * timestamps, and long-running audio with more than two minute digits.
 */
export function parseLrc(lrc: string): LyricLine[] {
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];

  for (const line of lines) {
    const timestampPattern = /\[(\d{2,}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    const text = line.replace(timestampPattern, '').trim();
    if (!text) continue;

    let match: RegExpExecArray | null;
    timestampPattern.lastIndex = 0;
    while ((match = timestampPattern.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] ? Number(`0.${match[3]}`) : 0;
      result.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}
