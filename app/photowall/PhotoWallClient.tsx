"use client";
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Photo { url: string; caption?: string; }
interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export default function PhotoWallClient({ albums }: { albums: Album[] }) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div>
      {/* Albums Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {albums.map(album => (
          <div key={album.id} onClick={() => setSelectedAlbum(album)} className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] group">
            <div className="w-full h-48 relative overflow-hidden">
              <img src={album.cover} alt={album.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white">{album.title}</h3>
                <p className="text-xs text-white/80">{album.photos.length} 张照片 · {album.date}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{album.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Album Detail Modal */}
      <AnimatePresence>
        {selectedAlbum && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedAlbum(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedAlbum.title}</h2>
                  <button onClick={() => setSelectedAlbum(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">✕</button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedAlbum.description}</p>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedAlbum.photos.map((photo, i) => (
                  <div key={i} onClick={() => setSelectedPhoto(photo.url)} className="rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg">
                    <img src={photo.url} alt={photo.caption || ''} className="w-full h-40 object-cover" />
                    {photo.caption && <p className="text-xs text-center py-2 text-slate-600 dark:text-slate-300 font-bold">{photo.caption}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
