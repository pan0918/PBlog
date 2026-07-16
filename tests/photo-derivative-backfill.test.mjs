import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { backfillPhotoDerivatives } from "../lib/images/backfill-photo-derivatives.ts";

const complete = {
  id: "complete",
  image_url: "https://images.example/complete.jpg",
  thumbnail_url: "https://images.example/complete-thumb.webp",
  preview_url: "https://images.example/complete-preview.webp",
};

test("backfill skips completed rows and never exceeds two concurrent jobs", async () => {
  const rows = [
    complete,
    ...Array.from({ length: 5 }, (_, index) => ({
      id: `photo-${index}`,
      image_url: `https://images.example/${index}.jpg`,
      thumbnail_url: index === 0 ? "https://images.example/old-thumb.webp" : null,
      preview_url: null,
    })),
  ];
  let active = 0;
  let peak = 0;
  const updated = [];

  const result = await backfillPhotoDerivatives(
    rows,
    async (row) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return {
        thumbnailUrl: `${row.image_url}?thumb`,
        previewUrl: `${row.image_url}?preview`,
        width: 3000,
        height: 2000,
      };
    },
    async (id, derivatives) => { updated.push({ id, derivatives }); },
  );

  assert.equal(peak, 2);
  assert.equal(result.succeeded, 5);
  assert.equal(result.skipped, 1);
  assert.deepEqual(result.failed, []);
  assert.equal(updated.length, 5);
  assert.deepEqual(updated[0].derivatives, {
    thumbnailUrl: `${rows[1].image_url}?thumb`,
    previewUrl: `${rows[1].image_url}?preview`,
    width: 3000,
    height: 2000,
  });
});

test("backfill records an item failure and continues later rows", async () => {
  const rows = [
    { id: "bad", image_url: "https://images.example/bad.jpg", thumbnail_url: null, preview_url: null },
    { id: "good", image_url: "https://images.example/good.jpg", thumbnail_url: null, preview_url: null },
  ];
  const updated = [];
  const result = await backfillPhotoDerivatives(
    rows,
    async (row) => {
      if (row.id === "bad") throw new Error("下载超时");
      return { thumbnailUrl: "thumb", previewUrl: "preview", width: 10, height: 20 };
    },
    async (id) => { updated.push(id); },
  );

  assert.equal(result.succeeded, 1);
  assert.equal(result.skipped, 0);
  assert.deepEqual(result.failed, [{ id: "bad", error: "下载超时" }]);
  assert.deepEqual(updated, ["good"]);
});

test("operational backfill migrates preview_url and defaults to two workers", async () => {
  const [script, packageJson] = await Promise.all([
    readFile("scripts/backfill-photo-derivatives.ts", "utf8"),
    readFile("package.json", "utf8"),
  ]);
  assert.match(script, /PRAGMA table_info\(photos\)/);
  assert.match(script, /ALTER TABLE photos ADD COLUMN preview_url TEXT/);
  assert.match(script, /backfillPhotoDerivatives/);
  assert.match(script, /process\.exitCode = 1/);
  assert.match(packageJson, /"photos:backfill":\s*"tsx scripts\/backfill-photo-derivatives\.ts"/);
});
