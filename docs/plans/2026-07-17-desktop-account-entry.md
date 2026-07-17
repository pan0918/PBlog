# Desktop Account Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a desktop navbar account avatar that opens the existing authentication/profile dialogs, use one supplied default avatar throughout public-account surfaces, and migrate the configured Turso database for native comments.

**Architecture:** A focused client component owns account session state and dialog orchestration, while `Navbar` only positions it. A shared presentation constant supplies the default avatar to every fallback. The existing idempotent migration remains the only database mutation path and is followed by read-only schema verification.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, libSQL/Turso, Node test runner.

## Global Constraints

- Desktop navigation only; do not modify the mobile navigation.
- Do not add a separate account page.
- Default avatar URL: `https://a68b43cc.cloudflare-imgbed-9pz.pages.dev/file/1784254976002_ChatGPT_Image_2026年7月17日_10_22_03.png`.
- Preserve JPEG, PNG, and WebP upload support and the 2 MiB limit.
- Run only the idempotent native-comment migration; do not drop or truncate data.

---

### Task 1: Shared Default Avatar

**Files:**
- Create: `lib/public-auth/presentation.ts`
- Modify: `components/comments/CommentItem.tsx`
- Modify: `components/comments/CommentSurface.tsx`
- Modify: `components/comments/ProfileDialog.tsx`
- Modify: `app/admin/users/page.tsx`
- Test: `tests/public-account-entry.test.mjs`

**Interfaces:**
- Produces: `DEFAULT_PUBLIC_AVATAR_URL: string`.
- Consumes: existing nullable `avatarUrl` and `avatar_url` fields.

- [ ] **Step 1: Write the failing default-avatar test**

Create a Node source-contract test that imports `DEFAULT_PUBLIC_AVATAR_URL`, asserts the exact supplied URL, and asserts each fallback surface imports and renders it.

```js
test("public account surfaces share the supplied default avatar", async () => {
  assert.equal(DEFAULT_PUBLIC_AVATAR_URL, expectedAvatar);
  for (const path of fallbackFiles) {
    const source = await readFile(path, "utf8");
    assert.match(source, /DEFAULT_PUBLIC_AVATAR_URL/);
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --import tsx --test tests/public-account-entry.test.mjs`

Expected: FAIL because `lib/public-auth/presentation.ts` does not exist.

- [ ] **Step 3: Add the shared constant and replace initials fallbacks**

```ts
export const DEFAULT_PUBLIC_AVATAR_URL = 'https://a68b43cc.cloudflare-imgbed-9pz.pages.dev/file/1784254976002_ChatGPT_Image_2026年7月17日_10_22_03.png';
```

Every public-user fallback renders `avatarUrl || DEFAULT_PUBLIC_AVATAR_URL` as a circular or rounded image. Administrator-authored comments may use the same default image.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --import tsx --test tests/public-account-entry.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/public-auth/presentation.ts components/comments app/admin/users/page.tsx tests/public-account-entry.test.mjs
git commit -m "feat: add shared public avatar fallback"
```

### Task 2: Desktop Navbar Account Control

**Files:**
- Create: `components/account/DesktopAccountControl.tsx`
- Modify: `components/Navbar.tsx`
- Test: `tests/public-account-entry.test.mjs`

**Interfaces:**
- Consumes: `CommentSession`, `AuthDialog`, `ProfileDialog`, `DEFAULT_PUBLIC_AVATAR_URL`, and `GET /api/auth/session`.
- Produces: `DesktopAccountControl` with no props.

- [ ] **Step 1: Write failing desktop interaction tests**

Assert the component:

```js
assert.match(control, /fetch\('\/api\/auth\/session'/);
assert.match(control, /<AuthDialog/);
assert.match(control, /<ProfileDialog/);
assert.match(control, /session \? '打开个人资料' : '登录或注册'/);
assert.match(navbar, /<DesktopAccountControl \/>/);
assert.match(navbar, /<DesktopAccountControl \/>[\s\S]*toggleTheme/);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --import tsx --test tests/public-account-entry.test.mjs`

Expected: FAIL because the control and navbar integration are absent.

- [ ] **Step 3: Implement session-aware dialog orchestration**

The component loads the session once with an abort controller:

```ts
useEffect(() => {
  const controller = new AbortController();
  void fetch('/api/auth/session', { cache: 'no-store', signal: controller.signal })
    .then(readSession)
    .then(setSession)
    .catch((error) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setSession(null);
    });
  return () => controller.abort();
}, []);
```

The 36 px image button opens `AuthDialog` without a session and `ProfileDialog` for a non-author public session. Dialog callbacks update local state immediately. An administrator session remains visible but does not open public-profile editing.

- [ ] **Step 4: Place the control before the theme button**

Import the component into `Navbar.tsx` and render it only in the existing desktop header, immediately before the theme control. Do not change the `md:hidden` mobile block.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `node --import tsx --test tests/public-account-entry.test.mjs tests/article-comments-ui.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/account/DesktopAccountControl.tsx components/Navbar.tsx tests/public-account-entry.test.mjs
git commit -m "feat: add desktop account entry"
```

### Task 3: Database Migration and Verification

**Files:**
- Modify: `package.json`
- Modify: `scripts/migrate-native-comments.ts`
- Test: `tests/comment-domain.test.mjs`

**Interfaces:**
- Produces: `npm run migrate:comments` invoking `tsx scripts/migrate-native-comments.ts`.
- Verifies: tables `public_users`, `public_auth_events`, `post_comments`, `comment_likes` and their supporting indexes.

- [ ] **Step 1: Write the failing migration-command test**

```js
assert.equal(pkg.scripts["migrate:comments"], "tsx scripts/migrate-native-comments.ts");
assert.match(migration, /SELECT name FROM sqlite_master/);
assert.match(migration, /post_comments/);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --import tsx --test tests/comment-domain.test.mjs`

Expected: FAIL because the npm command and schema verification query are absent.

- [ ] **Step 3: Add the migration command and read-only post-check**

After applying statements, query `sqlite_master` and throw if any required table is absent. Always close the client in `finally`.

```ts
const requiredTables = ['public_users', 'public_auth_events', 'post_comments', 'comment_likes'];
const schema = await client.execute({
  sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${requiredTables.map(() => '?').join(',')})`,
  args: requiredTables,
});
```

- [ ] **Step 4: Verify the migration test passes**

Run: `node --import tsx --test tests/comment-domain.test.mjs`

Expected: PASS.

- [ ] **Step 5: Execute the authorized remote migration**

Run: `npm run migrate:comments`

Expected: each table/index reports success and the final schema verification reports all four tables.

- [ ] **Step 6: Re-run the migration to prove idempotency**

Run: `npm run migrate:comments`

Expected: the same success result with no duplicate-object or data-loss error.

- [ ] **Step 7: Commit**

```bash
git add package.json scripts/migrate-native-comments.ts tests/comment-domain.test.mjs
git commit -m "chore: verify native comment migration"
```

### Task 4: Full Verification and Publication

**Files:**
- No production file changes expected.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified and pushed feature branch.

- [ ] **Step 1: Run the complete test suite**

Run: `node --import tsx --test tests/*.test.mjs`

Expected: all tests pass.

- [ ] **Step 2: Run static verification**

Run: `npx tsc --noEmit && npm run lint && git diff --check`

Expected: TypeScript and diff check pass; ESLint has zero errors, with only existing image-element warnings allowed.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: optimized production build and all routes complete successfully.

- [ ] **Step 4: Confirm a clean working tree and push**

```bash
git status --short --branch
git push origin feat/native-article-comments
```

Expected: clean branch and remote updated to the local HEAD.
