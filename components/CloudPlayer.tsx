"use client";
import { memo, useState } from 'react';
import { useCurrentLyric, useMusic } from './MusicProvider';
import { useRouter } from 'next/navigation';
import MusicProgressBar from './MusicProgressBar';

const CloudPlayerLyric = memo(function CloudPlayerLyric() {
  const currentLyric = useCurrentLyric();
  if (!currentLyric) return null;
  return (
    <div className="relative z-10 mb-2 h-6 overflow-hidden">
      <p className="truncate text-xs font-bold text-amber-600 dark:text-amber-400">{currentLyric}</p>
    </div>
  );
});

export default function CloudPlayer() {
  const { playlist, currentSong, isPlaying, togglePlay, nextSong, prevSong, playMode, togglePlayMode, volume, setVolume, isMuted, toggleMute } = useMusic();
  const router = useRouter();

  if (playlist.length === 0 || !currentSong) {
    return (
      <div
        data-cloud-player-shell
        aria-busy="true"
        aria-label="首页音乐播放器正在加载"
        className="soft-glass-panel flex min-h-[270px] w-full flex-col justify-between rounded-3xl p-6 transition-colors duration-700"
      >
        <div className="mb-6 mt-2 flex items-center gap-5">
          <div className="h-20 w-20 flex-shrink-0 rounded-full border-2 border-white/50 bg-stone-200/60 shadow-lg dark:bg-stone-700/60" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 rounded-sm bg-amber-500/20" />
            <div className="h-5 w-3/4 rounded-full bg-stone-200/65 dark:bg-stone-700/60" />
            <div className="h-3 w-2/5 rounded-full bg-stone-200/55 dark:bg-stone-700/50" />
          </div>
        </div>
        <div className="h-3 w-4/5 rounded-full bg-amber-500/15" />
        <div className="mt-auto pt-5">
          <div className="mb-5 h-1.5 w-full rounded-full bg-white/40 shadow-inner dark:bg-stone-700/50" />
          <div className="flex items-center justify-center gap-5">
            <div className="h-6 w-6 rounded-full bg-stone-200/60 dark:bg-stone-700/50" />
            <div className="h-12 w-12 rounded-full border-2 border-white/60 bg-amber-500/35" />
            <div className="h-6 w-6 rounded-full bg-stone-200/60 dark:bg-stone-700/50" />
          </div>
        </div>
      </div>
    );
  }

  const safeTogglePlay = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); togglePlay(); };
  const safePrevSong = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); prevSong(); };
  const safeNextSong = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); nextSong(); };
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
      className="soft-glass-panel group relative flex w-full cursor-pointer flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-700 hover:scale-[1.02]"
    >
      <div className={`absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-300/22 blur-[50px] transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-35'}`}></div>

      <div className="flex items-center gap-5 relative z-10 mb-6 mt-2">
        <div className="w-20 h-20 rounded-full border-2 border-white/50 shadow-lg flex-shrink-0 overflow-hidden relative animate-[spin_12s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
          {currentSong.pic && <img src={currentSong.pic} alt="cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-300 shadow-inner"></div>
        </div>
        <div className="flex-col overflow-hidden w-full">
          <span className="rounded-sm bg-white/55 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-600 shadow-sm dark:bg-stone-900/50 dark:text-amber-400">Cloud Music</span>
          <h3 className="truncate text-xl font-bold text-stone-900 drop-shadow-sm dark:text-white">{currentSong.title}</h3>
          <p className="truncate text-sm font-medium text-stone-700 dark:text-stone-300">{currentSong.artist}</p>
        </div>
      </div>

      <CloudPlayerLyric />

      <div className="relative z-10 mt-auto" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
        <MusicProgressBar
          containerClassName="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-bold mb-3"
          rangeClassName="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/40 shadow-inner outline-none dark:bg-stone-700/50"
        />
        <div className="flex items-center justify-between px-2">
          <button onClick={safeTogglePlayMode} className="relative z-20 p-1 text-stone-700 transition-colors hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400" title={playMode === 'loop' ? '顺序播放' : playMode === 'single' ? '单曲循环' : '随机播放'}>
            {getModeIcon()}
          </button>

          <div className="flex items-center gap-5">
            <button onClick={safePrevSong} className="relative z-20 text-stone-700 transition-colors hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button onClick={safeTogglePlay} className="relative z-20 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/60 bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-all hover:scale-110 hover:bg-amber-600 dark:border-stone-600">
              {isPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <button onClick={safeNextSong} className="relative z-20 text-stone-700 transition-colors hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onSetVolume={safeSetVolume}
            onToggleMute={toggleMute}
          />
        </div>
      </div>
    </div>
  );
}

function VolumeControl({
  volume,
  isMuted,
  onSetVolume,
  onToggleMute,
}: {
  volume: number;
  isMuted: boolean;
  onSetVolume: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
}) {
  const [showVolume, setShowVolume] = useState(false);
  return (
    <div className="flex items-center relative z-20" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      {showVolume && (
        <div className="absolute bottom-full right-0 mb-2 w-24 rounded-full border border-white/40 bg-white/80 px-3 py-2 shadow-lg dark:border-white/10 dark:bg-stone-800/80" onMouseLeave={() => setShowVolume(false)}>
          <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={onSetVolume} className="h-1 w-full cursor-pointer appearance-none rounded-full" style={{ background: `linear-gradient(to right, #d68a3a ${(isMuted ? 0 : volume) * 100}%, rgba(184,111,43,0.22) ${(isMuted ? 0 : volume) * 100}%)` }} />
        </div>
      )}
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVolume(!showVolume); }} onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleMute(); }} className="p-1 text-stone-700 transition-colors hover:text-amber-600 dark:text-stone-300 dark:hover:text-amber-400">
        {isMuted || volume === 0
          ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
        }
      </button>
    </div>
  );
}
