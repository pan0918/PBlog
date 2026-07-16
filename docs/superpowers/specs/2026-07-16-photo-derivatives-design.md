# Photo Wall Derivative Images Design

## Goal

Make the photo wall smooth on a cold cache without increasing browser memory or sustained CPU usage. Keep every original photo intact while serving files sized for the actual UI.

## Constraints

- Do not solve the issue by increasing Next.js' remote-image timeout.
- Do not load original multi-megabyte photos into the wall or lightbox during normal browsing.
- Generate a 640 px WebP thumbnail and a 1600 px WebP preview for every photo.
- Preserve the original URL for an explicit original-image action.
- Process historical photos with low concurrency and make the job safe to rerun.
- Generate derivatives automatically when an administrator adds a new photo URL.

## Chosen Approach

Generate and store two derivative files in the existing image bed. Record their URLs in Turso. This adds storage, but it removes repeated resizing work, keeps browser decode surfaces bounded, and avoids the hard-coded seven-second upstream timeout in the Next.js image optimizer.

The alternatives were rejected for these reasons:

1. Increasing or patching the Next.js timeout remains brittle and still fails for measured 17–27 second origin responses.
2. Loading originals directly avoids the proxy timeout but increases network transfer, image decoding memory, and heat.
3. Generating derivatives on every request repeats CPU work and recreates the same cold-cache bottleneck.

## Data Model

The `photos` table keeps `image_url` as the immutable original and `thumbnail_url` as the 640 px derivative. A nullable `preview_url` column stores the 1600 px derivative. Existing `width` and `height` fields store the original image dimensions.

New installations include `preview_url` in the base schema. Existing installations use an idempotent migration that checks `PRAGMA table_info(photos)` before adding the column.

The application remains backward compatible while migration is incomplete:

- Thumbnail source: `thumbnail_url`, then `preview_url`, then `image_url`.
- Viewer source: `preview_url`, then `image_url`.
- Original action: always `image_url`.

Fallbacks are marked `unoptimized` for the known slow image-bed host so they do not fail through `/_next/image`. The historical backfill removes normal reliance on those fallbacks.

## Image Processing

A focused server-only module owns the derivative pipeline:

1. Validate that the source uses HTTP or HTTPS.
2. Fetch the source with an explicit 60 second timeout and a maximum 8 MiB response limit.
3. Decode once with Sharp, apply EXIF rotation, and read original dimensions.
4. Produce WebP thumbnail bytes with maximum width 640 px, no enlargement, quality 72.
5. Produce WebP preview bytes with maximum width 1600 px, no enlargement, quality 82.
6. Upload both generated files through the existing authenticated image-bed endpoint.
7. Return the two URLs and original dimensions.

Animated inputs are flattened to their first frame because the photo wall is designed for still photographs. Invalid, oversized, timed-out, or undecodable sources return a concise administrator-facing error and do not create a partial database row.

## New Photo Flow

The existing administrator form continues accepting an original image URL. The create-photo route generates and uploads both derivatives before inserting the photo record. Database insertion happens only after both uploads succeed, so every newly created photo is immediately optimized.

This operation is intentionally synchronous: the current project has no durable job queue, and pretending that an in-process background task is reliable would risk silently incomplete photos. The admin UI keeps its existing loading state and shows the pipeline error when generation fails, allowing a safe retry.

## Historical Backfill

An administrator-run script performs the schema migration and processes photos missing either derivative:

- Fetch rows in stable order.
- Process at concurrency two to limit local CPU, memory, and origin pressure.
- Skip rows that already contain both URLs.
- Update a row only after both uploads succeed.
- Continue after individual failures and print succeeded, skipped, and failed totals.
- Exit nonzero when any photo fails so incomplete migration is visible.

Rerunning the script is safe because completed rows are skipped. The script does not delete originals or old derivative files.

## Photo Wall Delivery

The server page passes three explicit fields for each photo: `thumbnailUrl`, `previewUrl`, and `originalUrl`.

- Album stacks and covers use only `thumbnailUrl`.
- The lightbox mounts only the current `previewUrl`; it does not preload the whole album.
- Derived files use `unoptimized` because they are already resized and encoded, avoiding another server fetch and conversion.
- The viewer exposes an explicit original-image link, so the multi-megabyte original loads only after user intent.
- Existing `loading`, `decoding`, viewport fitting, and unmount behavior remain in place.

For album covers, the first available photo thumbnail is preferred over `albums.cover_url`; the configured cover remains a fallback for empty or partially migrated albums.

## Error Handling and Operations

- Source fetch, size validation, decode, derivative upload, and database errors are reported separately without exposing tokens.
- A failed new-photo pipeline does not insert the photo record.
- A failed historical item does not stop the remaining backfill.
- No image-bed deletion API is introduced; originals and uploaded derivatives are preserved on soft deletion.
- Required environment variables remain `IMAGE_BED_TOKEN`, `IMAGE_BED_BASE_URL`, and `IMAGE_BED_UPLOAD_CHANNEL` with the current defaults.

## Testing and Verification

Automated tests cover:

- Source URL validation, byte limit enforcement, dimensions, no enlargement, and both WebP output widths.
- Upload response parsing and derivative-pipeline failures.
- Photo repository reads and writes for `preview_url`.
- Create-photo behavior: derivatives complete before insertion and failures do not insert.
- Backfill idempotency and bounded concurrency.
- Photo wall mapping and components use thumbnails/previews, bypass redundant optimization, and retain the original link.

Verification consists of the focused Node tests, the full test suite, ESLint, and a production Next.js build. A manual cold-cache check should confirm that normal photo-wall navigation requests derivative URLs rather than original image URLs or failing `/_next/image` routes.
