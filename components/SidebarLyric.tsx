"use client";
import { useMusic } from './MusicProvider';

export default function SidebarLyric() {
  const { currentLyric, isPlaying, currentSong } = useMusic();

  if (!currentSong) return null;

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
      <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">NOW PLAYING</h3>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 animate-[spin_6s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
          {currentSong.pic && <img src={currentSong.pic} alt="cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{currentSong.title}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentSong.artist}</p>
        </div>
      </div>
      {currentLyric && <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">{currentLyric}</p>}
    </div>
  );
}
