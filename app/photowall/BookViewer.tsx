"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { shouldBypassImageOptimizer } from "./imageDelivery";
import { fitImageWithinViewport, type FittedImageSize } from "./imageSizing";

interface Photo { url: string; caption?: string; }

interface Album {
  id: string;
  title: string;
  description: string;
  cover: string;
  date: string;
  photos: Photo[];
}

interface BookViewerProps {
  album: Album;
  onClose: () => void;
}

export default function BookViewer({ album, onClose }: BookViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);
  const total = album.photos.length;

  const goNext = useCallback(() => {
    if (currentIndex >= total - 1) return;
    setDirection(1);
    setCurrentIndex((p) => p + 1);
  }, [currentIndex, total]);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    setDirection(-1);
    setCurrentIndex((p) => p - 1);
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  const photo = album.photos[currentIndex];
  if (!photo) return null;

  return (
    <>
      <button
        onClick={onClose}
        className="fixed top-24 right-8 z-[200] w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 hover:scale-110 transition-all duration-200 cursor-pointer"
        aria-label="关闭"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <div className="absolute top-6 left-6 z-[110] text-white/60 text-sm font-mono">
          {currentIndex + 1} / {total}
        </div>

        <div
          className="relative rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait" initial={false}>
            <Slide key={currentIndex} photo={photo} direction={direction} />
          </AnimatePresence>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          disabled={currentIndex <= 0}
          className="absolute left-4 md:left-8 z-[110] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          disabled={currentIndex >= total - 1}
          className="absolute right-4 md:right-8 z-[110] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110] flex gap-2">
          {album.photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${i === currentIndex ? "bg-white scale-125" : "bg-white/30 hover:bg-white/50"}`}
              aria-label={`第 ${i + 1} 张`}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}

function Slide({ photo, direction }: { photo: Photo; direction: number }) {
  const [size, setSize] = useState<FittedImageSize | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: direction * 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction * -60 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex items-center justify-center overflow-hidden rounded-2xl"
      style={size ? { width: size.width, height: size.height } : { width: 300, height: 300 }}
    >
      {!size && <div className="absolute inset-0 bg-white/5 rounded-2xl animate-pulse" />}
      <Image
        src={photo.url}
        alt={photo.caption || ""}
        fill
        sizes="85vw"
        quality={90}
        loading="eager"
        decoding="async"
        unoptimized={shouldBypassImageOptimizer(photo.url)}
        onLoad={(event) => {
          const image = event.currentTarget;
          setSize(
            fitImageWithinViewport(
              image.naturalWidth,
              image.naturalHeight,
              window.innerWidth,
              window.innerHeight,
            ),
          );
        }}
        className={`absolute inset-0 w-full h-full object-contain rounded-2xl transition-opacity duration-200 ${
          size ? "opacity-100" : "opacity-0"
        }`}
      />
      {photo.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none rounded-b-2xl">
          <p className="text-white text-sm font-bold text-center">{photo.caption}</p>
        </div>
      )}
    </motion.div>
  );
}
