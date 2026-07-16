# Photo Wall Derivative Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate persistent 640 px thumbnails and 1600 px previews, backfill existing photos, and make the photo wall load only those bounded-size files.

**Architecture:** A server-only image pipeline fetches an original with strict limits, uses Sharp once to create two WebP outputs, and uploads both through a shared image-bed client. The photo repository stores `thumbnail_url`, `preview_url`, and original dimensions; a low-concurrency idempotent script migrates and backfills historical rows. UI data explicitly separates thumbnail, preview, and original URLs.

**Tech Stack:** Next.js 16 App Router, TypeScript, Sharp 0.34, Turso/libSQL, Node test runner with tsx.

## Global Constraints

- Keep `image_url` as the original URL.
- Thumbnail is maximum width 640 px WebP at quality 72.
- Preview is maximum width 1600 px WebP at quality 82.
- Source downloads time out after 60 seconds and reject bodies over 8 MiB.
- Historical processing concurrency is exactly two by default and is safe to rerun.
- Normal photo-wall browsing never intentionally requests originals.
- Do not patch or extend the Next.js image optimizer timeout.

---

### Task 1: Image-bed client and derivative generator

**Files:**
- Create: `lib/images/image-bed.ts`
- Create: `lib/images/photo-derivatives.ts`
- Modify: `app/api/admin/uploads/route.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/photo-derivatives.test.mjs`

**Interfaces:**
- Produces: `uploadImageToBed(file: Blob, filename: string): Promise<string>`
- Produces: `generatePhotoDerivatives(sourceUrl: string, deps?): Promise<{ thumbnailUrl: string; previewUrl: string; width: number; height: number }>`
- Produces: `readResponseBytes(response: Response, maxBytes: number): Promise<Buffer>`

- [ ] **Step 1: Add Sharp as a direct dependency**

Run: `npm install sharp@^0.34.5 --save`
Expected: `package.json` and `package-lock.json` list Sharp directly.

- [ ] **Step 2: Write failing generator tests**

Cover HTTP(S)-only validation, an oversized response, a landscape image producing widths 640 and 1600, a 320 px image not being enlarged, EXIF-aware dimensions, and upload failures. Inject a fake fetch and upload function; inspect resulting buffers with `sharp(buffer).metadata()`.

- [ ] **Step 3: Run the focused test and observe the expected failure**

Run: `node --import tsx --test tests/photo-derivatives.test.mjs`
Expected: FAIL because `lib/images/photo-derivatives.ts` does not exist.

- [ ] **Step 4: Implement the minimal image-bed client and pipeline**

Move image-bed URL construction and upload response parsing out of the upload route without changing its Vditor response contract. Implement bounded streaming reads, `AbortSignal.timeout(60_000)`, Sharp auto-rotation, no-enlargement resize, and WebP encoding. Name generated files with a random suffix plus `-thumb.webp` or `-preview.webp`.

- [ ] **Step 5: Run focused tests and existing upload-related tests**

Run: `node --import tsx --test tests/photo-derivatives.test.mjs tests/admin-vditor-workbench.test.mjs`
Expected: PASS with zero failures.

### Task 2: Persist preview metadata and optimize new-photo creation

**Files:**
- Create: `lib/photos/create-optimized-photo.ts`
- Modify: `lib/schema.sql`
- Modify: `scripts/init-db.ts`
- Modify: `lib/db/photos.ts`
- Modify: `lib/admin/validators.ts`
- Modify: `app/api/admin/albums/[id]/photos/route.ts`
- Test: `tests/photo-creation-pipeline.test.mjs`

**Interfaces:**
- `PhotoRecord` gains `preview_url: string | null`.
- `createPhoto` and `updatePhoto` accept `preview_url`.
- Produces: `createOptimizedPhoto(input, deps?): Promise<PhotoRecord>`; its dependencies are derivative generation and database insertion.

- [ ] **Step 1: Write failing persistence and service tests**

Assert schema and initialization SQL include nullable `preview_url`; repository INSERT/UPDATE include it. Exercise `createOptimizedPhoto` with injected functions to prove generation finishes before insertion, generated URLs/dimensions are inserted, and a generation failure never calls insertion.

- [ ] **Step 2: Verify the tests fail for missing preview support**

Run: `node --import tsx --test tests/photo-creation-pipeline.test.mjs`
Expected: FAIL on the missing service/module and schema field.

- [ ] **Step 3: Implement preview persistence and creation service**

Add `preview_url` immediately after `thumbnail_url` in schema, types, INSERT arguments, and partial update handling. The service accepts the validated original URL and metadata, awaits `generatePhotoDerivatives`, then calls `createPhoto` once with both derivative URLs and dimensions.

- [ ] **Step 4: Route new photo creation through the service**

Replace direct `createPhoto` in the album-photo POST route with `createOptimizedPhoto`. Export `runtime = 'nodejs'` and `maxDuration = 60`. Keep existing authentication, validation, revalidation, and error response shapes.

- [ ] **Step 5: Run focused tests**

Run: `node --import tsx --test tests/photo-creation-pipeline.test.mjs tests/admin-photo-memory.test.mjs`
Expected: PASS with zero failures.

### Task 3: Idempotent low-concurrency historical backfill

**Files:**
- Create: `lib/images/backfill-photo-derivatives.ts`
- Create: `scripts/backfill-photo-derivatives.ts`
- Modify: `package.json`
- Test: `tests/photo-derivative-backfill.test.mjs`

**Interfaces:**
- Produces: `backfillPhotoDerivatives(photos, processPhoto, updatePhoto, concurrency?): Promise<{ succeeded: number; skipped: number; failed: Array<{ id: string; error: string }> }>`.
- Package script: `photos:backfill` invokes the TypeScript script with tsx.

- [ ] **Step 1: Write failing backfill tests**

Use delayed fake workers to assert at most two jobs overlap, completed rows are skipped, successful updates contain both derivative URLs/dimensions, individual failures do not stop later rows, and the returned totals are exact.

- [ ] **Step 2: Verify the focused test fails**

Run: `node --import tsx --test tests/photo-derivative-backfill.test.mjs`
Expected: FAIL because the backfill module does not exist.

- [ ] **Step 3: Implement the pure concurrency-limited backfill helper**

Use a shared next-index counter with two async workers. Skip only rows with both derivative URLs. Catch errors per row and store safe messages.

- [ ] **Step 4: Implement the operational script**

Require Turso and image-bed environment variables, inspect `PRAGMA table_info(photos)`, add `preview_url` only when absent, select active photos in stable order, invoke the helper, update one row only after both uploads complete, print totals, and set `process.exitCode = 1` when failures exist.

- [ ] **Step 5: Run focused tests**

Run: `node --import tsx --test tests/photo-derivative-backfill.test.mjs`
Expected: PASS with zero failures.

### Task 4: Deliver derivatives in the photo wall

**Files:**
- Modify: `app/photowall/page.tsx`
- Modify: `app/photowall/PhotoWallClient.tsx`
- Modify: `app/photowall/BookViewer.tsx`
- Modify: `tests/photowall-memory.test.mjs`

**Interfaces:**
- Photo UI type becomes `{ thumbnailUrl: string; previewUrl: string; originalUrl: string; caption?: string }`.
- Album `cover` prefers the first photo's thumbnail and falls back to the configured album cover.

- [ ] **Step 1: Replace old source assertions with failing derivative-delivery assertions**

Assert page mapping uses all three URL roles and the cover preference. Assert card images use `thumbnailUrl`, viewer uses only `previewUrl`, all derivative images are `unoptimized`, and the viewer has a safe original link with `target="_blank"` and `rel="noopener noreferrer"`.

- [ ] **Step 2: Verify the focused test fails**

Run: `node --import tsx --test tests/photowall-memory.test.mjs`
Expected: FAIL because UI types and mapping still expose only `url`.

- [ ] **Step 3: Implement explicit URL mapping and delivery**

Map thumbnail fallback as `thumbnail_url || preview_url || image_url` and preview fallback as `preview_url || image_url`. Use thumbnail URLs for every album stack layer and preview URL only for the mounted slide. Mark those Next images `unoptimized`. Add the original link without prefetch or hidden image creation.

- [ ] **Step 4: Run photo-wall and URL safety tests**

Run: `node --import tsx --test tests/photowall-memory.test.mjs tests/url-bytestring.test.mjs`
Expected: PASS with zero failures.

### Task 5: Full verification and operational handoff

**Files:**
- Modify only if verification exposes an issue in files already in scope.

**Interfaces:**
- No new interfaces.

- [ ] **Step 1: Run the complete test suite**

Run: `node --import tsx --test tests/*.test.mjs`
Expected: all tests pass with zero failures.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: exit 0 with no errors; pre-existing warnings may remain.

- [ ] **Step 3: Run a production build**

Run: `npm run build -- --webpack`
Expected: exit 0 and all routes compile.

- [ ] **Step 4: Review the final diff and migration safety**

Run: `git diff --check` and `git status --short`
Expected: no whitespace errors; only the pre-existing rollback snapshot plus photo-derivative implementation files are changed.

- [ ] **Step 5: Do not run the live backfill without explicit deployment-data approval**

Report the exact `npm run photos:backfill` command and environment prerequisites. The script mutates the live Turso database and image bed, so verification stops before executing it.
