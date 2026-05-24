"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BookViewer from "./BookViewer";

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
          <motion.div
            key={album.id}
            layoutId={`album-${album.id}`}
            onClick={() => setSelectedAlbum(album)}
            className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] group"
          >
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
          </motion.div>
        ))}
      </div>

      {/* Book Viewer */}
      <AnimatePresence>
        {selectedAlbum && (
          <BookViewer album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
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
