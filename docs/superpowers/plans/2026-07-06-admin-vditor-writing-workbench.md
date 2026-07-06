# Admin Vditor Writing Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the admin post editor into a reusable, safer, smoother Vditor writing workbench.

**Architecture:** Keep all Vditor-specific configuration in `VditorEditor`, move duplicated post form behavior into `PostEditorWorkspace`, and expose image upload through a Vditor-compatible admin API route. New and edit route pages become thin wrappers.

**Tech Stack:** Next.js App Router, React 19, Vditor 3.11.2, Node test runner, TypeScript, filesystem-backed public uploads.

---

## File structure

- Modify `app/admin/components/VditorEditor.tsx`: richer toolbar, cache id, upload config, imperative methods, faster state sync.
- Create `app/admin/components/PostEditorWorkspace.tsx`: shared post writing UI and behavior.
- Modify `app/admin/posts/new/page.tsx`: use shared workspace for create mode.
- Modify `app/admin/posts/[id]/edit/page.tsx`: use shared workspace for edit mode after fetching post/category/tag data.
- Create `app/api/admin/uploads/route.ts`: admin-only Vditor image upload endpoint.
- Add `tests/admin-vditor-workbench.test.mjs`: source-level regression tests for the workbench and upload API contract.

## Task 1: Add failing workbench tests

- [ ] Add `tests/admin-vditor-workbench.test.mjs` with assertions that fail on current code:
  - `VditorEditor` has `cacheId`, `uploadUrl`, full toolbar entries, `clearCache`, and `isUploading`.
  - `PostEditorWorkspace.tsx` exists and owns stats, beforeunload protection, upload-in-progress blocking, Ctrl/Cmd+Enter submit, and cache clearing after save.
  - New/edit pages import and render `PostEditorWorkspace`.
  - Upload route returns Vditor `succMap` shape, uses `requireAdmin`, validates `image/`, limits size, and writes to `public/uploads/admin`.

- [ ] Run:

```bash
node --test tests/admin-vditor-workbench.test.mjs
```

Expected: fail because the workspace and upload route do not exist and `VditorEditor` lacks the required options.

## Task 2: Upgrade Vditor wrapper

- [ ] Modify `app/admin/components/VditorEditor.tsx`:
  - add props `cacheId`, `uploadUrl`, `onReady`, `onSaveShortcut`;
  - enable `cache: { enable: true, id: cacheId }`;
  - configure toolbar entries: `link`, `list`, `ordered-list`, `check`, `outdent`, `indent`, `upload`, `preview`, `both`, `fullscreen`, `edit-mode`, `code-theme`, `content-theme`;
  - configure upload `url`, `accept: image/*`, `fieldName: file[]`, `max: 8 * 1024 * 1024`, and a Vditor-compatible `format`;
  - expose `clearCache`, `isUploading`, `insertMarkdown`, and `focus`;
  - reduce parent update lag to a short debounce.

- [ ] Run:

```bash
node --test tests/admin-vditor-workbench.test.mjs
```

Expected: Vditor wrapper assertions pass; workspace/upload route assertions still fail.

## Task 3: Add upload route

- [ ] Create `app/api/admin/uploads/route.ts`:
  - require admin auth;
  - parse `multipart/form-data`;
  - accept `file[]` and `file`;
  - reject non-images and files over 8 MB;
  - write sanitized filenames under `public/uploads/admin/YYYY/MM/`;
  - return `{ code: 0, msg: '', data: { errFiles: [], succMap: { [originalName]: publicUrl } } }`.

- [ ] Run:

```bash
node --test tests/admin-vditor-workbench.test.mjs
```

Expected: upload route assertions pass; workspace/page assertions still fail.

## Task 4: Create shared post editor workspace

- [ ] Create `app/admin/components/PostEditorWorkspace.tsx`:
  - accept mode, initial form, categories, tags, selected tag ids, submit URL, submit method, success text, submit button text, and optional auto slug behavior;
  - compute statistics from the current Markdown content;
  - manage tag creation and selection;
  - use `VditorEditor` with `cacheId` and `/api/admin/uploads`;
  - protect unsaved changes with `beforeunload`;
  - block submit while Vditor is uploading;
  - read final content from the editor before submit;
  - clear Vditor cache after a successful save;
  - support Ctrl/Cmd+Enter save through `onSaveShortcut`.

- [ ] Run:

```bash
node --test tests/admin-vditor-workbench.test.mjs
```

Expected: workspace assertions pass; page-wrapper assertions still fail.

## Task 5: Replace duplicated new/edit pages

- [ ] Modify `app/admin/posts/new/page.tsx` to fetch categories/tags and render `PostEditorWorkspace` in create mode.
- [ ] Modify `app/admin/posts/[id]/edit/page.tsx` to fetch post/categories/tags and render `PostEditorWorkspace` in edit mode.

- [ ] Run:

```bash
node --test tests/admin-vditor-workbench.test.mjs
```

Expected: all workbench tests pass.

## Task 6: Full verification

- [ ] Run:

```bash
node --test tests/*.test.mjs
npx tsc --noEmit --incremental false
npm run lint
```

Expected: tests pass, TypeScript passes, lint has no errors.
