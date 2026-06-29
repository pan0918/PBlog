# Photo Wall Memory Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace full-resolution photo decoding with viewport-sized Next.js optimized images without changing photo-wall interactions.

**Architecture:** Configure a narrow remote-image allowlist, render album layers and the active viewer image through `next/image`, and calculate the viewer container from the already-loaded optimized image. A small pure sizing helper provides deterministic behavior and test coverage.

**Tech Stack:** Next.js 16 Image Optimization, React 19, TypeScript, Node test runner.

---

### Task 1: Add failing memory regression tests

**Files:**
- Create: `tests/photowall-memory.test.mjs`
- Create: `app/photowall/imageSizing.ts`

- [ ] **Step 1: Write tests for image optimization contracts and viewport fitting**

The test imports `fitImageWithinViewport`, checks landscape/portrait geometry, and asserts that the two photo-wall components use `next/image`, responsive `sizes`, and no `new Image()` probe.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/photowall-memory.test.mjs`

Expected: FAIL because `imageSizing.ts` and the optimized image implementation do not exist.

- [ ] **Step 3: Implement the pure sizing helper**

Export:

```ts
export function fitImageWithinViewport(
  naturalWidth: number,
  naturalHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const scale = Math.min(
    1,
    viewportWidth * 0.85 / naturalWidth,
    viewportHeight * 0.78 / naturalHeight,
  );
  return { width: naturalWidth * scale, height: naturalHeight * scale };
}
```

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/photowall-memory.test.mjs`

Expected: sizing assertions pass while component source assertions remain RED.

### Task 2: Optimize album-card images

**Files:**
- Modify: `next.config.ts`
- Modify: `app/photowall/PhotoWallClient.tsx`
- Test: `tests/photowall-memory.test.mjs`

- [ ] **Step 1: Configure Image Optimization**

Remove `unoptimized`, add exact HTTPS `/file/**` remote patterns for the two configured image hosts, and allow qualities `[75, 80, 90]`.

- [ ] **Step 2: Replace the three card `<img>` elements**

Use `Image fill quality={80}` with:

```tsx
sizes="(max-width: 640px) 85vw, (max-width: 1024px) 42vw, 287px"
```

Keep all existing transforms, opacity, grayscale, blur, hover overlays, and text.

- [ ] **Step 3: Run the focused test**

Run: `node --test tests/photowall-memory.test.mjs`

Expected: card and configuration assertions pass.

### Task 3: Optimize the active viewer image

**Files:**
- Modify: `app/photowall/BookViewer.tsx`
- Test: `tests/photowall-memory.test.mjs`

- [ ] **Step 1: Remove original-image size probing**

Delete `useImageSize` and its `new Image()` allocation.

- [ ] **Step 2: Render the active photo with `next/image`**

Use `Image fill sizes="85vw" quality={90}`. In `onLoad`, call `fitImageWithinViewport` with the delivered image dimensions and current viewport, then reveal the image. Preserve the 300×300 loading skeleton until sizing completes.

- [ ] **Step 3: Run the focused and full tests**

Run: `node --test tests/photowall-memory.test.mjs tests/*.test.mjs`

Expected: all tests pass.

### Task 4: Validate build and runtime behavior

**Files:**
- Verify only.

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: no errors and no new photo-wall `<img>` warnings.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: successful compilation, type checking, and static generation.

- [ ] **Step 3: Verify in browser**

Reload `/photowall`, confirm all five cards retain their three-layer presentation, open an album, navigate photos, close it, and inspect delivered natural image dimensions. Card images must be responsive outputs rather than 4K/5K originals.

