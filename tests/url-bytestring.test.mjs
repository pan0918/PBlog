import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("browser asset URLs are ASCII-safe for HTTP resource headers", async () => {
  const [{ siteConfig }, utils] = await Promise.all([
    import("../siteConfig.ts"),
    import("../lib/utils.ts"),
  ]);

  assert.equal(typeof utils.toBrowserSafeUrl, "function");
  assert.doesNotMatch(siteConfig.avatarUrl, /[^\x00-\x7f]/);
  assert.doesNotThrow(() => new Headers({
    Link: `<${siteConfig.avatarUrl}>; rel=preload; as=image`,
  }));

  const encoded = utils.toBrowserSafeUrl(
    "https://example.com/file/圣诞猫猫.jpg",
  );
  assert.equal(
    encoded,
    "https://example.com/file/%E5%9C%A3%E8%AF%9E%E7%8C%AB%E7%8C%AB.jpg",
  );
});

test("admin photo thumbnails normalize database URLs before rendering", async () => {
  const page = await readFile("app/admin/albums/[id]/photos/page.tsx", "utf8");

  assert.match(page, /toBrowserSafeUrl/);
  assert.match(
    page,
    /toBrowserSafeUrl\(photo\.thumbnail_url \|\| photo\.image_url\)/,
  );
});
