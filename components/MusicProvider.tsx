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
  handleSeek: (time: number) => void;
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
  const pendingSeekRatioRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const blobUrlRef = useRef<string | null>(null);
  const blobReadyIndexRef = useRef<number | null>(null);
  const blobAbortRef = useRef<AbortController | null>(null);
  const preparingBlobIndexRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [audioSrc, setAudioSrc] = useState("");
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

  const applyPendingSeek = useCallback((audio: HTMLAudioElement) => {
    const ratio = pendingSeekRatioRef.current;
    const dur = audio.duration;
    if (ratio === null || !dur || !isFinite(dur)) return;

    const target = Math.max(0, Math.min(1, ratio)) * dur;
    audio.currentTime = target;
    const lyric = lyricAt(target);
    lastLyricRef.current = lyric;
    musicPlaybackStore.update({
      currentTime: target,
      progress: ratio * 100,
      duration: dur,
      currentLyric: lyric || musicPlaybackStore.getSnapshot().currentLyric,
    });
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
      musicPlaybackStore.update({ currentLyric: "♪ 正在准备跳转 ♪" });
      pendingPlayRef.current = true;
      if (currentSong) {
        void prepareSeekableBlob(currentSong, currentIndex);
      }
      return false;
    }

    if (audioSrc !== blobUrlRef.current) {
      musicPlaybackStore.update({ currentLyric: "♪ 正在定位 ♪" });
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

    lastLyricRef.current = "";
    musicPlaybackStore.reset({ currentLyric: "♪ 正在缓冲 ♪" });
    setAudioSrc(currentSong.url);

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.load();
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
    const throttleMs = isPageVisibleRef.current ? 500 : 2000;
    if (now - lastUpdateTimeRef.current < throttleMs) return;
    lastUpdateTimeRef.current = now;

    const t = audio.currentTime;
    const dur = audio.duration;
    const playbackPatch: Partial<ReturnType<typeof musicPlaybackStore.getSnapshot>> = {
      currentTime: t,
    };

    if (dur && isFinite(dur)) {
      playbackPatch.duration = dur;
      if (dur > 0) {
        playbackPatch.progress = (t / dur) * 100;
      }

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
    if (nextLyric && nextLyric !== lastLyricRef.current) {
      lastLyricRef.current = nextLyric;
      playbackPatch.currentLyric = nextLyric;
    }

    musicPlaybackStore.update(playbackPatch);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = audio.duration;
    if (dur && isFinite(dur)) {
      musicPlaybackStore.update({ duration: dur });
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
    musicPlaybackStore.update({ progress: ratio * 100 });

    if (!ensureSeekableSource()) return;

    if (audio) {
      const dur = audio.duration;
      if (dur && isFinite(dur)) {
        const target = ratio * dur;
        audio.currentTime = target;
        const lyric = lyricAt(target);
        lastLyricRef.current = lyric;
        musicPlaybackStore.update({
          currentTime: target,
          currentLyric: lyric || musicPlaybackStore.getSnapshot().currentLyric,
        });
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

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return ctx;
}

export function useMusicPlayback() {
  return useSyncExternalStore(
    musicPlaybackStore.subscribe,
    musicPlaybackStore.getSnapshot,
    musicPlaybackStore.getSnapshot,
  );
}
