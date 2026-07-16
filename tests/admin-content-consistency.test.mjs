import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("post and tag writes use one explicit write transaction", async () => {
  const posts = await readFile("lib/posts.ts", "utf8");

  assert.match(posts, /createPostWithTags/);
  assert.match(posts, /updatePostWithTags/);
  assert.match(posts, /db\.transaction\(['"]write['"]\)/);
  assert.match(posts, /transaction\.commit\(\)/);
  assert.match(posts, /transaction\.close\(\)/);
  assert.match(posts, /transaction\.execute\(\{\s*sql:\s*`DELETE FROM post_tags/s);
  assert.match(posts, /transaction\.execute\(\{\s*sql:\s*`INSERT INTO post_tags/s);
});

test("post updates return the previous slug and revalidate old and new paths", async () => {
  const [posts, route, revalidate] = await Promise.all([
    readFile("lib/posts.ts", "utf8"),
    readFile("app/api/admin/posts/[id]/route.ts", "utf8"),
    readFile("lib/admin/revalidate.ts", "utf8"),
  ]);

  assert.match(posts, /previousSlug/);
  assert.match(route, /previousSlug/);
  assert.match(route, /revalidateAfterPost\(\[previousSlug,\s*post\?\.slug\]\)/);
  assert.match(revalidate, /revalidatePath\(['"]\/about['"]\)/);
  assert.match(revalidate, /new Set/);
});

test("category and tag mutations refresh every affected article", async () => {
  const [categoryRoute, tagRoute, posts] = await Promise.all([
    readFile("app/api/admin/categories/[id]/route.ts", "utf8"),
    readFile("app/api/admin/tags/[id]/route.ts", "utf8"),
    readFile("lib/posts.ts", "utf8"),
  ]);

  assert.match(posts, /getPostSlugsByCategoryId/);
  assert.match(posts, /getPostSlugsByTagId/);
  assert.match(categoryRoute, /getPostSlugsByCategoryId/);
  assert.match(categoryRoute, /revalidateAfterPost\(affectedSlugs\)/);
  assert.match(tagRoute, /getPostSlugsByTagId/);
  assert.match(tagRoute, /revalidateAfterPost\(affectedSlugs\)/);
});
