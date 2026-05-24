# Photo Wall Book Flip Effect — Design Spec

## Overview

Replace the current photo wall modal (grid view) with a CSS 3D Transform book page-flip effect. Clicking an album card opens a full-screen book viewer where each page displays one photo, with realistic left/right page-flip animations.

## Tech Stack

- **CSS 3D Transform** — `perspective`, `rotateY`, `transform-style: preserve-3d`
- **Framer Motion** — card-to-book entry animation
- **React state** — page index tracking
- **No external libraries** — zero new dependencies

## User Flow

1. Album grid page (existing, unchanged)
2. Click album card → card expands via Framer Motion into full-screen book viewer
3. Book opens showing **cover page** (album title + description + cover image)
4. Swipe left / click right arrow → page flips to next photo
5. Each photo page shows: full-bleed photo + caption overlay
6. Swipe right / click left arrow → flip back
7. Click close button → book closes, returns to album grid

## Component Architecture

```
PhotoWallClient.tsx (existing — modify modal section)
  └─ BookViewer.tsx (NEW — full-screen book component)
       ├─ BookCover (cover page component)
       └─ BookPage (photo page component × N)
```

### BookViewer.tsx

**Props:**
```ts
interface BookViewerProps {
  album: Album;
  onClose: () => void;
}
```

**State:**
- `currentPage: number` — current page index (0 = cover, 1..N = photos)
- `isFlipping: boolean` — prevents interaction during flip animation
- `flipDirection: 'next' | 'prev' | null` — which direction the flip goes

**Layout:**
```
┌─────────────────────────────────────┐
│  [Close]              [Page 2/4]    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      ┌─────┬─────┐         │    │
│  │      │Left │Right│         │    │
│  │      │Page │Page │         │    │
│  │      │     │     │         │    │
│  │      └─────┴─────┘         │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│  [◀ Prev]          [Next ▶]         │
└─────────────────────────────────────┘
```

- Book container: centered, `perspective: 1200px`
- Book dimensions: responsive, max ~800×600px on desktop
- Pages are split: left half + right half (like an open book)
- Current page occupies one half; next page is the other half

### BookCover

**Content:**
- Album cover image (full background)
- Album title (large, centered)
- Album description (below title)
- "Open" indicator or subtle arrow

**Style:**
- Full-bleed cover image with dark overlay
- White text, clean typography

### BookPage

**Content:**
- Photo (full-bleed, `object-cover`)
- Caption (bottom overlay, semi-transparent background)

**Style:**
- Each page fills one half of the book
- Page edges have subtle shadow for depth
- Page curl shadow on flip

## CSS 3D Flip Mechanism

```css
.book {
  perspective: 1200px;
}

.page {
  position: absolute;
  width: 50%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.page.flipping {
  transform: rotateY(-180deg);
}

.page-front, .page-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.page-back {
  transform: rotateY(180deg);
}
```

### Flip Flow (Next Page)

1. Current page's front = current photo
2. Current page's back = next photo
3. Next page's front = next photo (hidden behind current page)
4. On flip: current page rotates -180° on Y axis
5. The `page-back` (next photo) becomes visible as the page turns
6. After animation completes: update state to show next page at rest

### Flip Flow (Previous Page)

- Mirror of above: rotateY(180°) → rotateY(0°)

## Entry Animation (Card → Book)

Using Framer Motion:
1. Card's `layoutId` matches a shared element
2. On click, Framer Motion animates from card position/size to book position/size
3. Book fades in with scale animation
4. After entry animation completes, book is interactive

## Keyboard & Touch

- **Left arrow** / **Swipe left** → next page
- **Right arrow** / **Swipe right** → previous page
- **Escape** → close book
- **Touch gestures**: track touchstart/touchmove/touchend for swipe detection

## Responsiveness

- **Desktop (>768px):** Book centered, landscape orientation, comfortable reading size
- **Mobile (≤768px):** Book fills most of screen, portrait or landscape, swipe gestures primary interaction

## Styling (matching existing dark theme)

- Book background: `slate-900` / `white` (light/dark mode)
- Page shadow: `shadow-2xl` on book container
- Caption overlay: semi-transparent black gradient at bottom
- Close button: top-right, `bg-slate-800/80` circle

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/photowall/BookViewer.tsx` | CREATE | Main book flip component |
| `app/photowall/PhotoWallClient.tsx` | MODIFY | Replace modal with BookViewer |
