import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("published posts load tags in one cached database roundtrip", async () => {
  const posts = await readFile("lib/posts.ts", "utf8");

  assert.match(posts, /json_group_array\(t\.name\)/i);
  assert.match(posts, /unstable_cache/);
  assert.match(posts, /tags:\s*\[['"]posts['"]\]/);
  assert.doesNotMatch(posts, /for\s*\(const row of result\.rows\)[\s\S]{0,700}await db\.execute/);
});

test("homepage loads cached posts and counts concurrently", async () => {
  const [page, homeData] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("lib/home-data.ts", "utf8"),
  ]);

  assert.match(page, /Promise\.all\(\[\s*getAllPosts\(\),?\s*getHomepageCounts\(\),?\s*\]\)/);
  assert.doesNotMatch(page, /async function getCounts/);
  assert.equal((homeData.match(/db\.execute/g) || []).length, 1);
  assert.match(homeData, /moment_count/);
  assert.match(homeData, /photo_count/);
  assert.match(homeData, /MAX\(updated_at\)/i);
  assert.match(homeData, /last_post_updated_at/);
  assert.match(homeData, /unstable_cache/);
  assert.match(homeData, /tags:\s*\[['"]homepage-stats['"]\]/);
  assert.match(page, /lastPostUpdatedAt/);
  assert.match(page, /<SiteStats lastUpdatedAt=\{lastPostUpdatedAt \|\| siteConfig\.buildDate\}/);
  assert.doesNotMatch(page, /allPosts\[0\]\?\.date/);
});

test("admin writes invalidate cached homepage data", async () => {
  const revalidation = await readFile("lib/admin/revalidate.ts", "utf8");

  assert.match(revalidation, /revalidateTag\(['"]posts['"],\s*['"]max['"]\)/);
  assert.match(revalidation, /revalidateTag\(['"]homepage-stats['"],\s*['"]max['"]\)/);
  assert.match(revalidation, /revalidateAfterPost[\s\S]*?revalidateTag\(['"]homepage-stats['"],\s*['"]max['"]\)/);
});

test("homepage avoids a global loading shell and keeps a shorter entrance", async () => {
  await assert.rejects(readFile("app/loading.tsx", "utf8"), { code: "ENOENT" });

  const [transition, page] = await Promise.all([
    readFile("components/PageTransition.tsx", "utf8"),
    readFile("app/page.tsx", "utf8"),
  ]);

  assert.match(transition, /duration\s*=\s*0\.5/);
  assert.match(transition, /transition=\{\{ duration,/);
  assert.match(page, /<PageTransition duration=\{0\.28\}>/);
});
