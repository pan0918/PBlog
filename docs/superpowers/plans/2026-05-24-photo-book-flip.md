# Photo Wall Book Flip Effect — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the photo wall modal with a CSS 3D Transform book page-flip viewer.

**Architecture:** Create `BookViewer.tsx` with CSS `perspective` + `rotateY` flip mechanism. Modify `PhotoWallClient.tsx` to open BookViewer instead of the grid modal. Entry animation via Framer Motion shared layout.

**Tech Stack:** React, CSS 3D Transforms, Framer Motion, TypeScript, Tailwind CSS

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `app/photowall/BookViewer.tsx` | CREATE | Book flip viewer component (cover + pages + flip logic) |
| `app/photowall/PhotoWallClient.tsx` | MODIFY | Replace modal with BookViewer, add entry animation |

---

### Task 1: Create BookViewer Component — Structure & Cover Page

**Files:**
- Create: `app/photowall/BookViewer.tsx`

- [ ] **Step 1: Create BookViewer.tsx with basic structure and cover page**

```tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Photo {
  url: string;
  caption?: string;
}

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
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<"next" | "prev" | null>(null);
  const totalPages = 1 + album.photos.length; // cover + photos

  const flipNext = useCallback(() => {
    if (isFlipping || currentPage >= totalPages - 1) return;
    setFlipDir("next");
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((p) => p + 1);
      setIsFlipping(false);
      setFlipDir(null);
    }, 800);
  }, [isFlipping, currentPage, totalPages]);

  const flipPrev = useCallback(() => {
    if (isFlipping || currentPage <= 0) return;
    setFlipDir("prev");
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((p) => p - 1);
      setIsFlipping(false);
      setFlipDir(null);
    }, 800);
  }, [isFlipping, currentPage]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") flipNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") flipPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flipNext, flipPrev, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all text-lg"
      >
        ✕
      </button>

      {/* Page counter */}
      <div className="absolute top-6 left-6 z-[110] text-white/60 text-sm font-mono">
        {currentPage + 1} / {totalPages}
      </div>

      {/* Book container */}
      <div
        className="relative"
        style={{ perspective: "1200px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl"
          style={{ width: "min(80vw, 800px)", height: "min(60vh, 600px)" }}
        >
          {/* Pages */}
          {Array.from({ length: totalPages }).map((_, i) => {
            const isFlippingThis =
              isFlipping &&
              ((flipDir === "next" && i === currentPage) ||
                (flipDir === "prev" && i === currentPage - 1));

            return (
              <div
                key={i}
                className="absolute inset-0"
                style={{
                  transformStyle: "preserve-3d",
                  transform:
                    i === currentPage || isFlippingThis
                      ? `rotateY(${
                          isFlippingThis
                            ? flipDir === "next"
                              ? -180
                              : 180
                            : 0
                        }deg)`
                      : i < currentPage
                      ? "rotateY(-180deg)"
                      : "rotateY(0deg)",
                  transition: isFlippingThis
                    ? "transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)"
                    : "none",
                  zIndex: totalPages - i,
                  backfaceVisibility: "hidden",
                }}
              >
                {/* Front face */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {i === 0 ? (
                    // Cover page
                    <div className="relative w-full h-full overflow-hidden">
                      <img
                        src={album.cover}
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                          {album.title}
                        </h2>
                        <p className="text-white/70 text-sm md:text-base">
                          {album.description}
                        </p>
                        <div className="mt-4 text-white/40 text-xs flex items-center gap-2">
                          <span>{album.date}</span>
                          <span>·</span>
                          <span>{album.photos.length} 张照片</span>
                        </div>
                        <div className="mt-6 text-white/50 text-xs flex items-center gap-1">
                          <span>← 翻页查看 →</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Photo page
                    <div className="relative w-full h-full">
                      <img
                        src={album.photos[i - 1].url}
                        alt={album.photos[i - 1].caption || ""}
                        className="w-full h-full object-cover"
                      />
                      {album.photos[i - 1].caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-white text-sm font-bold text-center">
                            {album.photos[i - 1].caption}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Back face */}
                <div
                  className="absolute inset-0"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  {i + 1 < totalPages ? (
                    <div className="relative w-full h-full">
                      {i + 1 === 0 ? (
                        <div className="relative w-full h-full overflow-hidden">
                          <img
                            src={album.cover}
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                              {album.title}
                            </h2>
                            <p className="text-white/70 text-sm md:text-base">
                              {album.description}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <img
                            src={album.photos[i].url}
                            alt={album.photos[i].caption || ""}
                            className="w-full h-full object-cover"
                          />
                          {album.photos[i].caption && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                              <p className="text-white text-sm font-bold text-center">
                                {album.photos[i].caption}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <p className="text-white/40 text-sm">— End —</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Page shadow during flip */}
          {isFlipping && (
            <div
              className="absolute inset-0 pointer-events-none z-[999]"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.15) 100%)",
              }}
            />
          )}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          flipPrev();
        }}
        disabled={currentPage <= 0}
        className="absolute left-4 md:left-8 z-[110] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          flipNext();
        }}
        disabled={currentPage >= totalPages - 1}
        className="absolute right-4 md:right-8 z-[110] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep BookViewer`
Expected: No errors in BookViewer.tsx

---

### Task 2: Modify PhotoWallClient to Use BookViewer

**Files:**
- Modify: `app/photowall/PhotoWallClient.tsx`

- [ ] **Step 1: Replace modal with BookViewer**

Replace the entire `Album Detail Modal` section (the `AnimatePresence` block with `selectedAlbum`) with a BookViewer. The file currently has two states: `selectedAlbum` and `selectedPhoto`. Keep `selectedPhoto` for the lightbox but replace the album modal.

```tsx
"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BookViewer from "./BookViewer";

interface Photo {
  url: string;
  caption?: string;
}

interface Album {
  id: string;
  title: string;
  description: string;
  cover: string;
  date: string;
  photos: Photo[];
}

export default function PhotoWallClient({ albums }: { albums: Album[] }) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div>
      {/* Albums Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {albums.map((album) => (
          <motion.div
            key={album.id}
            layoutId={`album-${album.id}`}
            onClick={() => setSelectedAlbum(album)}
            className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] group"
          >
            <div className="w-full h-48 relative overflow-hidden">
              <img
                src={album.cover}
                alt={album.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white">{album.title}</h3>
                <p className="text-xs text-white/80">
                  {album.photos.length} 张照片 · {album.date}
                </p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                {album.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Book Viewer */}
      <AnimatePresence>
        {selectedAlbum && (
          <BookViewer
            album={selectedAlbum}
            onClose={() => setSelectedAlbum(null)}
          />
        )}
      </AnimatePresence>

      {/* Photo Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedPhoto}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -E "PhotoWall|BookViewer"`
Expected: No errors in either file

- [ ] **Step 3: Build and verify no errors**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds

---

### Task 3: Add Touch Swipe Support

**Files:**
- Modify: `app/photowall/BookViewer.tsx`

- [ ] **Step 1: Add touch gesture handling**

Add touch handlers to the BookViewer for swipe-left/right navigation. Add these state refs and handlers:

```tsx
// Add these refs inside the component, after the existing state declarations:
const touchStartX = useRef(0);
const touchStartY = useRef(0);

// Add this handler:
const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
  touchStartY.current = e.touches[0].clientY;
};

const handleTouchEnd = (e: React.TouchEvent) => {
  const dx = e.changedTouches[0].clientX - touchStartX.current;
  const dy = e.changedTouches[0].clientY - touchStartY.current;
  // Only trigger if horizontal swipe is dominant
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    if (dx < 0) flipNext();
    else flipPrev();
  }
};
```

Add `onTouchStart` and `onTouchEnd` to the book container div:

```tsx
// On the inner book div (the one with style={{ width: "min(80vw, 800px)", height: "min(60vh, 600px)" }}), add:
onTouchStart={handleTouchStart}
onTouchEnd={handleTouchEnd}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep BookViewer`
Expected: No errors

- [ ] **Step 3: Commit all changes**

```bash
git add app/photowall/BookViewer.tsx app/photowall/PhotoWallClient.tsx
git commit -m "feat: add CSS 3D book page-flip viewer for photo wall

- BookViewer component with perspective + rotateY flip animation
- Cover page with album info, photo pages with captions
- Keyboard navigation (arrows, Escape)
- Touch swipe support
- Framer Motion entry/exit animations
- Modified PhotoWallClient to use BookViewer instead of grid modal"
```
