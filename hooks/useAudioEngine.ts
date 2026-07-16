"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { musicPlaybackStore } from "../lib/music-playback-store";
import { isTimeInRanges } from "../lib/music-seeking";

type PlayMode = "loop" | "single" | "random";

interface AudioEngineOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  songsLength: number;
  currentIndex: number;
  playMode: PlayMode;
  lyricAt: (time: number) => string;
  onSongChange: (nextIndex: number) => void;
}

export function useAudioEngine({
  audioRef,
  songsLength,
  currentIndex,
  playMode,
  lyricAt,
  onSongChange,
}: AudioEngineOptions) {
  const pendingPlayRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const lastLyricRef = useRef("");
  const lastUpdateTimeRef = useRef(0);
  const isPageVisibleRef = useRef(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Reset state on song change
  useEffect(() => {
    lastLyricRef.current = "";
    pendingSeekRef.current = null;
    musicPlaybackStore.reset();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.preload = "metadata";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const requestPlayback = useCallback(
    (deferUntilCanPlay = false) => {
      pendingPlayRef.current = true;
      setIsPlaying(true);

      const audio = audioRef.current;
      if (!audio || deferUntilCanPlay) return;

      audio
        .play()
        .then(() => {
          pendingPlayRef.current = false;
          setIsPlaying(true);
        })
        .catch(() => {
          pendingPlayRef.current = false;
          setIsPlaying(false);
        });
    },
    [audioRef],
  );

  const switchSong = useCallback(
    (nextIndex: number, shouldPlay: boolean) => {
      if (nextIndex < 0 || nextIndex >= songsLength) return;

      audioRef.current?.pause();
      if (shouldPlay) {
        requestPlayback(true);
      } else {
        pendingPlayRef.current = false;
        setIsPlaying(false);
      }
      onSongChange(nextIndex);
    },
    [audioRef, requestPlayback, songsLength, onSongChange],
  );

  // --- Seek logic ---

  const retryPendingSeek = useCallback(() => {
    const audio = audioRef.current;
    const target = pendingSeekRef.current;
    if (!audio || target === null || !Number.isFinite(audio.duration) || audio.duration <= 0) return;

    const clamped = Math.max(0, Math.min(target, audio.duration - 0.05));
    if (!isTimeInRanges(audio.buffered, clamped)) return;

    audio.currentTime = clamped;
    audio.preload = "metadata";
    pendingSeekRef.current = null;
    const nextLyric = lyricAt(clamped);
    lastLyricRef.current = nextLyric;
    musicPlaybackStore.update({
      currentTime: clamped,
      duration: audio.duration,
      currentLyric: nextLyric,
    });
    setIsLoading(false);

    if (pendingPlayRef.current) requestPlayback();
  }, [audioRef, lyricAt, requestPlayback]);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);

    if (pendingSeekRef.current !== null) {
      retryPendingSeek();
      if (pendingSeekRef.current !== null) {
        const audio = audioRef.current;
        if (audio) audio.preload = "auto";
        setIsLoading(true);
      }
      return;
    }

    if (!pendingPlayRef.current) return;
    requestPlayback();
  }, [audioRef, requestPlayback, retryPendingSeek]);

  const handleSeeked = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsLoading(false);

    const target = pendingSeekRef.current;
    if (target === null || Math.abs(audio.currentTime - target) > 0.75) return;
    pendingSeekRef.current = null;
    audio.preload = "metadata";
  }, [audioRef]);

  const handlePlaying = useCallback(() => {
    pendingPlayRef.current = false;
    setIsLoading(false);
    setIsPlaying(true);
  }, []);

  const handleAudioError = useCallback(() => {
    pendingPlayRef.current = false;
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  // --- Time update ---

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const now = performance.now();
    if (!isPageVisibleRef.current || now - lastUpdateTimeRef.current < 200) return;
    lastUpdateTimeRef.current = now;

    const t = audio.currentTime;
    const dur = audio.duration;
    const playbackPatch: Partial<ReturnType<typeof musicPlaybackStore.getSnapshot>> = {
      currentTime: t,
    };

    if (Number.isFinite(dur) && dur > 0) {
      playbackPatch.duration = dur;
    }

    musicPlaybackStore.update(playbackPatch);
  }, [audioRef]);

  // --- End of track ---

  const handleEnded = useCallback(() => {
    const audio = audioRef.current;
    if (playMode === "single" && audio) {
      audio.currentTime = 0;
      requestPlayback();
    } else if (playMode === "random") {
      switchSong(Math.floor(Math.random() * songsLength), true);
    } else {
      switchSong((currentIndex + 1) % songsLength, true);
    }
  }, [audioRef, currentIndex, playMode, requestPlayback, songsLength, switchSong]);

  // --- User-facing controls ---

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      pendingPlayRef.current = false;
      audio.pause();
      setIsPlaying(false);
    } else {
      requestPlayback();
    }
  }, [audioRef, isPlaying, requestPlayback]);

  const nextSong = useCallback(() => {
    if (playMode === "single") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        requestPlayback();
      }
    } else if (playMode === "random") {
      switchSong(Math.floor(Math.random() * songsLength), isPlaying);
    } else {
      switchSong((currentIndex + 1) % songsLength, isPlaying);
    }
  }, [audioRef, currentIndex, isPlaying, playMode, requestPlayback, songsLength, switchSong]);

  const prevSong = useCallback(() => {
    if (playMode === "single") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        requestPlayback();
      }
    } else if (playMode === "random") {
      switchSong(Math.floor(Math.random() * songsLength), isPlaying);
    } else {
      switchSong((currentIndex - 1 + songsLength) % songsLength, isPlaying);
    }
  }, [audioRef, currentIndex, isPlaying, playMode, requestPlayback, songsLength, switchSong]);

  const seekToSeconds = useCallback(
    (requestedSeconds: number) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
        pendingSeekRef.current = requestedSeconds;
        return;
      }
      if (audio.readyState < HTMLMediaElement.HAVE_METADATA) {
        pendingSeekRef.current = requestedSeconds;
        return;
      }

      const target = Math.max(0, Math.min(requestedSeconds, Math.max(0, audio.duration - 0.05)));
      pendingSeekRef.current = target;

      const canSeekImmediately =
        isTimeInRanges(audio.seekable, target) || isTimeInRanges(audio.buffered, target);
      if (!canSeekImmediately) {
        pendingPlayRef.current = true;
        setIsPlaying(true);
        setIsLoading(true);
        audio.pause();
        audio.preload = "auto";
        audio.load();
        return;
      }

      audio.currentTime = target;
      pendingSeekRef.current = null;
      const nextLyric = lyricAt(target);
      lastLyricRef.current = nextLyric;
      musicPlaybackStore.update({
        currentTime: target,
        duration: audio.duration,
        currentLyric: nextLyric,
      });
      requestPlayback();
    },
    [audioRef, lyricAt, requestPlayback],
  );

  const seekToPercent = useCallback(
    (percent: number) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const normalized = Math.max(0, Math.min(100, percent));
      seekToSeconds((audio.duration * normalized) / 100);
    },
    [audioRef, seekToSeconds],
  );

  const playSong = useCallback(
    (index: number) => {
      if (index < 0 || index >= songsLength) return;
      if (index === currentIndex) {
        requestPlayback();
        return;
      }
      switchSong(index, true);
    },
    [currentIndex, requestPlayback, songsLength, switchSong],
  );

  // --- Audio element event handlers ---

  const handleDurationChange = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = audio.duration;
    if (Number.isFinite(dur) && dur > 0) {
      musicPlaybackStore.update({ duration: dur });
    }
  }, [audioRef]);

  return {
    isPlaying,
    isLoading,
    setIsLoading,
    requestPlayback,
    pendingPlayRef,
    pendingSeekRef,
    lastLyricRef,
    // Event handlers for <audio>
    handleTimeUpdate,
    handleDurationChange,
    handleCanPlay,
    handleSeeked,
    handlePlaying,
    handleAudioError,
    handleEnded,
    retryPendingSeek,
    // User controls
    togglePlay,
    nextSong,
    prevSong,
    seekToSeconds,
    seekToPercent,
    playSong,
  };
}
