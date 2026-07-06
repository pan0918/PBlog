import { access, readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

test("Vditor editor exposes a complete writing configuration", async () => {
  const source = await readFile("app/admin/components/VditorEditor.tsx", "utf8");

  assert.match(source, /cacheId\??:\s*string/);
  assert.match(source, /uploadUrl\??:\s*string/);
  assert.match(source, /onSaveShortcut\??:/);
  assert.match(source, /clearCache:\s*\(\)\s*=>\s*void/);
  assert.match(source, /isUploading:\s*\(\)\s*=>\s*boolean/);
  assert.match(source, /insertMarkdown:\s*\(markdown:\s*string\)\s*=>\s*void/);

  for (const toolbar of [
    "link",
    "list",
    "ordered-list",
    "check",
    "outdent",
    "indent",
    "upload",
    "preview",
    "both",
    "fullscreen",
    "edit-mode",
    "code-theme",
    "content-theme",
  ]) {
    assert.match(source, new RegExp(`['"]${toolbar}['"]`), `${toolbar} should be in the toolbar`);
  }

  assert.match(source, /cache:\s*\{\s*enable:\s*Boolean\(cacheId\)/s);
  assert.match(source, /id:\s*cacheId/);
  assert.match(source, /url:\s*uploadUrl\s*\|\|\s*''/);
  assert.match(source, /accept:\s*['"]image\/\*['"]/);
  assert.match(source, /fieldName:\s*['"]file\[\]['"]/);
  assert.match(source, /max:\s*8\s*\*\s*1024\s*\*\s*1024/);
  assert.match(source, /format:\s*\(files:\s*File\[\],\s*responseText:\s*string\)/);
  assert.match(source, /editorRef\.current\?\.clearCache\(\)/);
  assert.match(source, /editorRef\.current\?\.isUploading\(\)/);
});

test("post editor workspace centralizes smooth writing behavior", async () => {
  await access("app/admin/components/PostEditorWorkspace.tsx");
  const source = await readFile("app/admin/components/PostEditorWorkspace.tsx", "utf8");

  assert.match(source, /export default function PostEditorWorkspace/);
  assert.match(source, /mode:\s*['"]create['"]\s*\|\s*['"]edit['"]/);
  assert.match(source, /\/api\/admin\/uploads/);
  assert.match(source, /cacheId=/);
  assert.match(source, /beforeunload/);
  assert.match(source, /isUploading\(\)/);
  assert.match(source, /图片还在上传/);
  assert.match(source, /clearCache\(\)/);
  assert.match(source, /onSaveShortcut=\{handleSubmit\}/);
  assert.match(source, /generateSlug/);
  assert.match(source, /wordCount/);
  assert.match(source, /imageCount/);
  assert.match(source, /linkCount/);
  assert.match(source, /selectedTagIds/);
});

test("new and edit post pages use the shared editor workspace", async () => {
  const [newPage, editPage] = await Promise.all([
    readFile("app/admin/posts/new/page.tsx", "utf8"),
    readFile("app/admin/posts/[id]/edit/page.tsx", "utf8"),
  ]);

  for (const source of [newPage, editPage]) {
    assert.match(source, /PostEditorWorkspace/);
    assert.doesNotMatch(source, /VditorEditor/);
    assert.doesNotMatch(source, /wordCount\s*=\s*form\.content/);
  }

  assert.match(newPage, /mode=['"]create['"]/);
  assert.match(editPage, /mode=['"]edit['"]/);
});

test("admin upload route implements Vditor image upload contract", async () => {
  await access("app/api/admin/uploads/route.ts");
  const source = await readFile("app/api/admin/uploads/route.ts", "utf8");

  assert.match(source, /requireAdmin/);
  assert.match(source, /request\.formData\(\)/);
  assert.match(source, /formData\.getAll\(['"]file\[\]['"]\)/);
  assert.match(source, /formData\.getAll\(['"]file['"]\)/);
  assert.match(source, /file\.type\.startsWith\(['"]image\/['"]\)/);
  assert.match(source, /MAX_UPLOAD_BYTES\s*=\s*8\s*\*\s*1024\s*\*\s*1024/);
  assert.match(source, /IMAGE_BED_BASE_URL/);
  assert.match(source, /a68b43cc\.cloudflare-imgbed-9pz\.pages\.dev/);
  assert.match(source, /IMAGE_BED_UPLOAD_CHANNEL/);
  assert.match(source, /huggingface/);
  assert.match(source, /process\.env\.IMAGE_BED_TOKEN/);
  assert.match(source, /searchParams\.set\(['"]uploadChannel['"]/);
  assert.match(source, /searchParams\.set\(['"]returnFormat['"],\s*['"]full['"]\)/);
  assert.match(source, /Authorization:\s*`Bearer \$\{token\}`/);
  assert.match(source, /fetch\(uploadUrl/);
  assert.match(source, /append\(['"]file['"],\s*file,\s*file\.name\)/);
  assert.doesNotMatch(source, /public\/uploads\/admin/);
  assert.doesNotMatch(source, /writeFile/);
  assert.match(source, /succMap/);
  assert.match(source, /errFiles/);
  assert.match(source, /code:\s*0/);
});
