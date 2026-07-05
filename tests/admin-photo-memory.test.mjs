import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin photo cards use responsive optimized images", async () => {
  const page = await readFile("app/admin/albums/[id]/photos/page.tsx", "utf8");

  assert.match(page, /from ['"]next\/image['"]/);
  assert.match(page, /photo\.thumbnail_url\s*\|\|\s*photo\.image_url/);
  assert.match(page, /sizes=/);
  assert.match(page, /loading=\{index < 4 \? ['"]eager['"] : ['"]lazy['"]\}/);
  assert.match(page, /decoding=['"]async['"]/);
  assert.match(page, /contentVisibility:\s*['"]auto['"]/);
  assert.doesNotMatch(page, /<img\b/);
});

test("photo writes update local state without refetching the album", async () => {
  const page = await readFile("app/admin/albums/[id]/photos/page.tsx", "utf8");

  assert.match(page, /setPhotos\(current\s*=>\s*\[\.\.\.current,\s*data\.data\]\)/);
  assert.match(page, /setPhotos\(current\s*=>\s*current\.map/);
  assert.match(page, /setPhotos\(current\s*=>\s*current\.filter/);
  assert.match(page, /setEditingId\(current\s*=>\s*current === photoId/);
  assert.match(page, /\}, \[showToast\]\);/);
  assert.doesNotMatch(page, /setEditingId\(null\);\s*fetchData\(\)/s);
});

test("photo update API returns the updated record", async () => {
  const [route, repository] = await Promise.all([
    readFile("app/api/admin/photos/[id]/route.ts", "utf8"),
    readFile("lib/db/photos.ts", "utf8"),
  ]);

  assert.match(repository, /Promise<PhotoRecord \| null>/);
  assert.match(repository, /return getPhotoById\(id\)/);
  assert.match(route, /const photo = await updatePhoto/);
  assert.match(route, /return success\(photo\)/);
});
