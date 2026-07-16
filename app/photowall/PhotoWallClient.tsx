"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import BookViewer from "./BookViewer";
import { shouldBypassImageOptimizer } from "./imageDelivery";

interface Photo { url: string; caption?: string; }
interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export default function PhotoWallClient({ albums }: { albums: Album[] }) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return albums;
    const q = query.toLowerCase();
    return albums.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.photos.some(p => p.caption?.toLowerCase().includes(q))
    );
  }, [albums, query]);

  return (
    <div>
      <p className="text-center text-slate-400 dark:text-slate-500 text-sm mb-6 tracking-wide">
        定格时间，封存每一刻的美好心跳
      </p>

      {/* Search Bar */}
      <div className="relative mb-10 w-full md:w-96 mx-auto group">
        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-500 dark:text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="搜索相册或照片..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-full text-sm text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all duration-300"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20 px-4">
        {filtered.length > 0 ? filtered.map((album, albumIndex) => (
          <div
            key={album.id}
            onClick={() => setSelectedAlbum(album)}
            className="group cursor-pointer flex flex-col items-center"
          >
            <div className="relative w-[85%] aspect-[4/3] mb-8">
              <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 rounded-[4px] shadow-md transform rotate-6 translate-x-4 translate-y-2 group-hover:rotate-12 group-hover:translate-x-8 transition-all duration-500 border-[6px] border-white dark:border-slate-200 overflow-hidden opacity-60">
                {album.photos[2] && (
                  <Image
                    src={album.photos[2].url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 42vw, 28vw"
                    quality={75}
                    loading="lazy"
                    unoptimized={shouldBypassImageOptimizer(album.photos[2].url)}
                    className="absolute inset-0 w-full h-full object-cover grayscale blur-[2px]"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-slate-200 dark:bg-slate-600 rounded-[4px] shadow-lg transform -rotate-3 -translate-x-2 -translate-y-1 group-hover:-rotate-6 group-hover:-translate-x-6 transition-all duration-500 border-[6px] border-white dark:border-slate-200 overflow-hidden opacity-80 z-10">
                {album.photos[1] && (
                  <Image
                    src={album.photos[1].url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 42vw, 28vw"
                    quality={75}
                    loading="lazy"
                    unoptimized={shouldBypassImageOptimizer(album.photos[1].url)}
                    className="absolute inset-0 w-full h-full object-cover grayscale-[50%]"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-white dark:bg-slate-200 rounded-[4px] shadow-2xl border-[6px] border-white dark:border-slate-200 overflow-hidden z-20 transform group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500">
                <Image
                  src={album.cover}
                  alt={album.title}
                  fill
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 42vw, 28vw"
                  quality={75}
                  loading={albumIndex === 0 ? "eager" : "lazy"}
                  unoptimized={shouldBypassImageOptimizer(album.cover)}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-5">
                  <span className="text-white font-bold text-lg drop-shadow-md translate-y-2 group-hover:translate-y-0 transition-transform duration-500">{album.photos.length} 张照片</span>
                  <span className="text-indigo-300 font-medium text-xs mt-1 drop-shadow-md translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-75">Click to Open</span>
                </div>
              </div>
            </div>
            <div className="text-center px-4 w-full">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{album.title}</h2>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-sm uppercase tracking-wider">{album.date}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">{album.description}</p>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-16 text-slate-400 dark:text-slate-500 font-bold">
            没有找到匹配的相册
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAlbum && (
          <BookViewer album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
