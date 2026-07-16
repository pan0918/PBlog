import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

import {
  generatePhotoDerivatives,
  readResponseBytes,
} from "../lib/images/photo-derivatives.ts";

function svg(width, height) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#789"/></svg>`,
  );
}

test("rejects non-http photo sources", async () => {
  await assert.rejects(
    generatePhotoDerivatives("file:///tmp/photo.jpg"),
    /仅支持 HTTP 或 HTTPS 图片地址/,
  );
});

test("rejects a response whose declared size exceeds the byte limit", async () => {
  const response = new Response("small", {
    headers: { "content-length": String(8 * 1024 * 1024 + 1) },
  });

  await assert.rejects(readResponseBytes(response, 8 * 1024 * 1024), /超过 8 MB/);
});

test("creates bounded WebP thumbnail and preview without fetching twice", async () => {
  let fetchCount = 0;
  const uploads = [];
  const result = await generatePhotoDerivatives("https://example.com/large.svg", {
    fetchImpl: async () => {
      fetchCount += 1;
      return new Response(svg(2400, 1200), {
        status: 200,
        headers: { "content-type": "image/svg+xml" },
      });
    },
    upload: async (file, filename) => {
      uploads.push({ filename, buffer: Buffer.from(await file.arrayBuffer()) });
      return `https://images.example/${filename}`;
    },
    createId: () => "photo-id",
  });

  assert.equal(fetchCount, 1);
  assert.equal(result.width, 2400);
  assert.equal(result.height, 1200);
  assert.equal(uploads.length, 2);
  assert.deepEqual(uploads.map(({ filename }) => filename), [
    "photo-id-thumb.webp",
    "photo-id-preview.webp",
  ]);

  const [thumbnail, preview] = await Promise.all(
    uploads.map(({ buffer }) => sharp(buffer).metadata()),
  );
  assert.equal(thumbnail.format, "webp");
  assert.equal(thumbnail.width, 640);
  assert.equal(thumbnail.height, 320);
  assert.equal(preview.format, "webp");
  assert.equal(preview.width, 1600);
  assert.equal(preview.height, 800);
  assert.match(result.thumbnailUrl, /photo-id-thumb\.webp$/);
  assert.match(result.previewUrl, /photo-id-preview\.webp$/);
});

test("does not enlarge a source smaller than either derivative target", async () => {
  const uploads = [];
  await generatePhotoDerivatives("https://example.com/small.svg", {
    fetchImpl: async () => new Response(svg(320, 200), { status: 200 }),
    upload: async (file) => {
      uploads.push(Buffer.from(await file.arrayBuffer()));
      return `https://images.example/${uploads.length}.webp`;
    },
    createId: () => "small",
  });

  const metadata = await Promise.all(uploads.map((buffer) => sharp(buffer).metadata()));
  assert.deepEqual(metadata.map(({ width, height }) => ({ width, height })), [
    { width: 320, height: 200 },
    { width: 320, height: 200 },
  ]);
});

test("does not upload a preview when the thumbnail upload fails", async () => {
  let uploadCount = 0;
  await assert.rejects(
    generatePhotoDerivatives("https://example.com/photo.svg", {
      fetchImpl: async () => new Response(svg(800, 600), { status: 200 }),
      upload: async () => {
        uploadCount += 1;
        throw new Error("图床不可用");
      },
    }),
    /图床不可用/,
  );
  assert.equal(uploadCount, 1);
});
