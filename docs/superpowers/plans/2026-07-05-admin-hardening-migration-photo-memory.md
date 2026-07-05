# Admin Hardening, Migration Compatibility, and Photo Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden admin authentication, make content migration repeatable without breaking article URLs, make post/tag writes atomic with correct cache invalidation, and reduce photo-management browser memory without sacrificing responsiveness.

**Architecture:** Authentication validation and rate limiting live in focused server-only modules. Migration uses existing business keys and explicit pre-insert checks. Post/tag mutations use libSQL interactive write transactions, while route handlers own cache invalidation. The photo manager renders optimized thumbnails and mutates local state instead of rebuilding the full image grid after every write.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `@libsql/client`, `jose`, `bcryptjs`, Node test runner, ESLint.

---

### Task 1: Strict JWT configuration and durable login limiting

**Files:**
- Create: `lib/admin/jwt-secret.ts`
- Create: `lib/admin/login-rate-limit.ts`
- Modify: `lib/admin/auth.ts`
- Modify: `middleware.ts`
- Modify: `app/api/admin/login/route.ts`
- Modify: `lib/schema.sql`
- Modify: `scripts/init-db.ts`
- Test: `tests/admin-auth.test.mjs`

- [ ] **Step 1: Write failing authentication tests**

Add tests that import the pure JWT-secret validator and login limiter against an in-memory libSQL database:

```js
test("JWT secrets must be at least 32 characters", async () => {
  const { normalizeJwtSecret } = await import("../lib/admin/jwt-secret.ts");
  assert.throws(() => normalizeJwtSecret(undefined), /JWT_SECRET/);
  assert.throws(() => normalizeJwtSecret("short"), /32/);
  assert.equal(normalizeJwtSecret("x".repeat(32)), "x".repeat(32));
});

test("five failed logins block the durable rate key", async () => {
  const client = createClient({ url: "file::memory:" });
  await createLoginFailureTable(client);
  for (let i = 0; i < 5; i++) {
    await recordLoginFailure("key", NOW + i, client);
  }
  const result = await checkLoginRateLimit("key", NOW + 5, client);
  assert.equal(result.allowed, false);
  assert.ok(result.retryAfterSeconds > 0);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/admin-auth.test.mjs`

Expected: FAIL because the JWT validator and durable limiter do not exist.

- [ ] **Step 3: Implement strict JWT validation**

Create `normalizeJwtSecret(value)` that throws when the value is absent or shorter than 32 characters and returns the validated string. Import it from both `auth.ts` and `middleware.ts`; remove the fallback secret. Validate JWT payload strings before accepting a token.

- [ ] **Step 4: Implement durable login limiting**

Add an `admin_login_failures` table and index. Implement:

```ts
export async function createLoginRateKey(username: string, ip: string): Promise<string>;
export async function checkLoginRateLimit(
  rateKey: string,
  now?: number,
  client?: Client,
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }>;
export async function recordLoginFailure(rateKey: string, now?: number, client?: Client): Promise<void>;
export async function clearLoginFailures(rateKey: string, client?: Client): Promise<void>;
```

Use a 15-minute window and five failures. Hash normalized username and IP with SHA-256. Update the login route to check before password verification, record every failed credential check, clear on success, and return `429` with `Retry-After`.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/admin-auth.test.mjs`

Expected: all authentication tests pass.

### Task 2: Idempotent migration and nested article URLs

**Files:**
- Modify: `scripts/migrate-content.ts`
- Move: `app/api/posts/[slug]/view/route.ts` → `app/api/posts/[...slug]/view/route.ts`
- Modify: `components/ClientViewCount.tsx`
- Test: `tests/content-migration.test.mjs`

- [ ] **Step 1: Write failing migration and route tests**

```js
test("migration preserves directory separators in post slugs", async () => {
  const source = await readFile("scripts/migrate-content.ts", "utf8");
  assert.doesNotMatch(source, /replace\\(\\/\\\\\\/g,\\s*['"]-['"]\\)/);
  assert.match(source, /relPath\\.replace\\(\\/\\\\\\.md\\$\\//);
});

test("migration checks natural keys before inserting repeatable content", async () => {
  const source = await readFile("scripts/migrate-content.ts", "utf8");
  assert.match(source, /SELECT id FROM moments WHERE published_at = \\? AND content = \\?/);
  assert.match(source, /SELECT id FROM messages WHERE created_at = \\? AND author = \\? AND content = \\?/);
  assert.match(source, /SELECT id FROM photos WHERE album_id = \\? AND image_url = \\?/);
});

test("view counting accepts nested slugs", async () => {
  await access("app/api/posts/[...slug]/view/route.ts");
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/content-migration.test.mjs`

Expected: FAIL because migration flattens slugs, duplicate checks are absent, and the view route is not catch-all.

- [ ] **Step 3: Preserve URLs and add duplicate checks**

Keep `Research/FluxMem` as the stored slug. Before inserting moments, fallback-ID messages, and photos, query the natural key and skip existing rows. Remove swallowed photo errors so failures reach the top-level failure handler.

- [ ] **Step 4: Move the view route to a catch-all segment**

Read `params.slug` as `string[]`, join with `/`, and keep the current published-post check and atomic increment. Ensure `ClientViewCount` builds the nested path safely by encoding each slug segment.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/content-migration.test.mjs`

Expected: all migration and nested-route tests pass.

### Task 3: Atomic post/tag mutations and complete cache invalidation

**Files:**
- Modify: `lib/db/posts.ts`
- Modify: `lib/admin/revalidate.ts`
- Modify: `app/api/admin/posts/route.ts`
- Modify: `app/api/admin/posts/[id]/route.ts`
- Modify: `app/api/admin/categories/[id]/route.ts`
- Modify: `app/api/admin/tags/[id]/route.ts`
- Test: `tests/admin-content-consistency.test.mjs`

- [ ] **Step 1: Write failing consistency tests**

Add source-level regression tests requiring `db.transaction("write")`, rollback/close handling, old and new slug invalidation, affected-slug lookup before category/tag deletion, and revalidation of `/about`.

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/admin-content-consistency.test.mjs`

Expected: FAIL because post and tag writes are separate and metadata routes do not revalidate public pages.

- [ ] **Step 3: Implement transactional mutation APIs**

Replace the route-level `createPost` + `setPostTags` sequence with:

```ts
createPostWithTags(postInput, tagIds): Promise<PostWithMeta>
updatePostWithTags(id, postInput, tagIds): Promise<{
  post: PostWithMeta | null;
  previousSlug: string | null;
}>
```

Start a `"write"` transaction, insert/update the post, replace tags through the same transaction, commit on success, and close in `finally`. Let foreign-key or uniqueness errors roll the transaction back.

- [ ] **Step 4: Expand targeted revalidation**

Make `revalidateAfterPost` accept multiple optional slugs and refresh `/`, `/timeline`, `/about`, and every unique article path. Query affected article slugs before category/tag update or deletion and call the same helper after success. On post slug changes, pass both previous and current slug.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/admin-content-consistency.test.mjs`

Expected: all transaction and cache tests pass.

### Task 4: Photo-manager memory and render optimization

**Files:**
- Modify: `app/admin/albums/[id]/photos/page.tsx`
- Modify: `app/api/admin/photos/[id]/route.ts`
- Modify: `lib/db/photos.ts`
- Test: `tests/admin-photo-memory.test.mjs`

- [ ] **Step 1: Write failing memory regression tests**

```js
test("admin photo cards use responsive optimized images", async () => {
  const page = await readFile("app/admin/albums/[id]/photos/page.tsx", "utf8");
  assert.match(page, /from ['"]next\\/image['"]/);
  assert.match(page, /thumbnail_url\\s*\\|\\|\\s*photo\\.image_url/);
  assert.match(page, /sizes=/);
  assert.match(page, /loading=\\{index < 4 \\? ['"]eager['"] : ['"]lazy['"]\\}/);
  assert.doesNotMatch(page, /<img\\b/);
});

test("photo writes update local state without refetching the album", async () => {
  const page = await readFile("app/admin/albums/[id]/photos/page.tsx", "utf8");
  assert.match(page, /setPhotos\\(current\\s*=>/);
  assert.doesNotMatch(page, /setEditingId\\(null\\);\\s*fetchData\\(\\)/s);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/admin-photo-memory.test.mjs`

Expected: FAIL because the page uses raw `<img>` elements and refetches after every mutation.

- [ ] **Step 3: Return updated photo records**

Change `updatePhoto` to return `getPhotoById(id)` and make the PUT route return that record. Keep create returning the new record and delete returning success.

- [ ] **Step 4: Implement optimized photo cards**

Add `thumbnail_url` to the client type. Extract a memoized `PhotoCard` using `next/image`, `fill`, `quality={75}`, responsive `sizes`, four eager images, remaining lazy images, and `decoding="async"`. Add `contentVisibility: "auto"` and `containIntrinsicSize`.

- [ ] **Step 5: Replace refetches with local updates**

Append the created photo, replace the edited photo by ID, and remove the deleted photo by ID. Keep the initial parallel fetch only. Use `useCallback` for handlers passed into cards and ensure only the active card receives editing state.

- [ ] **Step 6: Verify GREEN**

Run: `node --test tests/admin-photo-memory.test.mjs`

Expected: all photo memory tests pass.

### Task 5: Full regression and production verification

**Files:**
- Modify only files required by failures directly caused by this change.

- [ ] **Step 1: Run focused tests**

Run:

```bash
node --test tests/admin-auth.test.mjs
node --test tests/content-migration.test.mjs
node --test tests/admin-content-consistency.test.mjs
node --test tests/admin-photo-memory.test.mjs
```

Expected: all pass.

- [ ] **Step 2: Run the full suite**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass. Existing stale assertions affected by the database-backed message wall or decoration extraction must be updated only when the new behavior preserves their original invariant.

- [ ] **Step 3: Run static verification**

Run:

```bash
npx tsc --noEmit
npm run lint
git diff --check
```

Expected: zero errors. Existing non-blocking image warnings outside the changed scope may remain documented.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: successful Next.js production build with nested article routes generated at their legacy URLs.

- [ ] **Step 5: Review the final diff**

Confirm no unrelated user changes were reverted, secrets were not added, `.env.local` remains ignored, and only requested behavior changed.
