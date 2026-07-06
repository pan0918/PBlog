"use client";
import { useEffect, useRef, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusic, type Song, type LyricLine } from '../../components/MusicProvider';
import { formatTime } from '../../lib/utils';

export default function MusicClient() {
  const {
    playlist, currentIndex, currentSong, isPlaying, progress, currentTime, duration, currentLyric,
    isLoading, togglePlay, nextSong, prevSong, handleSeek,
    playSong, playMode, togglePlayMode, volume, setVolume, isMuted, toggleMute,
  } = useMusic();

  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'playlist'>('lyrics');
  const [showVolume, setShowVolume] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);

  useEffect(() => {
    if (!currentSong) { setParsedLyrics([]); return; }
    const raw = currentSong.lrc || currentSong.lyric;
    if (Array.isArray(currentSong.lyrics) && currentSong.lyrics.length > 0) {
      setParsedLyrics(currentSong.lyrics);
      return;
    }
    if (typeof raw !== 'string' || !raw) { setParsedLyrics([]); return; }
    const lines = raw.split('\n');
    const parsed: LyricLine[] = [];
    const timeExp = /\[(\d{2,}):(\d{2})(?:[.:](\d{2,3}))?\]/g;
    for (const line of lines) {
      const text = line.replace(/\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/g, '').trim();
      if (!text) continue;
      let match;
      while ((match = timeExp.exec(line)) !== null) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = match[3] ? parseFloat(`0.${match[3]}`) : 0;
        parsed.push({ time: min * 60 + sec + ms, text });
      }
    }
    setParsedLyrics(parsed.length > 0 ? parsed.sort((a, b) => a.time - b.time) : lines.map(l => ({ time: -1, text: l.trim() })).filter(l => l.text));
  }, [currentSong]);

  const activeLyricIndex = useMemo(() => {
    if (!parsedLyrics.length) return -1;
    let idx = parsedLyrics.findIndex((l) => l.time > currentTime) - 1;
    if (idx === -2) idx = parsedLyrics.length - 1;
    return Math.max(0, idx);
  }, [currentTime, parsedLyrics]);

  useEffect(() => {
    if (activeLyricRef.current && lyricContainerRef.current && activeTab === 'lyrics') {
      const container = lyricContainerRef.current;
      const el = activeLyricRef.current;
      const target = el.offsetTop - container.offsetHeight / 2 + el.offsetHeight / 2;
      container.scrollTo({ top: target, behavior: 'auto' });
    }
  }, [activeLyricIndex, activeTab]);

  const filteredPlaylist = useMemo(() => {
    if (!searchQuery.trim()) return playlist;
    const q = searchQuery.toLowerCase();
    return playlist.filter((s) => (s.title || '').toLowerCase().includes(q) || (s.artist || '').toLowerCase().includes(q));
  }, [playlist, searchQuery]);

  const getModeIcon = () => {
    if (playMode === 'single') return (
      <svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M17 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11v-1a4 4 0 014-4h14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 22l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 13v1a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="12" y="14.5" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" fontWeight="900" fontFamily="sans-serif">1</text>
      </svg>
    );
    if (playMode === 'random') return (
      <svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M16 3h5v5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 20L21 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 16v5h-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 15l6 6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
    return (
      <svg className="w-4 h-4 md:w-5 md:h-5 text-slate-500 hover:text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M17 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11v-1a4 4 0 014-4h14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 22l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 13v1a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  if (isLoading || !currentSong) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 animate-pulse">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-black text-slate-500 tracking-widest text-sm">唤醒音频引擎中...</span>
      </div>
    );
  }

  const songCover = currentSong.pic || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

  return (
    <>
      <div className="relative flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8 w-full md:items-stretch md:h-[calc(100vh-320px)] md:min-h-[600px] md:max-h-[720px]">
        {/* Blurred background */}
        <div className="absolute inset-[-5%] pointer-events-none rounded-[40px] overflow-hidden z-0">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 blur-[50px] opacity-40 dark:opacity-20 saturate-150" style={{ backgroundImage: `url(${songCover})` }} />
          <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm" />
        </div>

        {/* Left: Control Console */}
        <div className="md:col-span-5 flex flex-col bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-[32px] shadow-2xl p-6 md:p-10 relative overflow-hidden transition-all duration-500 shrink-0 min-h-[460px] sm:min-h-[500px] md:min-h-0">
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full overflow-hidden py-4 md:py-0">
            {/* Rotating Disc */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64 flex-shrink-0 aspect-square mb-6 md:mb-10 flex items-center justify-center">
              <div className={`absolute inset-0 m-auto w-[85%] h-[85%] bg-indigo-500/25 blur-[35px] rounded-full transition-all duration-1000 z-0 ${isPlaying ? 'opacity-90 scale-105' : 'opacity-20 scale-100'}`}></div>
              <div className="absolute inset-0 m-auto w-[90%] h-[90%] rounded-full shadow-[0_0_40px_-5px_rgba(99,102,241,0.4)] z-0"></div>
              <div className={`absolute inset-0 w-full h-full rounded-full border-[4px] md:border-[6px] border-white/80 dark:border-slate-600/80 shadow-2xl overflow-hidden z-10 ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : 'scale-95'}`}>
                <Image
                  src={songCover}
                  alt="cover"
                  fill
                  sizes="(max-width: 768px) 12rem, 16rem"
                  quality={75}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  style={{ objectFit: 'cover' }}
                />
                <div className="absolute inset-0 m-auto w-10 h-10 md:w-12 md:h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full z-30 shadow-inner border border-slate-300 dark:border-slate-700"></div>
                <div className="absolute inset-0 z-20 rounded-full pointer-events-none opacity-20" style={{ background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.4), transparent, rgba(255,255,255,0.4), transparent)' }}></div>
              </div>
            </div>
            {/* Song Info */}
            <div className="w-full text-center px-2 md:px-4 mb-2 md:mb-6">
              <h1 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white truncate drop-shadow-sm tracking-tight">{currentSong.title}</h1>
              <h2 className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 truncate mt-1 md:mt-2 tracking-widest">{currentSong.artist}</h2>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full mt-auto relative z-20">
            <div className="w-full flex flex-col gap-1.5 mb-6 md:mb-8 px-1 md:px-3">
              <input type="range" min="0" max="100" value={progress || 0} onChange={(e) => handleSeek(Number(e.target.value))} className="w-full h-1 md:h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #4f46e5 ${progress}%, rgba(0,0,0,0.15) 0)` }} />
              <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
            </div>
            <div className="w-full flex items-center justify-between px-1 md:px-2 lg:px-4">
              <button onClick={togglePlayMode} className="p-2 transition-transform hover:scale-110">{getModeIcon()}</button>
              <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
                <button onClick={prevSong} className="p-2 text-slate-700 dark:text-slate-300 hover:text-indigo-500 transition-transform hover:scale-110">
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button onClick={togglePlay} className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center bg-indigo-500 text-white rounded-full hover:scale-105 shadow-xl shadow-indigo-500/40 transition-all">
                  {isPlaying
                    ? <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg className="w-7 h-7 md:w-8 md:h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  }
                </button>
                <button onClick={nextSong} className="p-2 text-slate-700 dark:text-slate-300 hover:text-indigo-500 transition-transform hover:scale-110">
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
              </div>
              {/* Volume */}
              <div className="flex items-center" onMouseLeave={() => setShowVolume(false)}>
                <AnimatePresence>
                  {showVolume && (
                    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 80, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="hidden md:flex overflow-hidden items-center mr-2 bg-white/30 dark:bg-black/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20">
                      <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={e => setVolume(Number(e.target.value))} className="w-16 h-1 appearance-none rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, #4f46e5 ${volume * 100}%, rgba(0,0,0,0.15) 0)` }} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <button onClick={() => setShowVolume(!showVolume)} onDoubleClick={toggleMute} className={`p-2 rounded-full transition-all ${showVolume ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-500'}`}>
                  {isMuted || volume === 0
                    ? <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                    : <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Lyrics & Playlist */}
        <div className="md:col-span-7 flex flex-col bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-[32px] shadow-2xl relative transition-colors duration-700 overflow-hidden h-[450px] md:h-auto shrink-0">
          {/* Tab Switcher */}
          <div className="flex items-center justify-center gap-1 p-1 mt-4 md:mt-6 mx-auto bg-white/50 dark:bg-slate-900/50 rounded-full shadow-inner border border-white/40 w-48 md:w-64 z-20 shrink-0">
            <button onClick={() => setActiveTab('lyrics')} className={`flex-1 py-1.5 md:py-2 rounded-full font-black text-xs md:text-[13px] transition-all ${activeTab === 'lyrics' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500'}`}>歌词</button>
            <button onClick={() => setActiveTab('playlist')} className={`flex-1 py-1.5 md:py-2 rounded-full font-black text-xs md:text-[13px] transition-all ${activeTab === 'playlist' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500'}`}>歌单</button>
          </div>

          <div className="flex-1 relative mt-2 flex flex-col overflow-hidden">
            {/* Lyrics Panel */}
            {activeTab === 'lyrics' && (
              <div className="absolute inset-0 flex flex-col h-full">
                <div className="absolute top-0 left-0 right-0 h-32 md:h-40 bg-gradient-to-b from-white/40 dark:from-slate-800/60 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-32 md:h-40 bg-gradient-to-t from-white/40 dark:from-slate-800/60 to-transparent z-10 pointer-events-none" />
                <div ref={lyricContainerRef} className="h-full overflow-y-auto scroll-smooth relative px-4 md:px-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}>
                  <div className="py-[30vh] md:py-[35vh] flex flex-col gap-4 md:gap-6 text-center lg:px-10">
                    {parsedLyrics.length > 0 ? parsedLyrics.map((line, i) => {
                      const isActive = i === activeLyricIndex;
                      return (
                        <div key={i} ref={isActive ? activeLyricRef : null}
                          className={`transition-all duration-700 cursor-pointer px-2 md:px-4 rounded-2xl ${isActive ? 'opacity-100 scale-105 py-2 md:py-3 bg-white/10' : 'opacity-20 hover:opacity-40'}`}
                          onClick={() => duration > 0 && handleSeek((line.time / duration) * 100)}>
                          <p className={`font-black tracking-tight leading-relaxed transition-all duration-700 ${isActive ? 'text-lg md:text-2xl text-indigo-600 dark:text-indigo-400' : 'text-sm md:text-lg text-slate-700 dark:text-slate-300'}`} style={isActive ? { textShadow: '0 0 20px rgba(99,102,241,0.15)' } : {}}>{line.text}</p>
                        </div>
                      );
                    }) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 md:gap-4">
                          <div className="w-8 h-8 border-3 border-indigo-500/40 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-base md:text-xl font-black text-indigo-500 animate-pulse">{currentLyric || "正在捕获旋律..."}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Playlist Panel */}
            {activeTab === 'playlist' && (
              <div className="absolute inset-0 px-4 md:px-8 pb-4 md:pb-8 pt-2 md:pt-4 flex flex-col">
                <div className="relative w-full max-w-md mx-auto group mb-4 md:mb-8 shrink-0">
                  <div className="absolute inset-0 bg-indigo-500/5 blur-xl group-focus-within:bg-indigo-500/10 transition-all rounded-full" />
                  <svg className="w-4 h-4 md:w-5 md:h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="搜索音轨..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-10 md:h-12 pl-10 md:pl-12 pr-10 bg-white/30 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-full text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-inner transition-all" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/10 rounded-full transition-colors"><svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
                </div>
                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 md:gap-2.5" style={{ scrollbarWidth: 'none' }}>
                  {filteredPlaylist.map((song, idx) => {
                    const origIdx = playlist.indexOf(song);
                    const isCurrent = origIdx === currentIndex;
                    return (
                      <motion.div key={origIdx} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        onClick={() => playSong(origIdx)}
                        className={`group flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer transition-all border ${isCurrent ? 'bg-white/60 dark:bg-slate-700/80 shadow-md border-indigo-500/30' : 'border-transparent hover:bg-white/30 dark:hover:bg-slate-700/40'}`}>
                        <div className="flex items-center gap-3 md:gap-4 w-[85%]">
                          <div className="relative w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-lg md:rounded-xl overflow-hidden shadow-sm">
                            {song.pic ? (
                              <Image
                                src={song.pic}
                                alt=""
                                fill
                                sizes="48px"
                                quality={75}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                              </div>
                            )}
                            {isCurrent && isPlaying && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                <div className="flex gap-[3px] items-end h-2 md:h-3">
                                  <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_0ms]" />
                                  <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_200ms]" />
                                  <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite_400ms]" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className={`text-sm md:text-[15px] font-black truncate ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>{song.title}</span>
                            <span className="text-[10px] md:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{song.artist}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
