export type TimedLyric = {
  time: number;
  text: string;
};

// Move the next line into focus shortly before its vocal starts, like mainstream players.
export const LYRIC_DISPLAY_LEAD_SECONDS = 0.3;

export function getActiveLyricIndex(
  lyrics: TimedLyric[],
  currentTime: number,
  leadSeconds = LYRIC_DISPLAY_LEAD_SECONDS,
): number {
  if (!Number.isFinite(currentTime) || lyrics.length === 0) return -1;

  const displayTime = currentTime + leadSeconds;
  for (let index = lyrics.length - 1; index >= 0; index -= 1) {
    if (displayTime >= lyrics[index].time) return index;
  }
  return -1;
}

export function getNextLyricDelayMs(
  lyrics: TimedLyric[],
  currentTime: number,
  leadSeconds = LYRIC_DISPLAY_LEAD_SECONDS,
): number | null {
  const activeIndex = getActiveLyricIndex(lyrics, currentTime, leadSeconds);
  const nextLyric = lyrics[activeIndex + 1];
  if (!nextLyric) return null;

  return Math.max(
    0,
    Math.round((nextLyric.time - currentTime - leadSeconds) * 1000),
  );
}
