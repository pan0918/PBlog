import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { shouldBypassImageOptimizer } from "../app/photowall/imageDelivery.ts";
import { fitImageWithinViewport } from "../app/photowall/imageSizing.ts";

test("bypasses the Next image proxy only for the slow photo-bed hosts", () => {
  assert.equal(
    shouldBypassImageOptimizer("https://cloudflare-imgbed-9pz.pages.dev/file/photo.jpeg"),
    true,
  );
  assert.equal(
    shouldBypassImageOptimizer("https://a68b43cc.cloudflare-imgbed-9pz.pages.dev/file/photo.jpeg"),
    true,
  );
  assert.equal(
    shouldBypassImageOptimizer("https://future.cloudflare-imgbed-9pz.pages.dev/file/photo.jpeg"),
    true,
  );
  assert.equal(shouldBypassImageOptimizer("https://images.unsplash.com/photo-1"), false);
  assert.equal(shouldBypassImageOptimizer("/images/local-photo.jpeg"), false);
});

test("fits landscape and portrait photos inside the viewer without distortion", () => {
  const landscape = fitImageWithinViewport(5408, 3680, 1280, 720);
  assert.equal(landscape.height, 561.6);
  assert.ok(landscape.width <= 1088);
  assert.ok(Math.abs(landscape.width / landscape.height - 5408 / 3680) < 1e-10);

  const portrait = fitImageWithinViewport(3024, 4096, 1280, 720);
  assert.equal(portrait.height, 561.6);
  assert.ok(portrait.width <= 1088);
  assert.ok(Math.abs(portrait.width / portrait.height - 3024 / 4096) < 1e-10);

  assert.deepEqual(
    fitImageWithinViewport(640, 480, 1280, 720),
    { width: 640, height: 480 },
  );
});

test("photo wall routes remote photos through responsive Next images", async () => {
  const [config, wall, viewer] = await Promise.all([
    readFile("next.config.ts", "utf8"),
    readFile("app/photowall/PhotoWallClient.tsx", "utf8"),
    readFile("app/photowall/BookViewer.tsx", "utf8"),
  ]);

  assert.doesNotMatch(config, /unoptimized:\s*true/);
  assert.match(config, /remotePatterns/);
  assert.match(config, /cloudflare-imgbed-9pz\.pages\.dev/);
  assert.match(config, /a68b43cc\.cloudflare-imgbed-9pz\.pages\.dev/);
  assert.match(config, /qualities:\s*\[\s*75,\s*80,\s*90\s*\]/);
  assert.match(config, /deviceSizes:\s*\[[^\]]*2048\s*\]/s);
  assert.doesNotMatch(config, /deviceSizes:\s*\[[^\]]*3840/s);

  assert.match(wall, /from\s+["']next\/image["']/);
  assert.match(wall, /sizes=["']\(max-width:\s*640px\)\s*85vw/);
  assert.match(wall, /loading=\{albumIndex === 0 \? "eager" : "lazy"\}/);
  assert.match(wall, /unoptimized=\{shouldBypassImageOptimizer\(/);
  assert.doesNotMatch(wall, /<img\b/);
  assert.doesNotMatch(wall, /absolute inset-0[^"]*\brelative\b/);

  assert.match(viewer, /from\s+["']next\/image["']/);
  assert.match(viewer, /sizes=["']85vw["']/);
  assert.match(viewer, /loading=["']eager["']/);
  assert.match(viewer, /unoptimized=\{shouldBypassImageOptimizer\(/);
  assert.match(viewer, /fitImageWithinViewport/);
  assert.doesNotMatch(viewer, /new Image\(\)/);
  assert.doesNotMatch(viewer, /function useImageSize/);
  assert.doesNotMatch(viewer, /<img\b/);
});
