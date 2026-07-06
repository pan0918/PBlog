# Admin Vditor Writing Workbench Design

## Goal

Make the admin post writing flow feel like a complete writing workbench rather than a minimal Markdown textarea. The work should improve day-to-day writing speed, reduce draft-loss risk, and make image insertion practical while keeping the editor responsive.

## Current gaps

- `app/admin/components/VditorEditor.tsx` only enables a narrow toolbar and disables Vditor cache.
- New and edit post pages duplicate the same form, tag, statistic, toast, and submit logic.
- Editor state is debounced by three seconds, so the sidebar statistics lag behind actual content.
- Vditor upload is not configured, so images must be inserted as manually typed URLs.
- There is no unsaved-change protection and no cache cleanup after a successful save.

## Design

### Editor wrapper

`VditorEditor` remains the only place that knows Vditor-specific options. It will expose a small imperative handle: read content, insert Markdown, clear cache, check upload state, and focus. It will enable Vditor cache with a caller-provided `cacheId`, configure a fuller toolbar, support upload options, and call `onChange` quickly enough for live statistics without causing heavy parent renders.

The default mode stays `ir` because it is a good balance for Markdown-heavy writing: rendered blocks are visible without the higher editing overhead of pure WYSIWYG. The toolbar will expose `edit-mode`, `preview`, `both`, and `fullscreen` so the author can switch modes when needed.

### Shared post editor workspace

Create `app/admin/components/PostEditorWorkspace.tsx` to own the common post form workflow. `/admin/posts/new` and `/admin/posts/[id]/edit` become small route components that only fetch initial data or pass submit settings.

The workspace will manage:

- title, slug, summary, cover URL, status, pinning, category, tags, and Markdown content;
- tag creation and selection;
- live writing statistics;
- submit behavior for create/update;
- dirty state and `beforeunload` protection;
- clear editor cache after successful save.

### Image upload

Add `app/api/admin/uploads/route.ts` for Vditor-compatible image upload responses. The route requires admin auth, accepts `multipart/form-data`, validates image type and size, and writes files under `public/uploads/admin/YYYY/MM/`. It returns Vditor's expected `code/msg/data.succMap` shape so drag, paste, and toolbar upload insert Markdown automatically.

This local upload path is intentionally simple and deployment-friendly for local/self-hosted use. If production storage later moves to Cloudflare/R2/image-bed API, only this route needs to change; the Vditor wrapper can keep the same upload contract.

### UX details

- `Ctrl/Cmd + Enter` submits from the editor.
- Saving is blocked while uploads are in progress.
- Leaving with unsaved changes prompts the browser.
- New-post slug auto-generation remains, but manual slug edits are preserved.
- Successful save clears the Vditor cache for that post/new-post key.

## Testing

Add focused source-level tests for this codebase's existing Node test style:

- Vditor editor enables cache with a caller-provided id, full writing toolbar, upload URL, image accept list, and cache-clearing handle.
- Post editor workspace centralizes create/edit behavior, computes live statistics, has unsaved-change protection, blocks submit during upload, and clears cache after save.
- New and edit route pages use the shared workspace instead of duplicating editor logic.
- Upload API requires admin auth, validates images, writes to `public/uploads/admin`, and returns Vditor's `succMap`.

Run:

```bash
node --test tests/admin-vditor-workbench.test.mjs
node --test tests/*.test.mjs
npx tsc --noEmit --incremental false
npm run lint
```
