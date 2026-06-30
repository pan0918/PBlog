"use client";
import Image from 'next/image';
import { useMusic } from './MusicProvider';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatTime } from '../lib/utils';

export default function FloatingPlayer() {
  const { currentSong, isPlaying, progress, currentTime, duration, togglePlay, nextSong, handleSeek } = useMusic();
  const pathname = usePathname();

  if (pathname === '/' || !currentSong) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      drag
      dragConstraints={{ left: -300, right: 0, top: -500, bottom: 0 }}
      className="fixed bottom-6 right-6 z-[55] w-72 select-none"
    >
      <div className="rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing">
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 animate-[spin_6s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
          {currentSong.pic ? (
            <Image
              src={currentSong.pic}
              alt="cover"
              fill
              sizes="48px"
              quality={75}
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{currentSong.title}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentSong.artist}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] text-slate-400 font-mono">{formatTime(currentTime)}</span>
            <input type="range" min="0" max="100" value={progress} onChange={(e) => handleSeek(Number(e.target.value))} onClick={(e) => e.stopPropagation()} className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none outline-none cursor-pointer" style={{ background: `linear-gradient(to right, #818cf8 ${progress}%, rgba(148,163,184,0.4) ${progress}%)` }} />
            <span className="text-[9px] text-slate-400 font-mono">{formatTime(duration)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition-all text-xs">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); nextSong(); }} className="w-8 h-8 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all text-xs">
            ⏭
          </button>
        </div>
      </div>
    </motion.div>
  );
}
