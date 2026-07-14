"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { musicPlaybackStore } from "../lib/music-playback-store";
import { isTimeInRanges } from "../lib/music-seeking";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  pic: string;
  url: string;
  lrc: string;
  lyric?: string;
  lyrics?: LyricLine[];
}

export interface LyricLine {
  time: number; // seconds
  text: string;
}

type PlayMode = "loop" | "single" | "random";

interface MusicContextValue {
  playlist: Song[];
  currentIndex: number;
  currentSong: Song;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;

  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seekToSeconds: (seconds: number) => void;
  seekToPercent: (percent: number) => void;
  playSong: (index: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
}

const FALLBACK_SONGS: Song[] = [];

function parseLrc(lrc: string): LyricLine[] {
  const lines = lrc.split("\n");
  const result: LyricLine[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3], 10);
      const time =
        minutes * 60 + seconds + ms / (match[3].length === 3 ? 1000 : 100);
      const text = line
        .replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "")
        .trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }

  return result;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingPlayRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [songs, setSongs] = useState<Song[]>(FALLBACK_SONGS);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/songs', { signal: controller.signal })
      .then(res => res.json())
      .then((data: Song[]) => {
        if (controller.signal.aborted) return;
        if (Array.isArray(data) && data.length > 0) {
          setSongs(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (currentSong) setParsedLyrics(parseLrc(currentSong.lrc));
  }, [currentSong]);

  const lastLyricRef = useRef("");

  const lyricAt = useCallback((time: number) => {
    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (time >= parsedLyrics[i].time) {
        return parsedLyrics[i].text;
      }
    }
    return "";
  }, [parsedLyrics]);

  const requestPlayback = useCallback((deferUntilCanPlay = false) => {
    pendingPlayRef.current = true;
    setIsPlaying(true);

    const audio = audioRef.current;
    if (!audio || deferUntilCanPlay) return;

    audio.play()
      .then(() => {
        pendingPlayRef.current = false;
        setIsPlaying(true);
      })
      .catch(() => {
        pendingPlayRef.current = false;
        setIsPlaying(false);
      });
  }, []);

  const switchSong = useCallback((nextIndex: number, shouldPlay: boolean) => {
    if (nextIndex < 0 || nextIndex >= songs.length) return;

    audioRef.current?.pause();
    if (shouldPlay) {
      requestPlayback(true);
    } else {
      pendingPlayRef.current = false;
      setIsPlaying(false);
    }
    setCurrentIndex(nextIndex);
  }, [requestPlayback, songs.length]);

  useEffect(() => {
    if (!currentSong) return;
    lastLyricRef.current = "";
    pendingSeekRef.current = null;
    musicPlaybackStore.reset();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.preload = "metadata";
    }
  }, [currentIndex, currentSong]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const lastUpdateTimeRef = useRef(0);
  const isPageVisibleRef = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleTimeUpdate = () => {
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

    const nextLyric = lyricAt(t);
    if (nextLyric !== lastLyricRef.current) {
      lastLyricRef.current = nextLyric;
      playbackPatch.currentLyric = nextLyric;
    }

    musicPlaybackStore.update(playbackPatch);
  };

  const handleDurationChange = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = audio.duration;
    if (Number.isFinite(dur) && dur > 0) {
      musicPlaybackStore.update({ duration: dur });
    }
  };

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
  }, [lyricAt, requestPlayback]);

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
  }, [requestPlayback, retryPendingSeek]);

  const handleSeeked = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsLoading(false);

    const target = pendingSeekRef.current;
    if (target === null || Math.abs(audio.currentTime - target) > 0.75) return;
    pendingSeekRef.current = null;
    audio.preload = "metadata";
  }, []);

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

  const handleEnded = useCallback(() => {
    const audio = audioRef.current;
    if (playMode === "single" && audio) {
      audio.currentTime = 0;
      requestPlayback();
    } else if (playMode === "random") {
      switchSong(Math.floor(Math.random() * songs.length), true);
    } else {
      switchSong((currentIndex + 1) % songs.length, true);
    }
  }, [currentIndex, playMode, requestPlayback, switchSong, songs.length]);

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
  }, [isPlaying, requestPlayback]);

  const nextSong = useCallback(() => {
    if (playMode === 'single') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        requestPlayback();
      }
    } else if (playMode === 'random') {
      switchSong(Math.floor(Math.random() * songs.length), isPlaying);
    } else {
      switchSong((currentIndex + 1) % songs.length, isPlaying);
    }
  }, [currentIndex, isPlaying, playMode, requestPlayback, songs.length, switchSong]);

  const prevSong = useCallback(() => {
    if (playMode === 'single') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        requestPlayback();
      }
    } else if (playMode === 'random') {
      switchSong(Math.floor(Math.random() * songs.length), isPlaying);
    } else {
      switchSong((currentIndex - 1 + songs.length) % songs.length, isPlaying);
    }
  }, [currentIndex, isPlaying, playMode, requestPlayback, songs.length, switchSong]);

  const seekToSeconds = useCallback((requestedSeconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      pendingSeekRef.current = requestedSeconds;
      return;
    }
    if (audio.readyState < HTMLMediaElement.HAVE_METADATA) {
      pendingSeekRef.current = requestedSeconds;
      return;
    }

    const target = Math.max(
      0,
      Math.min(requestedSeconds, Math.max(0, audio.duration - 0.05)),
    );
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
  }, [lyricAt, requestPlayback]);

  const seekToPercent = useCallback((percent: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const normalized = Math.max(0, Math.min(100, percent));
    seekToSeconds(audio.duration * normalized / 100);
  }, [seekToSeconds]);

  const playSong = useCallback((index: number) => {
    if (index < 0 || index >= songs.length) return;
    if (index === currentIndex) {
      requestPlayback();
      return;
    }
    switchSong(index, true);
  }, [currentIndex, requestPlayback, songs.length, switchSong]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.min(1, Math.max(0, v)));
    setIsMuted(false);
  }, []);
  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);
  const togglePlayMode = useCallback(() => {
    setPlayMode((prev) => prev === "loop" ? "single" : prev === "single" ? "random" : "loop");
  }, []);

  const value: MusicContextValue = useMemo(() => ({
    playlist: songs,
    currentIndex,
    currentSong,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    playMode,

    togglePlay,
    nextSong,
    prevSong,
    seekToSeconds,
    seekToPercent,
    playSong,
    setVolume,
    toggleMute,
    togglePlayMode,
  }), [
    songs,
    currentIndex,
    currentSong,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    playMode,
    togglePlay,
    nextSong,
    prevSong,
    seekToSeconds,
    seekToPercent,
    playSong,
    setVolume,
    toggleMute,
    togglePlayMode,
  ]);

  return (
    <MusicContext.Provider value={value}>
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.url}
          preload="metadata"
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleDurationChange}
          onDurationChange={handleDurationChange}
          onProgress={retryPendingSeek}
          onSeeking={() => setIsLoading(true)}
          onSeeked={handleSeeked}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={handleCanPlay}
          onPlaying={handlePlaying}
          onError={handleAudioError}
          onEnded={handleEnded}
        />
      )}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return ctx;
}

export function useMusicPlayback() {
  const snapshot = useSyncExternalStore(
    musicPlaybackStore.subscribe,
    musicPlaybackStore.getSnapshot,
    musicPlaybackStore.getSnapshot,
  );
  return {
    ...snapshot,
    progress: snapshot.duration > 0 ? snapshot.currentTime / snapshot.duration * 100 : 0,
  };
}

export function useCurrentLyric(): string {
  return useSyncExternalStore(
    musicPlaybackStore.subscribe,
    () => musicPlaybackStore.getSnapshot().currentLyric,
    () => "",
  );
}
