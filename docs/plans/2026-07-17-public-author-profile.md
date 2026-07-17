# Public Author Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every public administrator identity display as `Frud_` with the configured Christmas-cat avatar while preserving the `admin` backend login.

**Architecture:** Reuse the existing `siteConfig.authorName` and `siteConfig.avatarUrl` as the single public author profile. Authentication continues to use the administrator JWT username; only the public session response and comment DTO mapping replace that internal username with presentation data.

**Tech Stack:** Next.js 16 route handlers, TypeScript, Turso/libSQL comment repository, Node test runner.

## Global Constraints

- Backend administrator login remains unchanged and continues to use the existing `admin` account.
- Public author display name is exactly `Frud_`.
- Public author avatar is exactly `https://a68b43cc.cloudflare-imgbed-9pz.pages.dev/file/1782456681130_圣诞猫猫.jpg`.
- No database schema or stored comment records are modified.
- Ordinary reader accounts cannot acquire author identity.

---

### Task 1: Public Administrator Session Presentation

**Files:**
- Modify: `tests/public-account-entry.test.mjs`
- Modify: `app/api/auth/session/route.ts`
- Read: `siteConfig.ts`

**Interfaces:**
- Consumes: `siteConfig.authorName: string`, `siteConfig.avatarUrl: string`, and the existing `getAdminFromCookie()` result.
- Produces: the existing public session response shape with `{ username: siteConfig.authorName, avatarUrl: siteConfig.avatarUrl, isAuthor: true }` for administrators.

- [ ] **Step 1: Write the failing session presentation test**

Add a source contract test that reads `siteConfig.ts` and `app/api/auth/session/route.ts`, verifies the exact configured values, verifies the route imports `siteConfig`, and verifies the administrator response uses `siteConfig.authorName` and `siteConfig.avatarUrl` rather than `admin.username`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import tsx --test tests/public-account-entry.test.mjs`

Expected: FAIL because the administrator session still returns `admin.username` and `avatarUrl: null`.

- [ ] **Step 3: Implement the public administrator session**

Import `siteConfig` in `app/api/auth/session/route.ts` and change only the administrator response fields:

```ts
username: siteConfig.authorName,
avatarUrl: siteConfig.avatarUrl,
```

Keep the administrator ID, status, password-change flag and `isAuthor: true` unchanged.

- [ ] **Step 4: Run the focused test and TypeScript**

Run: `node --import tsx --test tests/public-account-entry.test.mjs && npx tsc --noEmit`

Expected: all focused tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit Task 1**

```bash
git add tests/public-account-entry.test.mjs app/api/auth/session/route.ts
git commit -m "feat: present configured author session"
```

### Task 2: Public Comment Author Presentation

**Files:**
- Modify: `tests/article-comments-api.test.mjs`
- Modify: `lib/db/comments.ts`
- Read: `siteConfig.ts`

**Interfaces:**
- Consumes: `siteConfig.authorName`, `siteConfig.avatarUrl`, and the existing `isAuthor = Boolean(row.admin_user_id)` decision.
- Produces: `PublicComment.author` with configured author presentation fields for administrator comments and unchanged database fields for reader comments.

- [ ] **Step 1: Write the failing author-comment mapping test**

Extend the repository contract test to require an import of `siteConfig` and conditional mappings equivalent to:

```ts
username: isAuthor ? siteConfig.authorName : String(row.user_username || '已注销用户'),
avatarUrl: isAuthor ? siteConfig.avatarUrl : row.avatar_url ? String(row.avatar_url) : null,
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import tsx --test tests/article-comments-api.test.mjs`

Expected: FAIL because administrator comments currently use `row.admin_username` and a null avatar.

- [ ] **Step 3: Implement conditional public author mapping**

Import `siteConfig` into `lib/db/comments.ts`. In `mapComment`, use configured author presentation values only when `isAuthor` is true. Preserve the existing public-user ID, username, avatar and `isAuthor: false` behavior for reader comments.

- [ ] **Step 4: Run focused regression tests**

Run: `node --import tsx --test tests/article-comments-api.test.mjs tests/public-account-entry.test.mjs tests/article-comments-ui.test.mjs`

Expected: all focused tests PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add tests/article-comments-api.test.mjs lib/db/comments.ts
git commit -m "feat: present configured comment author"
```

### Task 3: Full Verification

**Files:**
- Verify only; no planned production changes.

**Interfaces:**
- Consumes: the session and comment presentation behavior from Tasks 1 and 2.
- Produces: fresh evidence that the complete project remains buildable and regression-free.

- [ ] **Step 1: Run every automated test**

Run: `node --import tsx --test tests/*.test.mjs`

Expected: 0 failures.

- [ ] **Step 2: Run static checks**

Run: `npx tsc --noEmit && npm run lint && git diff --check`

Expected: TypeScript and diff checks exit 0; ESLint reports 0 errors, with only the repository's existing `<img>` warnings allowed.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: Next.js production build exits 0 and generates all routes.

- [ ] **Step 4: Confirm repository state**

Run: `git status --short --branch && git log --oneline -5`

Expected: no uncommitted implementation changes; the two implementation commits appear above the design and plan commits.
