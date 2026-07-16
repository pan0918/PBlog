# Native Article Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add native public accounts and a responsive first-party article comment system with replies, likes, editing, avatars, author participation, and administrator moderation.

**Architecture:** Public authentication is isolated from administrator authentication and stored in Turso. Focused repository and service modules own user, session, comment, rate-limit, and moderation behavior; route handlers remain thin. Article HTML stays server-rendered while a client comment surface loads session and paginated comments on demand.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Turso/libSQL, bcryptjs, jose JWT, Sharp, Tailwind CSS 4, Node test runner with tsx.

## Global Constraints

- Login uses unique username plus password; email is required, private, and used only for administrator-mediated recovery.
- Public-user sessions last seven days and use a cookie separate from `pblog_admin_token`.
- Comments are plain text, immediately visible, maximum 500 characters, and limited to top-level comments plus one reply level.
- Top-level comments and replies are oldest-first; top-level pages contain 20 comments.
- Users may edit but not delete their comments; administrators may hide, mark spam, or delete.
- Comment attachments, Markdown, HTML, notifications, CAPTCHA, anonymous comments, and automatic email recovery are out of scope.
- Desktop keeps all existing sidebar modules and adds a 360 px comment card; mobile uses a full-screen comment panel.
- Implementation stays on `feat/native-article-comments`; live migration and merge to `main` wait for user confirmation.

---

### Task 1: Database schema, validation, and domain helpers

**Files:**
- Modify: `lib/schema.sql`
- Modify: `scripts/init-db.ts`
- Create: `scripts/migrate-native-comments.ts`
- Create: `lib/public-auth/validation.ts`
- Create: `lib/comments/validation.ts`
- Create: `tests/public-user-domain.test.mjs`
- Create: `tests/comment-domain.test.mjs`

**Interfaces:**
- Produces `normalizeUsername(value)`, `normalizeEmail(value)`, `validateRegistration(input)`, and `sanitizeCommentContent(value)`.
- Produces Turso tables `public_users`, `public_auth_events`, `post_comments`, and `comment_likes` plus indexes.

- [ ] **Step 1: Write failing schema and domain tests**

```js
assert.equal(normalizeUsername("  Alice_1 "), "alice_1");
assert.equal(normalizeEmail(" USER@Example.COM "), "user@example.com");
assert.deepEqual(sanitizeCommentContent(" <b>hi</b>\nthere "), "hi there");
assert.match(schema, /CREATE TABLE IF NOT EXISTS public_users/);
assert.match(schema, /CREATE TABLE IF NOT EXISTS post_comments/);
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --import tsx --test tests/public-user-domain.test.mjs tests/comment-domain.test.mjs`
Expected: FAIL because the modules and tables do not exist.

- [ ] **Step 3: Implement schema and pure validation**

Create the four tables with UUID text keys, status/session fields, one-level parent relationship, author columns, unique likes, foreign keys, and query indexes. Implement strict username, email, password, and 500-character plain-text normalization with Chinese error messages.

- [ ] **Step 4: Add idempotent migration script**

The script loads `.env.local` through `@next/env`, executes `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, prints each result, and never alters or deletes existing rows.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node --import tsx --test tests/public-user-domain.test.mjs tests/comment-domain.test.mjs`
Expected: PASS.

Commit: `feat: add public account and comment schema`

### Task 2: Public authentication services and APIs

**Files:**
- Create: `lib/public-auth/auth.ts`
- Create: `lib/public-auth/rate-limit.ts`
- Create: `lib/db/public-users.ts`
- Create: `app/api/auth/register/route.ts`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/session/route.ts`
- Create: `app/api/auth/password/route.ts`
- Create: `app/api/auth/account/route.ts`
- Create: `tests/public-auth-flow.test.mjs`

**Interfaces:**
- Produces `signPublicUserToken`, `verifyPublicUserToken`, `getPublicUserSession`, `requirePublicUser`, and `invalidatePublicUserSessions`.
- Produces repository operations for registration, credential lookup, profile lookup, password update, and account deletion.

- [ ] **Step 1: Write failing authentication tests**

```js
const token = await signPublicUserToken({ sub: "u1", username: "alice", sessionVersion: 2 });
assert.deepEqual(await verifyPublicUserToken(token), { sub: "u1", username: "alice", sessionVersion: 2 });
assert.match(registerRoute, /hashPassword/);
assert.match(loginRoute, /用户名或密码错误/);
assert.match(cookieSource, /maxAge:\s*60 \* 60 \* 24 \* 7/);
```

Cover dummy-hash timing, unique conflicts, active/muted/banned/deleted checks, forced password change, seven-day cookie options, session-version invalidation, durable hashed rate keys, logout, and transactional account/comment deletion.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --import tsx --test tests/public-auth-flow.test.mjs`
Expected: FAIL because public authentication modules and routes do not exist.

- [ ] **Step 3: Implement repositories, JWT session validation, and durable rate limiting**

Use `pblog_user_token`, seven-day HttpOnly cookie options, the existing JWT secret with a distinct issuer/audience, and database user reloads for authenticated writes. Hash rate keys with SHA-256 and store only hashes and timestamps.

- [ ] **Step 4: Implement thin account route handlers**

Registration hashes passwords before insertion. Login uses a dummy hash for unknown users and returns one generic failure. Password change verifies the current password, clears `must_change_password`, increments session version, and issues a replacement token. Account deletion soft-deletes the user and all comments in one transaction.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node --import tsx --test tests/public-auth-flow.test.mjs tests/admin-auth.test.mjs`
Expected: PASS with administrator authentication unchanged.

Commit: `feat: add public user authentication`

### Task 3: Avatar processing and public profile API

**Files:**
- Create: `lib/public-auth/avatar.ts`
- Create: `app/api/auth/profile/route.ts`
- Create: `app/api/auth/avatar/route.ts`
- Create: `tests/public-avatar.test.mjs`

**Interfaces:**
- Produces `processAvatar(file): Promise<Blob>` yielding exactly 256×256 WebP.
- Profile PATCH updates username subject to uniqueness; avatar POST updates only after image-bed upload succeeds.

- [ ] **Step 1: Write failing avatar tests**

```js
const output = await processAvatar(new File([png], "avatar.png", { type: "image/png" }));
const metadata = await sharp(Buffer.from(await output.arrayBuffer())).metadata();
assert.deepEqual({ width: metadata.width, height: metadata.height, format: metadata.format }, { width: 256, height: 256, format: "webp" });
```

Cover type rejection, 2 MiB limit, pixel limit, crop behavior, upload failure preserving the old avatar, and upload rate limiting.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --import tsx --test tests/public-avatar.test.mjs`
Expected: FAIL because avatar processing does not exist.

- [ ] **Step 3: Implement avatar processing and routes**

Use Sharp auto-rotation, cover crop, 256 px output, WebP quality 80, and the shared `uploadImageToBed`. Profile responses never include email except for the authenticated user's own session/profile endpoint.

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --import tsx --test tests/public-avatar.test.mjs tests/photo-derivatives.test.mjs`
Expected: PASS.

Commit: `feat: add public user profiles and avatars`

### Task 4: Comment repositories, services, and public APIs

**Files:**
- Create: `lib/db/comments.ts`
- Create: `lib/comments/service.ts`
- Create: `app/api/posts/[postId]/comments/route.ts`
- Create: `app/api/comments/[id]/route.ts`
- Create: `app/api/comments/[id]/like/route.ts`
- Modify: `lib/posts.ts`
- Create: `tests/article-comments-api.test.mjs`

**Interfaces:**
- `PostMeta` gains stable `id`.
- Produces `listComments(postId, cursor, viewerId)`, `createComment`, `editComment`, and `toggleCommentLike`.
- Public comment JSON includes author kind/name/avatar, author badge, counts, viewer-like state, timestamps, edit state, and collapsed reply summaries.

- [ ] **Step 1: Write failing comment service/API tests**

```js
assert.equal(createReply({ parentId: replyId }).resolvedParentId, topLevelId);
assert.equal(result.comments[0].createdAt < result.comments[1].createdAt, true);
assert.equal(await toggleLike("c1", "u1"), true);
assert.equal(await toggleLike("c1", "u1"), false);
```

Cover stable post IDs, immediate visibility, one-level replies, oldest-first ordering, 20-item cursors, edit ownership, administrator authorship, no user delete, bans/mutes/forced-password-change write rejection, batched reply/like counts, and unique concurrent likes.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --import tsx --test tests/article-comments-api.test.mjs`
Expected: FAIL because comment modules and routes do not exist.

- [ ] **Step 3: Implement repository queries and transactional writes**

Use one query for the top-level page and bounded batched queries for replies, authors, counts, and viewer likes. Validate parent post ownership and normalize replies to the top-level parent. Toggle likes with unique-key-safe transactions.

- [ ] **Step 4: Implement routes with user-or-admin actor resolution**

GET is public. POST accepts active public users or existing administrators. PATCH accepts the owning public user or administrator. DELETE remains administrator-only under `/api/admin` and is not exposed publicly.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node --import tsx --test tests/article-comments-api.test.mjs tests/admin-auth.test.mjs`
Expected: PASS.

Commit: `feat: add article comment APIs`

### Task 5: Responsive comment interface and account dialogs

**Files:**
- Replace: `components/Comments.tsx`
- Create: `components/comments/CommentSurface.tsx`
- Create: `components/comments/CommentComposer.tsx`
- Create: `components/comments/CommentList.tsx`
- Create: `components/comments/CommentItem.tsx`
- Create: `components/comments/AuthDialog.tsx`
- Create: `components/comments/ProfileDialog.tsx`
- Create: `components/comments/useCommentData.ts`
- Modify: `app/posts/[[...slug]]/page.tsx`
- Modify: `app/globals.css`
- Modify: `siteConfig.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tests/article-comments-ui.test.mjs`

**Interfaces:**
- `Comments` receives `{ postId: string; postTitle: string }`.
- `CommentSurface` supports `variant: "sidebar" | "fullscreen"` over one shared data hook.
- Auth dialog supports login/register; profile dialog supports username, avatar, password, account deletion, and manual-recovery copy.

- [ ] **Step 1: Write failing UI source and pure-state tests**

```js
assert.doesNotMatch(postPage, /<div className="mt-12 md:mt-16"><Comments/);
assert.match(postPage, /max-w-\[1440px\]/);
assert.match(postPage, /lg:w-\[360px\]/);
assert.match(postPage, /<Comments postId=\{postData\.data\.id\}/);
assert.match(surface, /role="dialog"/);
assert.match(surface, /aria-modal="true"/);
assert.doesNotMatch(hook, /setInterval/);
```

Cover abort cleanup, optimistic like rollback, edit rollback, default expansion, reply expansion, oldest-first rendering, author badge, login prompt, mobile scroll lock/focus restoration/Escape handling, and light/dark class tokens.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --import tsx --test tests/article-comments-ui.test.mjs`
Expected: FAIL because native UI components do not exist.

- [ ] **Step 3: Implement shared state and focused components**

Load session and first comment page on mount with AbortControllers. Add optimistic like/edit behavior with snapshots and rollback. Use deterministic initials avatars when no image exists. Keep files focused by composer, item, list, auth, profile, and data responsibilities.

- [ ] **Step 4: Integrate desktop sidebar and mobile full-screen panel**

Remove article-bottom Gitalk, keep current sidebar modules, append the comment card, widen the page to 1440 px and sidebar to 360 px, add sticky internal scrolling, and add a collision-safe mobile fixed trigger. Implement focus trap basics, Escape close, safe-area padding, background scroll lock, and focus restoration.

- [ ] **Step 5: Remove Gitalk**

Delete Gitalk configuration types/values, remove the dependency with `npm uninstall gitalk`, and ensure no Gitalk imports or CSS remain.

- [ ] **Step 6: Verify GREEN and commit**

Run: `node --import tsx --test tests/article-comments-ui.test.mjs tests/runtime-performance-lifecycle.test.mjs`
Expected: PASS.

Commit: `feat: add responsive native comment interface`

### Task 6: Administrator comment and user management

**Files:**
- Create: `app/admin/comments/page.tsx`
- Create: `app/admin/users/page.tsx`
- Create: `app/api/admin/comments/route.ts`
- Create: `app/api/admin/comments/[id]/route.ts`
- Create: `app/api/admin/users/route.ts`
- Create: `app/api/admin/users/[id]/route.ts`
- Create: `app/api/admin/users/[id]/password/route.ts`
- Modify: `app/admin/layout.tsx`
- Create: `tests/admin-comment-users.test.mjs`

**Interfaces:**
- Comment admin GET supports query/status/page; PATCH supports visible/hidden/spam/deleted.
- User admin GET supports query/status/page; PATCH supports active/muted/banned and optional mute expiry.
- Password POST sets a supplied temporary password, increments session version, and sets forced-change.

- [ ] **Step 1: Write failing administrator tests**

```js
assert.match(layout, /评论管理/);
assert.match(layout, /用户管理/);
assert.match(userRoute, /requireAdmin/);
assert.match(passwordRoute, /must_change_password/);
assert.match(userRepository, /UPDATE post_comments SET status = 'deleted'/);
```

Cover search/filter/pagination, author/article display, comment state transitions, temporary mute, permanent ban plus comment removal, private email visibility only in admin API, generic password reset behavior, and existing admin navigation behavior.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --import tsx --test tests/admin-comment-users.test.mjs`
Expected: FAIL because pages and routes do not exist.

- [ ] **Step 3: Implement administrator APIs and pages**

Reuse `requireAdmin`, `success`, `error`, pagination styling, and toast patterns. Keep comment and user data queries server-side and return bounded pages rather than loading all records.

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --import tsx --test tests/admin-comment-users.test.mjs tests/admin-content-consistency.test.mjs`
Expected: PASS.

Commit: `feat: add comment and user moderation`

### Task 7: Full verification and branch handoff

**Files:**
- Modify only files already in scope if verification reveals defects.

**Interfaces:**
- No new interfaces.

- [ ] **Step 1: Run all tests**

Run: `node --import tsx --test tests/*.test.mjs`
Expected: all tests pass with zero failures.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: exit 0 with no errors; existing warnings may remain.

- [ ] **Step 3: Run the production build**

Run: `npm run build -- --webpack`
Expected: exit 0 and every route compiles.

- [ ] **Step 4: Review scope and migration safety**

Run: `git diff --check`, `git status --short`, and `git diff --stat main...HEAD`.
Expected: no whitespace errors; changes are limited to the approved design, implementation, tests, and migration.

- [ ] **Step 5: Push the feature branch only**

Run: `git push -u origin feat/native-article-comments`.
Expected: remote branch created. Do not run `scripts/migrate-native-comments.ts` and do not merge `main` until the user confirms.
