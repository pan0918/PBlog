"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";

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
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flippingPage, setFlippingPage] = useState<number | null>(null);
  const [flipDir, setFlipDir] = useState<"next" | "prev" | null>(null);
  const totalPages = 1 + album.photos.length;
  const touchStartX = useRef(0);

  const flipNext = useCallback(() => {
    if (isFlipping || currentPage >= totalPages - 1) return;
    setFlippingPage(currentPage);
    setFlipDir("next");
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((p) => p + 1);
      setIsFlipping(false);
      setFlippingPage(null);
      setFlipDir(null);
    }, 800);
  }, [isFlipping, currentPage, totalPages]);

  const flipPrev = useCallback(() => {
    if (isFlipping || currentPage <= 0) return;
    const targetPage = currentPage - 1;
    setFlippingPage(targetPage);
    setFlipDir("prev");
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(targetPage);
      setIsFlipping(false);
      setFlippingPage(null);
      setFlipDir(null);
    }, 800);
  }, [isFlipping, currentPage]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") flipNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") flipPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flipNext, flipPrev, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartX.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) flipNext();
      else flipPrev();
    }
  };

  // Determine each page's visual state
  const getPageStyle = (i: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      inset: 0,
      transformOrigin: "left center",
      transformStyle: "preserve-3d",
      zIndex: totalPages - i,
    };

    // Page is flipping forward (turning to the left)
    if (flippingPage === i && flipDir === "next") {
      return {
        ...base,
        transformOrigin: "left center",
        transform: "rotateY(-180deg)",
        transition: "transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)",
        zIndex: totalPages - i,
      };
    }

    // Page is flipping backward (turning back to the right)
    if (flippingPage === i && flipDir === "prev") {
      return {
        ...base,
        transformOrigin: "left center",
        transform: "rotateY(0deg)",
        transition: "transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)",
        zIndex: totalPages - i + 1,
      };
    }

    // Already flipped (turned to left side)
    if (i < currentPage) {
      return {
        ...base,
        transformOrigin: "left center",
        transform: "rotateY(-180deg)",
      };
    }

    // Current or future page (visible on right side, stacked)
    return {
      ...base,
      transformOrigin: "left center",
      transform: "rotateY(0deg)",
    };
  };

  const renderPageContent = (i: number) => {
    if (i === 0) {
      return (
        <div className="relative w-full h-full overflow-hidden rounded-r-2xl">
          <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{album.title}</h2>
            <p className="text-white/70 text-sm md:text-base">{album.description}</p>
            <div className="mt-4 text-white/40 text-xs flex items-center gap-2">
              <span>{album.date}</span>
              <span>·</span>
              <span>{album.photos.length} 张照片</span>
            </div>
            <div className="mt-6 text-white/50 text-xs">→ 向右翻页查看</div>
          </div>
        </div>
      );
    }
    const photo = album.photos[i - 1];
    return (
      <div className="relative w-full h-full rounded-r-2xl overflow-hidden">
        <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover" />
        {photo.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-white text-sm font-bold text-center">{photo.caption}</p>
          </div>
        )}
      </div>
    );
  };

  const renderBackFace = (i: number) => {
    const nextIdx = i + 1;
    if (nextIdx >= totalPages) {
      return (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center rounded-l-2xl">
          <p className="text-white/40 text-sm">— End —</p>
        </div>
      );
    }
    const content = nextIdx === 0
      ? (
          <div className="relative w-full h-full overflow-hidden rounded-l-2xl">
            <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{album.title}</h2>
              <p className="text-white/70 text-sm md:text-base">{album.description}</p>
            </div>
          </div>
        )
      : (
          <div className="relative w-full h-full rounded-l-2xl overflow-hidden">
            <img src={album.photos[nextIdx - 1].url} alt={album.photos[nextIdx - 1].caption || ""} className="w-full h-full object-cover" />
            {album.photos[nextIdx - 1].caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-sm font-bold text-center">{album.photos[nextIdx - 1].caption}</p>
              </div>
            )}
          </div>
        );
    return content;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all text-lg"
      >
        ✕
      </button>

      <div className="absolute top-6 left-6 z-[110] text-white/60 text-sm font-mono">
        {currentPage === 0 ? "封面" : `${currentPage} / ${totalPages - 1}`}
      </div>

      <div className="relative" style={{ perspective: "1200px" }} onClick={(e) => e.stopPropagation()}>
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ width: "min(80vw, 800px)", height: "min(60vh, 600px)" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageStyle = getPageStyle(i);
            const isFlippingThis = flippingPage === i;

            return (
              <div key={i} style={pageStyle}>
                {/* Front face */}
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {renderPageContent(i)}
                </div>

                {/* Back face (what this page shows when flipped) */}
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  {renderBackFace(i)}
                </div>

                {/* Page curl shadow during flip */}
                {isFlippingThis && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 15%)",
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Book spine shadow */}
          <div
            className="absolute top-0 bottom-0 left-0 w-4 pointer-events-none z-[998]"
            style={{
              background: "linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 100%)",
            }}
          />

          {/* Page edge shadow */}
          {isFlipping && (
            <div
              className="absolute inset-0 pointer-events-none z-[997]"
              style={{
                background: "linear-gradient(to left, rgba(0,0,0,0.1) 0%, transparent 5%)",
              }}
            />
          )}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); flipPrev(); }}
        disabled={currentPage <= 0}
        className="absolute left-4 md:left-8 z-[110] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); flipNext(); }}
        disabled={currentPage >= totalPages - 1}
        className="absolute right-4 md:right-8 z-[110] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </motion.div>
  );
}
