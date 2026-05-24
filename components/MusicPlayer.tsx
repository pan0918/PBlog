"use client";
import { useMusic } from './MusicProvider';

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "00:00";
  const m = Math.floor(time / 60).toString().padStart(2, '0');
  const s = Math.floor(time % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function MusicPlayer() {
  const { playlist, currentSong, isPlaying, progress, currentTime, duration, currentLyric, playMode, togglePlay, nextSong, prevSong, handleSeek, togglePlayMode, playSong } = useMusic();

  return (
    <div className="w-full space-y-6">
      {/* Main Player */}
      <div className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-8 transition-colors duration-700">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-40 h-40 rounded-full border-4 border-white/50 shadow-2xl overflow-hidden flex-shrink-0 animate-[spin_6s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
            <img src={currentSong?.pic || ''} alt="cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{currentSong?.title || 'No Song'}</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">{currentSong?.artist || ''}</p>
            {currentLyric && <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-4 animate-pulse">{currentLyric}</p>}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-slate-500 font-mono w-12 text-right">{formatTime(currentTime)}</span>
              <input type="range" min="0" max="100" value={progress} onChange={(e) => handleSeek(Number(e.target.value))} className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none outline-none cursor-pointer" style={{ background: `linear-gradient(to right, #818cf8 ${progress}%, rgba(148,163,184,0.4) ${progress}%)` }} />
              <span className="text-xs text-slate-500 font-mono w-12">{formatTime(duration)}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <button onClick={() => setPlayMode(playMode === 'list' ? 'random' : playMode === 'random' ? 'single' : 'list')} className="text-sm font-bold text-slate-500 hover:text-indigo-500 transition-colors px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {playMode === 'list' ? '列表循环' : playMode === 'random' ? '随机播放' : '单曲循环'}
              </button>
              <button onClick={prevSong} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>
              <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:scale-110 transition-all border-2 border-white/50">
                {isPlaying ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
              </button>
              <button onClick={nextSong} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist */}
      <div className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 transition-colors duration-700">
        <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">PLAYLIST</h3>
        <div className="space-y-2">
          {playlist.map((song, i) => (
            <button
              key={song.id}
              onClick={() => playSong(song)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 text-left ${
                currentSong?.id === song.id ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-slate-100/50 dark:hover:bg-slate-700/30 border border-transparent'
              }`}
            >
              <span className="text-xs font-bold text-slate-400 w-6 text-center">{i + 1}</span>
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                <img src={song.pic || ''} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{song.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{song.artist}</p>
              </div>
              {currentSong?.id === song.id && isPlaying && (
                <div className="flex gap-0.5 items-end h-4">
                  <div className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: '16px' }}></div>
                  <div className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: '10px', animationDelay: '0.2s' }}></div>
                  <div className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: '14px', animationDelay: '0.4s' }}></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
