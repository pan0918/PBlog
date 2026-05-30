"use client";
import { useEffect, useState } from 'react';
import { useMusic } from './MusicProvider';
import { useRouter } from 'next/navigation';

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "00:00";
  const m = Math.floor(time / 60).toString().padStart(2, '0');
  const s = Math.floor(time % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function CloudPlayer() {
  const { playlist, currentSong, isPlaying, progress, currentTime, duration, currentLyric, isLoading, togglePlay, nextSong, prevSong, handleSeek, playMode, togglePlayMode, volume, setVolume, isMuted, toggleMute } = useMusic();
  const [displayedLyric, setDisplayedLyric] = useState("");
  const [showVolume, setShowVolume] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let i = 0;
    setDisplayedLyric("");
    const target = currentLyric || "";
    if (!target) return;
    const typingInterval = setInterval(() => {
      if (i <= target.length) { setDisplayedLyric(target.slice(0, i)); i++; }
      else clearInterval(typingInterval);
    }, 50);
    return () => clearInterval(typingInterval);
  }, [currentLyric]);

  if (isLoading) {
    return (
      <div className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col items-center justify-center transition-colors duration-700">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-slate-800 dark:text-white font-bold tracking-widest animate-pulse text-sm">CONNECTING...</span>
      </div>
    );
  }

  if (playlist.length === 0 || !currentSong) {
    return (
      <div className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col items-center justify-center transition-all duration-700">
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-inner opacity-50">
          <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
        </div>
        <span className="text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs uppercase">No Music Available</span>
      </div>
    );
  }

  const safeTogglePlay = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); togglePlay(); };
  const safePrevSong = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); prevSong(); };
  const safeNextSong = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); nextSong(); };
  const safeHandleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { e.stopPropagation(); handleSeek(Number(e.target.value)); };
  const safeTogglePlayMode = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); togglePlayMode(); };
  const safeSetVolume = (e: React.ChangeEvent<HTMLInputElement>) => { e.stopPropagation(); setVolume(Number(e.target.value)); };

  const getModeIcon = () => {
    if (playMode === 'single') return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M17 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11v-1a4 4 0 014-4h14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 22l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 13v1a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="12" y="14.5" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontWeight="900" fontFamily="sans-serif">1</text>
      </svg>
    );
    if (playMode === 'random') return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M16 3h5v5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 20L21 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 16v5h-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 15l6 6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M17 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11v-1a4 4 0 014-4h14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 22l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 13v1a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div
      onClick={() => router.push('/music')}
      className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col justify-between transition-all duration-700 hover:scale-[1.02] relative group overflow-hidden cursor-pointer"
    >
      <div className={`absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 blur-[50px] rounded-full transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-30'}`}></div>

      <div className="flex items-center gap-5 relative z-10 mb-6 mt-2">
        <div className="w-20 h-20 rounded-full border-2 border-white/50 shadow-lg flex-shrink-0 overflow-hidden relative animate-[spin_6s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused', willChange: 'transform' }}>
          {currentSong.pic && <img src={currentSong.pic} alt="cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-300 shadow-inner"></div>
        </div>
        <div className="flex-col overflow-hidden w-full">
          <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 tracking-widest uppercase bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-sm shadow-sm">Cloud Music</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate drop-shadow-sm">{currentSong.title}</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">{currentSong.artist}</p>
        </div>
      </div>

      <div className="relative z-10 mb-2 h-6 overflow-hidden">
        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">{displayedLyric}</p>
      </div>

      <div className="relative z-10 mt-auto">
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-bold mb-3" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onPointerDown={(e) => e.stopPropagation()}>
          <span className="w-10 text-right">{formatTime(currentTime)}</span>
          <input type="range" min="0" max="100" value={progress} onChange={safeHandleSeek} className="flex-1 h-1.5 bg-white/40 dark:bg-slate-700/50 rounded-full appearance-none outline-none cursor-pointer shadow-inner" style={{ background: `linear-gradient(to right, #818cf8 ${progress}%, rgba(148,163,184,0.4) ${progress}%)` }} />
          <span className="w-10">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center justify-between px-2">
          {/* Play Mode */}
          <button onClick={safeTogglePlayMode} className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative z-20 p-1" title={playMode === 'loop' ? '顺序播放' : playMode === 'single' ? '单曲循环' : '随机播放'}>
            {getModeIcon()}
          </button>

          {/* Prev / Play / Next */}
          <div className="flex items-center gap-5">
            <button onClick={safePrevSong} className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative z-20">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button onClick={safeTogglePlay} className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:scale-110 transition-all border-2 border-white/50 dark:border-slate-600 relative z-20">
              {isPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <button onClick={safeNextSong} className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative z-20">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center relative z-20" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            {showVolume && (
              <div className="absolute bottom-full right-0 mb-2 w-24 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full px-3 py-2 border border-white/30 dark:border-white/10 shadow-lg" onMouseLeave={() => setShowVolume(false)}>
                <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={safeSetVolume} className="w-full h-1 appearance-none rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, #6366f1 ${(isMuted ? 0 : volume) * 100}%, rgba(148,163,184,0.4) ${(isMuted ? 0 : volume) * 100}%)` }} />
              </div>
            )}
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVolume(!showVolume); }} onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMute(); }} className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1">
              {isMuted || volume === 0
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
