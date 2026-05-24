"use client";
import { useMusic } from './MusicProvider';

export default function LyricBar() {
  const { currentLyric, isPlaying, currentSong } = useMusic();

  if (!currentSong || !isPlaying || !currentLyric) return null;

  return (
    <div className="w-full rounded-2xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border border-white/20 dark:border-white/5 px-6 py-3 text-center overflow-hidden">
      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate animate-pulse">{currentLyric}</p>
    </div>
  );
}
