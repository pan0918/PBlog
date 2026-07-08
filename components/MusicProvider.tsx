"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

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
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;

  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (time: number) => void;
  playSong: (index: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
}

// ---------------------------------------------------------------------------
// Songs are loaded from the database via /api/songs
// ---------------------------------------------------------------------------

const FALLBACK_SONGS: Song[] = [];

// ---------------------------------------------------------------------------
// LRC parser
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const MusicContext = createContext<MusicContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingPlayRef = useRef(false);
  const pendingSeekRatioRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const blobUrlRef = useRef<string | null>(null);
  const blobReadyIndexRef = useRef<number | null>(null);
  const blobAbortRef = useRef<AbortController | null>(null);
  const preparingBlobIndexRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLyric, setCurrentLyric] = useState("");
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [audioSrc, setAudioSrc] = useState("");
  const [songs, setSongs] = useState<Song[]>(FALLBACK_SONGS);

  const currentSong = songs[currentIndex];

  // Fetch songs from database
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

  // Release the audio decoder when the provider unmounts.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      blobAbortRef.current?.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
      }
    };
  }, []);

  // Keep music playing when page is hidden, but pause visual updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        // Page is hidden - music continues, but we can reduce update frequency
        // The audio element will continue playing automatically
        console.log('[MusicProvider] Page hidden, music continues playing');
      } else {
        // Page is visible again - resume normal updates
        console.log('[MusicProvider] Page visible, resuming normal updates');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Parse lyrics when song changes
  useEffect(() => {
    if (currentSong) setParsedLyrics(parseLrc(currentSong.lrc));
  }, [currentSong]);

  const lastLyricRef = useRef("");

  const lyricAt = useCallback((time: number) => {
    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (time >= parsedLyrics[i].time) {
        const lyric = parsedLyrics[i].text;
        // Only return new lyric if it's different from the last one
        if (lyric !== lastLyricRef.current) {
          lastLyricRef.current = lyric;
          return lyric;
        }
        return ""; // Return empty to avoid unnecessary state update
      }
    }
    return "";
  }, [parsedLyrics]);

  const applyPendingSeek = useCallback((audio: HTMLAudioElement) => {
    const ratio = pendingSeekRatioRef.current;
    const dur = audio.duration;
    if (ratio === null || !dur || !isFinite(dur)) return;

    const target = Math.max(0, Math.min(1, ratio)) * dur;
    audio.currentTime = target;
    setCurrentTime(target);
    setProgress(ratio * 100);
    setCurrentLyric(lyricAt(target));
    pendingSeekRatioRef.current = null;
  }, [lyricAt]);

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

  const prepareSeekableBlob = useCallback((song: Song, index: number) => {
    if (blobReadyIndexRef.current === index && blobUrlRef.current) return;
    if (preparingBlobIndexRef.current === index) return;

    blobAbortRef.current?.abort();
    const controller = new AbortController();
    blobAbortRef.current = controller;
    preparingBlobIndexRef.current = index;

    fetch(song.url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to prepare seekable audio: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        blobUrlRef.current = url;
        blobReadyIndexRef.current = index;
        if (pendingSeekRatioRef.current !== null && currentIndex === index) {
          pendingPlayRef.current = true;
          setAudioSrc(url);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.warn("[MusicProvider] Seekable audio fallback failed", error);
        }
      })
      .finally(() => {
        if (blobAbortRef.current === controller) {
          blobAbortRef.current = null;
        }
        if (preparingBlobIndexRef.current === index) {
          preparingBlobIndexRef.current = null;
        }
      });
  }, [currentIndex]);

  const ensureSeekableSource = useCallback(() => {
    if (blobReadyIndexRef.current !== currentIndex || !blobUrlRef.current) {
      setCurrentLyric("♪ 正在准备跳转 ♪");
      pendingPlayRef.current = true;
      if (currentSong) {
        void prepareSeekableBlob(currentSong, currentIndex);
      }
      return false;
    }

    if (audioSrc !== blobUrlRef.current) {
      setCurrentLyric("♪ 正在定位 ♪");
      pendingPlayRef.current = true;
      setAudioSrc(blobUrlRef.current);
      return false;
    }

    return true;
  }, [audioSrc, currentIndex, currentSong, prepareSeekableBlob]);

  const switchSong = useCallback((nextIndex: number, shouldPlay: boolean) => {
    if (nextIndex < 0 || nextIndex >= songs.length) return;

    endedRef.current = false;
    pendingSeekRatioRef.current = null;
    if (shouldPlay) {
      requestPlayback(true);
    } else {
      pendingPlayRef.current = false;
      setIsPlaying(false);
    }
    setCurrentIndex(nextIndex);
  }, [requestPlayback, songs.length]);

  // Reset visible state and make the audio element load only metadata for the new track.
  useEffect(() => {
    if (!currentSong) return;
    blobAbortRef.current?.abort();
    blobAbortRef.current = null;
    preparingBlobIndexRef.current = null;
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    blobReadyIndexRef.current = null;

    setDuration(0);
    setCurrentTime(0);
    setProgress(0);
    setCurrentLyric("♪ 正在缓冲 ♪");
    setAudioSrc(currentSong.url);

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.load();
    }
  }, [currentIndex, currentSong]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const lastUpdateTimeRef = useRef(0);
  const isPageVisibleRef = useRef(true);

  // Track page visibility
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

    // Throttle updates more aggressively when page is hidden
    const now = performance.now();
    const throttleMs = isPageVisibleRef.current ? 250 : 2000; // 2s when hidden
    if (now - lastUpdateTimeRef.current < throttleMs) return;
    lastUpdateTimeRef.current = now;

    const t = audio.currentTime;
    const dur = audio.duration;
    setCurrentTime(t);
    if (dur && isFinite(dur)) {
      setDuration(dur);
      if (dur > 0) {
        setProgress((t / dur) * 100);
      }
      // Detect song end manually (more reliable than onEnded)
      if (dur > 0 && t >= dur - 0.3 && !endedRef.current) {
        endedRef.current = true;
        if (playMode === "single") {
          audio.currentTime = 0;
          requestPlayback();
        } else if (playMode === "random") {
          switchSong(Math.floor(Math.random() * songs.length), true);
        } else {
          switchSong((currentIndex + 1) % songs.length, true);
        }
        return;
      }
      if (t < dur - 1) {
        endedRef.current = false;
      }
    }
    const nextLyric = lyricAt(t);
    if (nextLyric && nextLyric !== currentLyric) {
      setCurrentLyric(nextLyric);
    }
  };

  // Get duration immediately when metadata loads (faster than timeupdate)
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = audio.duration;
    if (dur && isFinite(dur)) {
      setDuration(dur);
      applyPendingSeek(audio);
    }
  };

  const handleCanPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    applyPendingSeek(audio);
    if (!pendingPlayRef.current) return;

    audio.play()
      .then(() => {
        pendingPlayRef.current = false;
        setIsPlaying(true);
      })
      .catch(() => {
        pendingPlayRef.current = false;
        setIsPlaying(false);
      });
  }, [applyPendingSeek]);

  const handleEnded = useCallback(() => {
    const audio = audioRef.current;
    endedRef.current = true;
    if (playMode === "single" && audio) {
      audio.currentTime = 0;
      requestPlayback();
    } else if (playMode === "random") {
      switchSong(Math.floor(Math.random() * songs.length), true);
    } else {
      switchSong((currentIndex + 1) % songs.length, true);
    }
  }, [currentIndex, playMode, requestPlayback, switchSong, songs.length]);

  // Controls
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

  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    const ratio = Math.max(0, Math.min(100, time)) / 100;
    pendingSeekRatioRef.current = ratio;
    setProgress(ratio * 100);

    if (!ensureSeekableSource()) return;

    if (audio) {
      const dur = audio.duration;
      if (dur && isFinite(dur)) {
        const target = ratio * dur;
        audio.currentTime = target;
        setCurrentTime(target);
        setCurrentLyric(lyricAt(target));
        pendingSeekRatioRef.current = null;
      }
    }
    requestPlayback();
  }, [ensureSeekableSource, lyricAt, requestPlayback]);

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

  // -- Context value --

  const value: MusicContextValue = useMemo(() => ({
    playlist: songs,
    currentIndex,
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    currentLyric,
    isLoading,
    volume,
    isMuted,
    playMode,

    togglePlay,
    nextSong,
    prevSong,
    handleSeek,
    playSong,
    setVolume,
    toggleMute,
    togglePlayMode,
  }), [
    songs,
    currentIndex,
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    currentLyric,
    isLoading,
    volume,
    isMuted,
    playMode,
    togglePlay,
    nextSong,
    prevSong,
    handleSeek,
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
          src={audioSrc || currentSong.url}
          preload="metadata"
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onEnded={handleEnded}
        />
      )}
    </MusicContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return ctx;
}
