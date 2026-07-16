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
import { parseLrc, type LyricLine } from "../lib/music-parse";
import { getActiveLyricIndex } from "../lib/music-lyrics";
import { useAudioEngine } from "../hooks/useAudioEngine";
import { useLyricSync } from "../hooks/useLyricSync";

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
const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [songs, setSongs] = useState<Song[]>(FALLBACK_SONGS);

  const currentSong = songs[currentIndex];

  // Fetch playlist on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/songs", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: Song[]) => {
        if (controller.signal.aborted) return;
        if (Array.isArray(data) && data.length > 0) {
          setSongs(data);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Parse lyrics when song changes
  useEffect(() => {
    if (currentSong) setParsedLyrics(parseLrc(currentSong.lrc));
  }, [currentSong]);

  // Lyric lookup helper
  const lyricAt = useCallback(
    (time: number) => {
      const index = getActiveLyricIndex(parsedLyrics, time);
      return index >= 0 ? parsedLyrics[index].text : "";
    },
    [parsedLyrics],
  );

  // Song change handler (called by audio engine)
  const handleSongChange = useCallback((nextIndex: number) => {
    setCurrentIndex(nextIndex);
  }, []);

  // Audio engine — all playback logic
  const engine = useAudioEngine({
    audioRef,
    songsLength: songs.length,
    currentIndex,
    playMode,
    lyricAt,
    onSongChange: handleSongChange,
  });

  // Lyric sync engine
  const lyricSync = useLyricSync({
    audioRef,
    parsedLyrics,
    lyricAt,
    lastLyricRef: engine.lastLyricRef,
    isPlaying: engine.isPlaying,
  });

  const handleTimeUpdate = () => {
    engine.handleTimeUpdate();
    lyricSync.syncLyricTimeline();
  };

  const handleSeeked = () => {
    engine.handleSeeked();
    lyricSync.syncLyricTimeline();
  };

  const handlePlaying = () => {
    engine.handlePlaying();
    lyricSync.syncLyricTimeline();
  };

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Volume controls
  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.min(1, Math.max(0, v)));
    setIsMuted(false);
  }, []);
  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);
  const togglePlayMode = useCallback(() => {
    setPlayMode((prev) => (prev === "loop" ? "single" : prev === "single" ? "random" : "loop"));
  }, []);

  const value: MusicContextValue = useMemo(
    () => ({
      playlist: songs,
      currentIndex,
      currentSong,
      isPlaying: engine.isPlaying,
      isLoading: engine.isLoading,
      volume,
      isMuted,
      playMode,

      togglePlay: engine.togglePlay,
      nextSong: engine.nextSong,
      prevSong: engine.prevSong,
      seekToSeconds: engine.seekToSeconds,
      seekToPercent: engine.seekToPercent,
      playSong: engine.playSong,
      setVolume,
      toggleMute,
      togglePlayMode,
    }),
    [
      songs,
      currentIndex,
      currentSong,
      engine.isPlaying,
      engine.isLoading,
      volume,
      isMuted,
      playMode,
      engine.togglePlay,
      engine.nextSong,
      engine.prevSong,
      engine.seekToSeconds,
      engine.seekToPercent,
      engine.playSong,
      setVolume,
      toggleMute,
      togglePlayMode,
    ],
  );

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
          onLoadedMetadata={engine.handleDurationChange}
          onDurationChange={engine.handleDurationChange}
          onProgress={engine.retryPendingSeek}
          onSeeking={() => engine.setIsLoading(true)}
          onSeeked={handleSeeked}
          onPause={lyricSync.clearLyricSyncTimer}
          onWaiting={() => engine.setIsLoading(true)}
          onCanPlay={engine.handleCanPlay}
          onPlaying={handlePlaying}
          onError={engine.handleAudioError}
          onEnded={engine.handleEnded}
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
    progress: snapshot.duration > 0 ? (snapshot.currentTime / snapshot.duration) * 100 : 0,
  };
}

export function useCurrentLyric(): string {
  return useSyncExternalStore(
    musicPlaybackStore.subscribe,
    () => musicPlaybackStore.getSnapshot().currentLyric,
    () => "",
  );
}
