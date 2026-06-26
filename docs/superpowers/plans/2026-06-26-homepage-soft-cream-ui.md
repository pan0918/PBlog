# Homepage Soft Cream UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the blog homepage and global background to match the provided soft cream reference.

**Architecture:** Keep the existing Next.js/Tailwind structure. Treat `HeroBanner` as the focused client island for the animated wave, and keep global color tokens in `app/globals.css`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, framer-motion, Node built-in test runner for lightweight source assertions.

---

### Task 1: Add Source-Level UI Guard

**Files:**
- Create: `tests/ui-theme.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homepage uses soft cream background and wave tokens", async () => {
  const [globals, hero] = await Promise.all([
    readFile("app/globals.css", "utf8"),
    readFile("components/HeroBanner.tsx", "utf8"),
  ]);

  assert.match(globals, /--bg-cream:\s*#f7efe7/i);
  assert.match(globals, /--surface-glass:\s*rgba\(255,\s*250,\s*244,\s*0\.68\)/i);
  assert.match(hero, /WAVE_COLORS/);
  assert.match(hero, /#f7efe7/i);
  assert.doesNotMatch(hero, /#d4a574/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui-theme.test.mjs`

Expected: fail before implementation because the new tokens are not present.

### Task 2: Rebuild Hero Wave and Global Background

**Files:**
- Modify: `components/HeroBanner.tsx`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Implement soft cream tokens and wave**

Use layered cream colors for the canvas wave, remove the hard brown fill, and give the page a continuous warm background.

- [ ] **Step 2: Run the UI guard**

Run: `node --test tests/ui-theme.test.mjs`

Expected: pass.

### Task 3: Lighten Homepage Surfaces

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/SearchBar.tsx`
- Modify: `components/ArticleCard.tsx`
- Modify: `components/ProfileCard.tsx`
- Modify: `components/NavigationCard.tsx`
- Modify: `components/Navbar.tsx`

- [ ] **Step 1: Align surfaces to the new palette**

Use `var(--surface-glass)`, warm borders, and tinted shadows. Keep amber as the only page accent.

- [ ] **Step 2: Run TypeScript**

Run: `npx tsc --noEmit`

Expected: exit 0.

### Task 4: Verify in Browser

**Files:**
- No source files unless visual issues are found.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

Expected: local Next.js server starts.

- [ ] **Step 2: Inspect desktop and mobile**

Use browser screenshots at desktop and mobile widths. Confirm:
- The bottom of the hero has a pale wave, not a brown slab.
- The content background is light cream.
- Text in nav, search, and cards is readable.
- Desktop nav remains one line.
