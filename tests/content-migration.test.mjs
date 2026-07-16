import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("migration preserves directory separators in post slugs", async () => {
  const source = await readFile("scripts/migrate-content.ts", "utf8");

  assert.ok(source.includes("const slug = relPath.replace(/\\.md$/, '');"));
  assert.ok(
    !source.includes(
      "const slug = relPath.replace(/\\.md$/, '').replace(/\\//g, '-');",
    ),
  );
});

test("migration checks natural keys before inserting repeatable content", async () => {
  const source = await readFile("scripts/migrate-content.ts", "utf8");

  assert.match(
    source,
    /SELECT id FROM moments WHERE published_at = \? AND content = \?/,
  );
  assert.match(
    source,
    /SELECT id FROM messages WHERE created_at = \? AND author = \? AND content = \?/,
  );
  assert.match(
    source,
    /SELECT id FROM photos WHERE album_id = \? AND image_url = \?/,
  );
});

test("view counting accepts nested slugs and encodes every path segment", async () => {
  await access("app/api/posts/view/[...slug]/route.ts");
  const [route, counter] = await Promise.all([
    readFile("app/api/posts/view/[...slug]/route.ts", "utf8"),
    readFile("components/ClientViewCount.tsx", "utf8"),
  ]);

  assert.match(route, /slug:\s*string\[\]/);
  assert.match(route, /slugParts\.join\(['"]\/['"]\)/);
  assert.match(counter, /slug\.split\(['"]\/['"]\)/);
  assert.match(counter, /encodeURIComponent/);
  assert.match(counter, /\/api\/posts\/view\//);
});

test("legacy nested article URLs resolve before the migration is rerun", async () => {
  const repository = await readFile("lib/posts.ts", "utf8");
  const legacyFallbacks = repository.match(/const legacySlug = slug\.replace\(\/\\\/\/g, '-'\);/g) ?? [];

  assert.equal(legacyFallbacks.length, 2);
  assert.match(repository, /args:\s*\[legacySlug\]/);
});
