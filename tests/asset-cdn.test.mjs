import assert from "node:assert/strict";
import test from "node:test";

const { createAssetCdn } = await import("../lib/images/cdn.ts");

const ORIGINS = {
  imageOrigins: ["https://a68b43cc.imgbed.pages.dev", "https://imgbed.pages.dev"],
};
const BED_IMAGE = "https://a68b43cc.imgbed.pages.dev/file/1782476376234_%E5%8D%9A%E5%AE%A2.png";

test("an empty CDN config leaves every URL untouched", () => {
  const cdn = createAssetCdn({ ...ORIGINS, imageHost: "", imageTransformHost: "" });

  assert.equal(cdn.toCdnAssetUrl(BED_IMAGE), BED_IMAGE);
  assert.equal(cdn.canResizeImage(BED_IMAGE), false);
  assert.deepEqual(cdn.responsiveImage(BED_IMAGE, { sizes: "100vw", maxWidth: 1920 }), { src: BED_IMAGE });
  assert.deepEqual(cdn.getPreconnectOrigins(), []);
});

test("a custom domain replaces the image-bed origins for images and audio", () => {
  const cdn = createAssetCdn({ ...ORIGINS, imageHost: "https://img.example.com/", imageTransformHost: "" });

  assert.equal(cdn.toCdnAssetUrl(BED_IMAGE), "https://img.example.com/file/1782476376234_%E5%8D%9A%E5%AE%A2.png");
  assert.equal(cdn.toCdnAssetUrl("https://imgbed.pages.dev/file/a.png?x=1"), "https://img.example.com/file/a.png?x=1");
  assert.equal(cdn.toCdnAssetUrl("https://a68b43cc.imgbed.pages.dev/file/1_%E6%B8%A9.mp3"), "https://img.example.com/file/1_%E6%B8%A9.mp3");
  assert.equal(cdn.toCdnAssetUrl("https://other.example.org/a.png"), "https://other.example.org/a.png");
  assert.deepEqual(cdn.getPreconnectOrigins(), ["https://img.example.com"]);
  assert.deepEqual(cdn.fixedImage(BED_IMAGE, 40), { src: "https://img.example.com/file/1782476376234_%E5%8D%9A%E5%AE%A2.png" });
});

test("image transformations resize same-zone sources with an original-file fallback", () => {
  const cdn = createAssetCdn({ ...ORIGINS, imageHost: "https://img.example.com", imageTransformHost: "https://img.example.com" });

  assert.equal(
    cdn.resizeImageUrl(BED_IMAGE, 640),
    "https://img.example.com/cdn-cgi/image/width=640,quality=75,format=auto,fit=scale-down,onerror=redirect/file/1782476376234_%E5%8D%9A%E5%AE%A2.png",
  );
  const image = cdn.responsiveImage(BED_IMAGE, { sizes: "(min-width: 640px) 192px, 100vw", maxWidth: 960 });
  assert.equal(image.sizes, "(min-width: 640px) 192px, 100vw");
  assert.deepEqual(image.srcSet.split(", ").map((entry) => entry.split(" ")[1]), ["256w", "384w", "640w", "960w"]);
  assert.match(image.src, /width=960,/);
  const hero = cdn.responsiveImage(BED_IMAGE, { sizes: "100vw", minWidth: 640, maxWidth: 2560 });
  assert.deepEqual(hero.srcSet.split(", ").map((entry) => entry.split(" ")[1]), ["640w", "960w", "1280w", "1920w", "2560w"]);
  const tiny = cdn.responsiveImage(BED_IMAGE, { sizes: "100px", maxWidth: 100 });
  assert.deepEqual(tiny.srcSet.split(", ").map((entry) => entry.split(" ")[1]), ["128w"]);

  const avatar = cdn.fixedImage(BED_IMAGE, 40);
  assert.match(avatar.srcSet, /width=64,[^ ]+ 1x, [^ ]+width=128,[^ ]+ 2x$/);
  assert.deepEqual(cdn.getPreconnectOrigins(), ["https://img.example.com"]);
});

test("a separate transformation host fetches the image bed by absolute URL", () => {
  const cdn = createAssetCdn({ ...ORIGINS, imageHost: "", imageTransformHost: "https://cdn.example.com" });

  assert.equal(
    cdn.resizeImageUrl(BED_IMAGE, 256, 80),
    `https://cdn.example.com/cdn-cgi/image/width=256,quality=80,format=auto,fit=scale-down/${BED_IMAGE}`,
  );
});

test("NetEase and Unsplash images use their native resizing", () => {
  const cdn = createAssetCdn({ ...ORIGINS, imageHost: "", imageTransformHost: "" });

  assert.equal(
    cdn.resizeImageUrl("https://p3.music.126.net/abc==/1099.jpg", 128),
    "https://p3.music.126.net/abc==/1099.jpg?param=128y128",
  );
  assert.equal(
    cdn.resizeImageUrl("https://images.unsplash.com/photo-1?q=80&w=1000&auto=format&fit=crop", 384),
    "https://images.unsplash.com/photo-1?q=75&w=384&auto=format&fit=crop",
  );
  assert.equal(cdn.resizeImageUrl("/local.png", 128), "/local.png");
  assert.equal(cdn.resizeImageUrl("data:image/png;base64,AAAA", 128), "data:image/png;base64,AAAA");
});
