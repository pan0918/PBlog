"use client";

import { useRef, useCallback, useEffect } from "react";
import { musicPlaybackStore } from "../lib/music-playback-store";
import { getNextLyricDelayMs } from "../lib/music-lyrics";
import type { LyricLine } from "../lib/music-parse";

interface LyricSyncOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  parsedLyrics: LyricLine[];
  lyricAt: (time: number) => string;
  lastLyricRef: React.MutableRefObject<string>;
  isPlaying: boolean;
}

/**
 * Synchronizes lyrics with audio playback using a timer-based approach.
 * Updates the external musicPlaybackStore with the current lyric text.
 */
export function useLyricSync({
  audioRef,
  parsedLyrics,
  lyricAt,
  lastLyricRef,
  isPlaying,
}: LyricSyncOptions) {
  const lyricSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lyricSyncCallbackRef = useRef<() => void>(() => {});

  const clearLyricSyncTimer = useCallback(() => {
    if (lyricSyncTimerRef.current === null) return;
    clearTimeout(lyricSyncTimerRef.current);
    lyricSyncTimerRef.current = null;
  }, []);

  const syncLyricTimeline = useCallback(() => {
    const audio = audioRef.current;
    clearLyricSyncTimer();
    if (!audio || parsedLyrics.length === 0) return;

    const currentTime = audio.currentTime;
    const nextLyric = lyricAt(currentTime);
    if (nextLyric !== lastLyricRef.current) {
      lastLyricRef.current = nextLyric;
      musicPlaybackStore.update({ currentTime, currentLyric: nextLyric });
    }

    if (audio.paused || audio.ended) return;
    const delayMs = getNextLyricDelayMs(parsedLyrics, currentTime);
    if (delayMs === null) return;

    lyricSyncTimerRef.current = setTimeout(
      () => lyricSyncCallbackRef.current(),
      Math.max(16, delayMs),
    );
  }, [audioRef, clearLyricSyncTimer, lastLyricRef, lyricAt, parsedLyrics]);

  // Wire up the callback ref and trigger initial sync
  useEffect(() => {
    lyricSyncCallbackRef.current = syncLyricTimeline;
    if (!isPlaying) {
      clearLyricSyncTimer();
      return clearLyricSyncTimer;
    }
    syncLyricTimeline();
    return clearLyricSyncTimer;
  }, [clearLyricSyncTimer, isPlaying, syncLyricTimeline]);

  return { syncLyricTimeline, clearLyricSyncTimer };
}
